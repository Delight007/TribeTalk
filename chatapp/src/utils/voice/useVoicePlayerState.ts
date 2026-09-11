// hooks/useVoicePlayerState.ts

import { useVoicePlayerStore } from './useVoicePlayerStore';

/**
 * Only the active voice-note bubble receives changing position/duration values.
 * Every inactive bubble stays on its saved message duration and does not
 * re-render during native playback updates.
 */
export function useVoicePlayerState(messageId: string) {
  const currentAudioId = useVoicePlayerStore(state => state.currentAudioId);

  const playbackState = useVoicePlayerStore(state =>
    state.currentAudioId === messageId ? state.playbackState : 'idle',
  );

  const currentPosition = useVoicePlayerStore(state =>
    state.currentAudioId === messageId ? state.currentPosition : 0,
  );

  const duration = useVoicePlayerStore(state =>
    state.currentAudioId === messageId ? state.duration : 0,
  );

  const active = currentAudioId === messageId;

  return {
    currentAudioId,
    active,
    playbackState,
    currentPosition,
    duration,
    isLoading: active && playbackState === 'loading',
    isPlaying: active && playbackState === 'playing',
    isPaused: active && playbackState === 'paused',
  };
}
