// /**
//  * useVoiceRecorder.ts
//  *
//  * Hook that drives the press-and-hold recording flow in ChatScreen.
//  * Uses nitroSoundAdapter so the component never imports the library directly.
//  */

// import { useCallback, useRef, useState } from 'react';
// import {
//   RecordBackCallback,
//   requestMicrophonePermission,
//   startRecorder,
//   stopRecorder,
// } from '../utils/voice/nitroSoundAdapter';
// import {
//   downsampleWaveform,
//   MIN_RECORDING_MS,
//   setupAudioMode,
//   WAVEFORM_BAR_COUNT,
// } from '../utils/voice/voiceAudio';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface VoiceRecordResult {
//   uri: string;
//   duration: number; // seconds
//   waveform: number[]; // normalised bar heights 0–1, length = WAVEFORM_BAR_COUNT
// }

// export interface UseVoiceRecorderReturn {
//   isRecording: boolean;
//   /** Elapsed seconds since recording started (updates ~every 100 ms). */
//   recordingSeconds: number;
//   /** Live waveform bars for the recording indicator UI. */
//   liveBars: number[];
//   startRecording: () => Promise<boolean>;
//   stopRecording: () => Promise<VoiceRecordResult | null>;
// }

// // ─── Hook ─────────────────────────────────────────────────────────────────────

// export function useVoiceRecorder(): UseVoiceRecorderReturn {
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingSeconds, setRecordingSeconds] = useState(0);
//   const [liveBars, setLiveBars] = useState<number[]>(
//     Array(WAVEFORM_BAR_COUNT).fill(0.15),
//   );

//   // Accumulate metering samples so we can build a waveform on stop
//   const meteringRef = useRef<number[]>([]);
//   const startTimeRef = useRef<number>(0);

//   // ── start ──────────────────────────────────────────────────────────────────
//   const startRecording = useCallback(async (): Promise<boolean> => {
//     try {
//       // 1. Permission first
//       const hasPermission = await requestMicrophonePermission();
//       if (!hasPermission) return false;

//       // 2. Audio mode
//       await setupAudioMode(true);

//       const onProgress: RecordBackCallback = e => {
//         const currentMs = e.currentPosition || 0;

//         // ⏱ timer
//         setRecordingSeconds(Math.floor(currentMs / 1000));

//         // 🎤 REAL waveform (from native mic)
//         if (e.currentMetering !== undefined) {
//           const level = Math.max(
//             0,
//             Math.min(1, (e.currentMetering + 160) / 160),
//           );

//           meteringRef.current.push(level);

//           // keep last N values only (important!)
//           if (meteringRef.current.length > 100) {
//             meteringRef.current.shift();
//           }

//           setLiveBars(downsampleWaveform(meteringRef.current));
//         }
//       };

//       meteringRef.current = [];
//       startTimeRef.current = Date.now();

//       // 3. Start (adapter now defensively stops any stale session internally)
//       await startRecorder(undefined, onProgress);
//       setIsRecording(true);
//       setRecordingSeconds(0);
//       return true;
//     } catch (err) {
//       console.error('[useVoiceRecorder] startRecording failed:', err);
//       return false;
//     }
//   }, []);

//   // ── stop ───────────────────────────────────────────────────────────────────
//   const stopRecording =
//     useCallback(async (): Promise<VoiceRecordResult | null> => {
//       try {
//         const elapsed = Date.now() - startTimeRef.current;

//         // Discard very short taps (accidental presses)
//         if (elapsed < MIN_RECORDING_MS) {
//           await stopRecorder().catch(() => {});
//           setIsRecording(false);
//           setRecordingSeconds(0);
//           setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
//           meteringRef.current = [];
//           return null;
//         }

//         const uri = await stopRecorder();

//         const duration = elapsed / 1000;
//         const waveform = downsampleWaveform(meteringRef.current);

//         // Reset UI state
//         setIsRecording(false);
//         setRecordingSeconds(0);
//         setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
//         meteringRef.current = [];

//         await setupAudioMode(false);

