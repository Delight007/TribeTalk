import { create } from 'zustand';
import { createPlayer } from '../../utils/nitroSoundAdapter';

type Player = Awaited<ReturnType<typeof createPlayer>>;

type VoiceState = {
  sound: Player | null;
  currentId: string | null;

  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;

  play: (id: string, uri: string) => Promise<void>;
  pause: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  sound: null,
  currentId: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  isLoading: false,

  play: async (id, uri) => {
    await get().stop();
    set({
      currentId: id,
      isLoading: true,
      position: 0,
      duration: 0,
      isPlaying: false,
    });

    try {
      const sound = await createPlayer(uri, e => {
        // Ignore events from an old player
        if (get().currentId !== id) {
          return;
        }

        const rawPosition = (e.currentPosition ?? 0) / 1000;
        const duration = (e.duration ?? 0) / 1000;

        const position = Math.min(rawPosition, duration);
        const isFinished = duration > 0 && rawPosition >= duration;

        set({
          position,
          duration,
          isPlaying: !isFinished,
          isLoading: false,
        });

        if (isFinished) {
          get().stop();
        }
      });
      set({ sound });
      await sound.playAsync();
      set({ isPlaying: true });
    } catch (err) {
      console.error(err);
      set({ isLoading: false, currentId: null });
    }
  },

  pause: async () => {
    const { sound } = get();
    if (!sound) return;
    await sound.pauseAsync();
    set({ isPlaying: false });
  },

  seek: async seconds => {
    const { sound, duration } = get();
    if (!sound) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    await sound.setPositionAsync(clamped * 1000);
    set({ position: clamped });
  },

  stop: async () => {
    const { sound } = get();

    try {
      if (sound) {
        await sound.unloadAsync();
      }
    } catch (err) {
      console.warn('Failed to unload player', err);
    }

    set({
      sound: null,
      currentId: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      isLoading: false,
    });
  },
}));
