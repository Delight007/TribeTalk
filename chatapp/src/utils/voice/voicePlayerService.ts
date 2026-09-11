// import Sound from 'react-native-nitro-sound';

// const player = Sound;

// type PlaybackProgress = {
//   currentPosition: number; // seconds
//   duration: number; // seconds
// };

// interface PlayerCallbacks {
//   onProgress?: (event: PlaybackProgress) => void;
//   onComplete?: () => void;
// }

// let currentUrl: string | null = null;
// let isPlaying = false;
// let isPaused = false;
// let callbacks: PlayerCallbacks = {};
// let hasCompleted = false;

// export const setCallbacks = (newCallbacks: PlayerCallbacks) => {
//   callbacks = newCallbacks;
// };

// const millisecondsToSeconds = (milliseconds: number) => milliseconds / 1000;
// const completePlayback = () => {
//   if (hasCompleted) return;

//   hasCompleted = true;
//   isPlaying = false;
//   isPaused = false;
//   currentUrl = null;

//   callbacks.onComplete?.();
// };

// // const setupListeners = () => {
// //   player.removePlayBackListener();
// //   player.removePlaybackEndListener();

// //   player.setSubscriptionDuration(0.1);

// //   player.addPlayBackListener(event => {
// //     callbacks.onProgress?.({
// //       currentPosition: millisecondsToSeconds(event.currentPosition),
// //       duration: millisecondsToSeconds(event.duration),
// //     });
// //   });

// //   player.addPlaybackEndListener(() => {
// //     isPlaying = false;
// //     isPaused = false;
// //     currentUrl = null;
// //     callbacks.onComplete?.();
// //   });
// // };
// const setupListeners = () => {
//   player.removePlayBackListener();
//   player.removePlaybackEndListener();

//   player.setSubscriptionDuration(0.1);

//   // player.addPlayBackListener(event => {
//   //   const currentPosition = millisecondsToSeconds(event.currentPosition);
//   //   const duration = millisecondsToSeconds(event.duration);

//   //   callbacks.onProgress?.({
//   //     currentPosition,
//   //     duration,
//   //   });

//   //   // Fallback: some Android devices do not always fire the separate
//   //   // playback-end callback. The final progress event is equally reliable.
//   //   if (duration > 0 && currentPosition >= duration) {
//   //     completePlayback();
//   //   }
//   // });
//   player.addPlayBackListener(event => {
//     const currentPosition = millisecondsToSeconds(event.currentPosition);
//     const duration = millisecondsToSeconds(event.duration);

//     callbacks.onProgress?.({
//       currentPosition,
//       duration,
//     });

//     if (duration > 0 && currentPosition >= duration) {
//       completePlayback();
//     }
//   });
//   player.addPlaybackEndListener(() => {
//     completePlayback();
//   });
// };

// export const play = async (url: string, _recordedDurationSeconds?: number) => {
//   if (currentUrl === url && isPaused) {
//     await resume();
//     return;
//   }
//   if (currentUrl === url && isPlaying) {
//     return;
//   }

//   if (currentUrl && currentUrl !== url) {
//     await stop();
//   }
//   hasCompleted = false;

//   currentUrl = url;
//   setupListeners();

//   try {
//     await player.startPlayer(url);
//     isPlaying = true;
//     isPaused = false;
//   } catch (error) {
//     currentUrl = null;
//     isPlaying = false;
//     isPaused = false;
//     throw error;
//   }
// };

// export const pause = async () => {
//   if (!isPlaying) return;

//   await player.pausePlayer();
//   isPlaying = false;
//   isPaused = true;
// };

// export const resume = async () => {
//   if (!isPaused) return;

//   await player.resumePlayer();
//   isPlaying = true;
//   isPaused = false;
// };

// export const stop = async () => {
//   player.removePlayBackListener();
//   player.removePlaybackEndListener();

//   await player.stopPlayer();

//   isPlaying = false;
//   isPaused = false;
//   currentUrl = null;
// };

// export const seek = async (positionSeconds: number) => {
//   await player.seekToPlayer(Math.max(0, positionSeconds) * 1000);
// };

// export const destroy = async () => {
//   await stop();
//   callbacks = {};
// };

import Sound from 'react-native-nitro-sound';

const player = Sound;

type PlaybackProgress = {
  currentPosition: number; // seconds
  duration: number; // seconds
};

interface PlayerCallbacks {
  onProgress?: (event: PlaybackProgress) => void;
  onComplete?: () => void;
}