//         return { uri, duration, waveform };
//       } catch (err) {
//         console.error('[useVoiceRecorder] stopRecording failed:', err);
//         setIsRecording(false);
//         setRecordingSeconds(0);
//         return null;
//       }
//     }, []);

//   return {
//     isRecording,
//     recordingSeconds,
//     liveBars,
//     startRecording,
//     stopRecording,
//   };
// }

import { useCallback, useRef, useState } from 'react';

import {
  RecordBackCallback,
  requestMicrophonePermission,
  startRecorder,
  stopRecorder,
} from '../utils/voice/nitroSoundAdapter';

import {
  downsampleWaveform,
  MIN_RECORDING_MS,
  setupAudioMode,
  WAVEFORM_BAR_COUNT,
} from '../utils/voice/voiceAudio';

export interface VoiceRecordResult {
  uri: string;
  duration: number;
  waveform: number[];
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  recordingSeconds: number;
  liveBars: number[];
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<VoiceRecordResult | null>;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveBars, setLiveBars] = useState<number[]>(
    Array(WAVEFORM_BAR_COUNT).fill(0.15),
  );

  const meteringRef = useRef<number[]>([]);

  // Native Nitro Sound recording duration in milliseconds.
  const recordingDurationMsRef = useRef(0);
  const recordingStartedAtRef = useRef<number | null>(null);

  const resetRecordingUI = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
    meteringRef.current = [];
    recordingDurationMsRef.current = 0;
    recordingStartedAtRef.current = null;
  };

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await requestMicrophonePermission();

      if (!hasPermission) return false;

      await setupAudioMode(true);

      meteringRef.current = [];
      recordingDurationMsRef.current = 0;

      const onProgress: RecordBackCallback = event => {
        const currentMs = event.currentPosition ?? 0;

        // This is the real recording duration from the native recorder.
        recordingDurationMsRef.current = Math.max(
          recordingDurationMsRef.current,
          currentMs,
        );

        setRecordingSeconds(Math.floor(currentMs / 1000));

        if (event.currentMetering !== undefined) {
          const level = Math.max(
            0,
            Math.min(1, (event.currentMetering + 160) / 160),
          );

          meteringRef.current.push(level);

          if (meteringRef.current.length > 100) {
            meteringRef.current.shift();
          }

          setLiveBars(downsampleWaveform(meteringRef.current));
        }
      };

      // Show the recording interface before native audio capture begins.
      setIsRecording(true);
      setRecordingSeconds(0);

      // Allow React Native one frame to paint the recording UI first.
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      });
      recordingStartedAtRef.current = Date.now();
      await startRecorder(undefined, onProgress);

      return true;
    } catch (error) {
      console.error('[useVoiceRecorder] startRecording failed:', error);
      await setupAudioMode(false).catch(() => {});
      setIsRecording(false);
      setRecordingSeconds(0);
      return false;
    }
  }, []);

  const stopRecording =
    useCallback(async (): Promise<VoiceRecordResult | null> => {
      try {
        const fallbackMs = recordingStartedAtRef.current
          ? Date.now() - recordingStartedAtRef.current
          : 0;

        const recordedMs = recordingDurationMsRef.current || fallbackMs;

        if (recordedMs < MIN_RECORDING_MS) {
          await stopRecorder().catch(() => {});
          await setupAudioMode(false).catch(() => {});
          resetRecordingUI();

          return null;
        }
        // Visually stop the recording immediately when the finger is released.
        // Keep refs intact so the final waveform/duration can still be saved.
        setIsRecording(false);
        setRecordingSeconds(0);
        setLiveBars(Array(WAVEFORM_BAR_COUNT).fill(0.15));
        const uri = await stopRecorder();

        // Use the last native recorder progress value—not a JavaScript clock.
        const duration = recordedMs / 1000;
        const waveform = downsampleWaveform(meteringRef.current);

        await setupAudioMode(false);
        resetRecordingUI();

        return { uri, duration, waveform };
      } catch (error) {
        console.error('[useVoiceRecorder] stopRecording failed:', error);
        await setupAudioMode(false).catch(() => {});
        resetRecordingUI();

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
