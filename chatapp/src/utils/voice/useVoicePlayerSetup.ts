import { useEffect } from 'react';
import { useVoicePlayerStore } from './useVoicePlayerStore';
import * as VoicePlayerService from './voicePlayerService';

export function useVoicePlayerSetup() {
  useEffect(() => {
    // One global listener forwards real native audio timing to Zustand.
    VoicePlayerService.setCallbacks({
      onProgress: ({ currentPosition, duration }) => {
        useVoicePlayerStore.getState().setProgress(currentPosition, duration);
      },

      onComplete: () => {
        console.log('[VOICE STORE WRITE] Playback completed.');
        useVoicePlayerStore.getState().reset();
      },
    });

    // This runs only when ChatScreen itself closes—not when a message bubble
    // mounts/unmounts while scrolling.
    return () => {
      void VoicePlayerService.destroy();
    };
  }, []);
}
