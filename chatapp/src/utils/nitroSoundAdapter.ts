// src/utils/nitroSoundAdapter.ts

import { PermissionsAndroid, Platform } from 'react-native';
import Sound, {
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-nitro-sound';

// Singleton instance
const arp = Sound;

// Store the current playback listener to allow cleanup
let currentPlaybackListener: ((e: PlayBackType) => void) | null = null;

// --- Audio Mode (keep your existing implementation) ---
export async function setAudioMode(forRecording: boolean): Promise<void> {
  if (__DEV__) {
    console.log(
      `[nitroSoundAdapter] setAudioMode: ${forRecording ? 'record' : 'play'}`,
    );
  }
  const SoundModule = require('react-native-nitro-sound').default;
  if (forRecording) {
    await SoundModule.setMode?.('recording');
  } else {
    await SoundModule.setMode?.('playback');
  }
}

// --- Permissions (keep your existing implementation) ---
export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.log('Permission error:', err);
      return false;
    }
  }
  return true;
}

// --- Recording Options (keep your existing implementation) ---
export const VOICE_RECORDING_OPTIONS: AudioSet = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSamplingRate: 44100,
  AudioChannels: 1,
  AudioEncodingBitRate: 128000,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 1,
  AVFormatIDKeyIOS: 'aac',
};

// --- Recording (keep your existing implementation) ---
export type RecordBackCallback = (e: RecordBackType) => void;

export async function startRecorder(
  uri?: string,
  onProgress?: RecordBackCallback,
): Promise<string> {
  try {
    await arp.stopRecorder();
  } catch (_) {
    // Ignore
  }
  if (onProgress) {
    arp.addRecordBackListener(onProgress);
  }
  return arp.startRecorder(uri, VOICE_RECORDING_OPTIONS, true);
}

export async function stopRecorder(): Promise<string> {
  const result = await arp.stopRecorder();
  arp.removeRecordBackListener();
  return result;
}

// --- Playback (CORRECTED) ---
export type PlayBackCallback = (e: PlayBackType) => void;

/**
 * Creates a new player for the given URI.
 * Progress updates are provided via the onProgress callback.
 *
 * @param uri - The URI of the audio file to play.
 * @param onProgress - A callback that receives PlayBackType updates.
 * @returns An object with control methods.
 */
// --- Playback ---

export async function createPlayer(uri: string, onProgress: PlayBackCallback) {
  // Clean up any previous playback/listener
  await destroyPlayer();

  // Smooth progress updates
  arp.setSubscriptionDuration(100);

  // Register playback listener
  currentPlaybackListener = onProgress;

  arp.addPlayBackListener((e: PlayBackType) => {
    onProgress(e);
  });

  // Start playback
  await arp.startPlayer(uri);

  // Return player API
  return {
    playAsync: async () => {
      await arp.resumePlayer();
    },

    pauseAsync: async () => {
      await arp.pausePlayer();
    },

    setPositionAsync: async (ms: number) => {
      await arp.seekToPlayer(ms);
    },

    unloadAsync: async () => {
      await destroyPlayer();
    },
  };
}

async function destroyPlayer() {
  try {
    arp.removePlayBackListener();
  } catch {}

  currentPlaybackListener = null;

  try {
    await arp.stopPlayer();
  } catch {}
}
