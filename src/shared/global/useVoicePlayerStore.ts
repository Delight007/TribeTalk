// // import Sound from 'react-native-nitro-sound';
// const Sound = require('react-native-nitro-sound') as any;

// import { create } from 'zustand';
// import { getCachedVoiceUri } from '../../utils/voiceCache';

// type VoicePlayerState = {
//   currentMessageId: string | null;
//   isPlaying: boolean;
//   duration: number;
//   position: number;

//   play: (messageId: string, remoteUri: string) => Promise<void>;
//   pause: () => void;
//   stop: () => void;
//   seek: (seconds: number) => void;
// };

// let sound: any = null;
// let progressInterval: number | null = null;

// export const useVoicePlayerStore = create<VoicePlayerState>((set, get) => ({
//   currentMessageId: null,
//   isPlaying: false,
//   duration: 0,
//   position: 0,

//   play: async (messageId, remoteUri) => {
//     const { currentMessageId } = get();

//     if (currentMessageId === messageId && sound) {
//       get().pause();
//       return;
//     }

//     get().stop();

//     const localUri = await getCachedVoiceUri(messageId, remoteUri);

//     sound = new Sound(localUri, '', (error: any) => {
//       if (error) {
//         console.log('Failed to load sound', error);
//         return;
//       }

//       set({
//         currentMessageId: messageId,
//         duration: sound!.getDuration(),
//         isPlaying: true,
//       });

//       sound!.play(() => get().stop());
//     });

//     progressInterval = setInterval(() => {
//       if (!sound) return;
//       sound.getCurrentTime((seconds: any) => {
//         set({ position: seconds });
//       });
//     }, 200);
//   },

//   pause: () => {
//     if (!sound) return;
//     sound.pause();
//     set({ isPlaying: false });
//   },

//   stop: () => {
//     if (sound) {
//       sound.stop();
//       sound.release();
//       sound = null;
//     }

//     if (progressInterval) {
//       clearInterval(progressInterval);
//       progressInterval = null;
//     }

//     set({
//       currentMessageId: null,
//       isPlaying: false,
//       position: 0,
//       duration: 0,
//     });
//   },

//   seek: (seconds) => {
//     if (!sound) return;
//     sound.setCurrentTime(seconds);
//     set({ position: seconds });
//   },
// }));
