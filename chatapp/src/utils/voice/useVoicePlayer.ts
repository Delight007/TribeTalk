// hooks/useVoicePlayer.ts

import { useCallback } from 'react';
import { useVoicePlayerStore } from './useVoicePlayerStore';
import * as VoicePlayerService from './voicePlayerService';

export function useVoicePlayer() {
  // Select actions only. This hook is used by every VoiceNotePlayer,
  // so it must not subscribe to live playback position/duration state.
  const setCurrentAudio = useVoicePlayerStore(state => state.setCurrentAudio);
  const setPlaybackState = useVoicePlayerStore(state => state.setPlaybackState);
  const reset = useVoicePlayerStore(state => state.reset);

  const prepare = useCallback(
    (audioId: string, url: string, recordedDurationSeconds = 0) => {
      setCurrentAudio(audioId, url);
      useVoicePlayerStore
        .getState()
        .setProgress(0, Math.max(0, recordedDurationSeconds));
      setPlaybackState('playing');
    },
    [setCurrentAudio, setPlaybackState],
  );

  const play = useCallback(
    async (audioId: string, url: string, recordedDurationSeconds?: number) => {
      setCurrentAudio(audioId, url);
      setPlaybackState('playing');

      try {
        console.log('[VOICE PLAY REQUEST]', recordedDurationSeconds);
        await VoicePlayerService.play(url, recordedDurationSeconds);
        setPlaybackState('playing');
      } catch (error) {
        reset();
        throw error;
      }
    },
    [reset, setCurrentAudio, setPlaybackState],
  );

  const pause = useCallback(async () => {
    await VoicePlayerService.pause();
    setPlaybackState('paused');
  }, [setPlaybackState]);

  const resume = useCallback(async () => {
    await VoicePlayerService.resume();
    setPlaybackState('playing');
  }, [setPlaybackState]);

  const stop = useCallback(async () => {
    await VoicePlayerService.stop();
    reset();
  }, [reset]);

  // The UI sends seconds; voicePlayerService converts them to milliseconds.
  const seek = useCallback(async (positionSeconds: number) => {
    await VoicePlayerService.seek(positionSeconds);

    // Update the waveform and timer immediately after dragging.
    const { duration, setProgress } = useVoicePlayerStore.getState();

    setProgress(
      Math.max(0, Math.min(positionSeconds, duration || positionSeconds)),
      duration,
    );
  }, []);

  return { prepare, play, pause, resume, stop, seek, reset };
}
