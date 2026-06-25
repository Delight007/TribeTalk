/**
 * useVoiceRecorder.ts
 *
 * Hook that drives the press-and-hold recording flow in ChatScreen.
 * Uses nitroSoundAdapter so the component never imports the library directly.
 */

import { useCallback, useRef, useState } from 'react';
import {
  RecordBackCallback,
  requestMicrophonePermission,
  startRecorder,
  stopRecorder,
} from '../utils/nitroSoundAdapter';
import {
  downsampleWaveform,
  MIN_RECORDING_MS,
  setupAudioMode,
  WAVEFORM_BAR_COUNT,
} from '../utils/voiceAudio';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceRecordResult {
  uri: string;
  duration: number; // seconds
  waveform: number[]; // normalised bar heights 0–1, length = WAVEFORM_BAR_COUNT
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  /** Elapsed seconds since recording started (updates ~every 100 ms). */
  recordingSeconds: number;
  /** Live waveform bars for the recording indicator UI. */
  liveBars: number[];
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<VoiceRecordResult | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveBars, setLiveBars] = useState<number[]>(
    Array(WAVEFORM_BAR_COUNT).fill(0.15),
  );

  // Accumulate metering samples so we can build a waveform on stop
  const meteringRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // ── start ──────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return false;

      // 2. Audio mode
      await setupAudioMode(true);

      const onProgress: RecordBackCallback = e => {
        const currentMs = e.currentPosition || 0;

        // ⏱ timer
        setRecordingSeconds(Math.floor(currentMs / 1000));

        // 🎤 REAL waveform (from native mic)
        if (e.currentMetering !== undefined) {
          const level = Math.max(
            0,
            Math.min(1, (e.currentMetering + 160) / 160),
          );

          meteringRef.current.push(level);

          // keep last N values only (important!)
          if (meteringRef.current.length > 100) {
            meteringRef.current.shift();
          }

          setLiveBars(downsampleWaveform(meteringRef.current));
        }
      };

      meteringRef.current = [];
      startTimeRef.current = Date.now();

      // 3. Start (adapter now defensively stops any stale session internally)
      await startRecorder(undefined, onProgress);
      setIsRecording(true);
      setRecordingSeconds(0);
      return true;
    } catch (err) {
      console.error('[useVoiceRecorder] startRecording failed:', err);
      return false;
    }
  }, []);

  // ── stop ───────────────────────────────────────────────────────────────────
  const stopRecording =
    useCallback(async (): Promise<VoiceRecordResult | null> => {
      try {
        const elapsed = Date.now() - startTimeRef.current;

        // Discard very short taps (accidental presses)
        if (elapsed < MIN_RECORDING_MS) {
          await stopRecorder().catch(() => {});
          setIsRecording(false);
          setRecordingSeconds(0);
          setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
          meteringRef.current = [];
          return null;
        }

        const uri = await stopRecorder();

        const duration = elapsed / 1000;
        const waveform = downsampleWaveform(meteringRef.current);

        // Reset UI state
        setIsRecording(false);
        setRecordingSeconds(0);
        setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
        meteringRef.current = [];

        await setupAudioMode(false);

        return { uri, duration, waveform };
      } catch (err) {
        console.error('[useVoiceRecorder] stopRecording failed:', err);
        setIsRecording(false);
        setRecordingSeconds(0);
        return null;
      }
    }, []);

  return {
    isRecording,
    recordingSeconds,
    liveBars,
    startRecording,
    stopRecording,
  };
}
