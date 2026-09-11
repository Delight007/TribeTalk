import { create } from 'zustand';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

interface VoicePlayerStore {
  currentAudioId: string | null;
  currentAudioUrl: string | null;

  playbackState: PlaybackState;

  currentPosition: number;
  duration: number;

  setCurrentAudio: (id: string | null, url: string | null) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setProgress: (position: number, duration: number) => void;
  reset: () => void;
}

const getInitialState = () => ({
  currentAudioId: null,
  currentAudioUrl: null,
  playbackState: 'idle' as PlaybackState,
  currentPosition: 0,
  duration: 0,
});

export const useVoicePlayerStore = create<VoicePlayerStore>(set => ({
  ...getInitialState(),

  setCurrentAudio: (id, url) =>
    set({
      currentAudioId: id,
      currentAudioUrl: url,
    }),

  setPlaybackState: playbackState =>
    set({
      playbackState,
    }),

  setProgress: (position, duration) =>
    set({
      currentPosition: position,
      duration,
    }),

  reset: () => set(getInitialState()),
}));