let currentUrl: string | null = null;
let isPlaying = false;
let isPaused = false;
let callbacks: PlayerCallbacks = {};
let hasCompleted = false;
let knownDurationSeconds = 0;
let playbackPositionSeconds = 0;
let playbackStartedAtMs: number | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;

export const setCallbacks = (newCallbacks: PlayerCallbacks) => {
  callbacks = newCallbacks;
};

const millisecondsToSeconds = (milliseconds: number) => milliseconds / 1000;

const emitProgress = (positionSeconds = playbackPositionSeconds) => {
  const currentPosition = knownDurationSeconds
    ? Math.min(Math.max(0, positionSeconds), knownDurationSeconds)
    : Math.max(0, positionSeconds);

  playbackPositionSeconds = currentPosition;
  callbacks.onProgress?.({
    currentPosition,
    duration: knownDurationSeconds,
  });
};

const stopProgressTimer = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
};

const startProgressTimer = () => {
  stopProgressTimer();
  playbackStartedAtMs = Date.now() - playbackPositionSeconds * 1000;
  progressTimer = setInterval(() => {
    if (playbackStartedAtMs === null) return;
    emitProgress((Date.now() - playbackStartedAtMs) / 1000);
  }, 50);
};

const completePlayback = () => {
  if (hasCompleted) return;

  hasCompleted = true;
  stopProgressTimer();

  // Stop late native progress events from writing after Zustand resets.
  player.removePlayBackListener();
  player.removePlaybackEndListener();

  isPlaying = false;
  isPaused = false;
  currentUrl = null;
  knownDurationSeconds = 0;
  playbackPositionSeconds = 0;
  playbackStartedAtMs = null;

  callbacks.onComplete?.();
};

const setupListeners = () => {
  player.removePlayBackListener();
  player.removePlaybackEndListener();

  // More frequent native updates. Smooth visual motion will be handled
  // in VoiceWaveform, but this improves the source progress accuracy.
  player.setSubscriptionDuration(0.1);

  player.addPlayBackListener(event => {
    const rawDuration = millisecondsToSeconds(event.duration ?? 0);

    // Nitro's real duration replaces the saved recording duration once available.
    if (rawDuration > 0) {
      knownDurationSeconds = rawDuration;
    }

    emitProgress();
  });

  player.addPlaybackEndListener(() => {
    completePlayback();
  });
};

export const play = async (
  url: string,
  recordedDurationSeconds: number = 0,
) => {
  if (currentUrl === url && isPaused) {
    await resume();
    return;
  }

  if (currentUrl === url && isPlaying) {
    return;
  }

  if (currentUrl && currentUrl !== url) {
    await stop();
  }

  hasCompleted = false;
  currentUrl = url;
  knownDurationSeconds = Math.max(0, recordedDurationSeconds);
  playbackPositionSeconds = 0;
  playbackStartedAtMs = null;

  setupListeners();

  // Makes the duration/waveform begin from the visible first bar immediately.
  emitProgress(0);

  try {
    isPlaying = true;
    isPaused = false;
    startProgressTimer();
    await player.startPlayer(url);
  } catch (error) {
    stopProgressTimer();
    currentUrl = null;
    isPlaying = false;
    isPaused = false;
    knownDurationSeconds = 0;
    playbackPositionSeconds = 0;
    playbackStartedAtMs = null;
    throw error;
  }
};

export const pause = async () => {
  if (!isPlaying) return;

  if (playbackStartedAtMs !== null) {
    playbackPositionSeconds = (Date.now() - playbackStartedAtMs) / 1000;
  }
  stopProgressTimer();
  await player.pausePlayer();
  isPlaying = false;
  isPaused = true;
};

export const resume = async () => {
  if (!isPaused) return;

  await player.resumePlayer();
  isPlaying = true;
  isPaused = false;
  startProgressTimer();
};

export const stop = async () => {
  stopProgressTimer();
  player.removePlayBackListener();
  player.removePlaybackEndListener();

  await player.stopPlayer();

  isPlaying = false;
  isPaused = false;
  currentUrl = null;
  knownDurationSeconds = 0;
  playbackPositionSeconds = 0;
  playbackStartedAtMs = null;
  hasCompleted = false;
};

export const seek = async (positionSeconds: number) => {
  const safePosition = Math.max(
    0,
    Math.min(positionSeconds, knownDurationSeconds || positionSeconds),
  );

  await player.seekToPlayer(safePosition * 1000);
  playbackPositionSeconds = safePosition;
  if (isPlaying) {
    playbackStartedAtMs = Date.now() - safePosition * 1000;
  }
  emitProgress(safePosition);
};

export const destroy = async () => {
  await stop();
  callbacks = {};
};
