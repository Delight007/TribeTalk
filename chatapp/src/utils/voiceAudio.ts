import { setAudioMode, requestMicrophonePermission as adapterRequestMicrophonePermission, VOICE_RECORDING_OPTIONS as ADAPTER_VOICE_RECORDING_OPTIONS } from './nitroSoundAdapter';

export const WAVEFORM_BAR_COUNT = 32;
export const MIN_RECORDING_MS = 800;

let lastAudioMode: 'record' | 'play' | null = null;

export async function setupAudioMode(forRecording = false) {
  if (lastAudioMode === (forRecording ? 'record' : 'play')) return;
  await setAudioMode(forRecording);
  lastAudioMode = forRecording ? 'record' : 'play';
}

export async function requestMicrophonePermission(): Promise<boolean> {
  return await adapterRequestMicrophonePermission();
}

/** Map dBFS (-160..0) to normalized bar height (0.12..1). */
export function normalizeMetering(db?: number): number {
  if (db == null || db <= -160) return 0.12;
  const clamped = Math.max(-60, Math.min(0, db));
  return 0.12 + ((clamped + 60) / 60) * 0.88;
}

export function downsampleWaveform(
  samples: number[],
  barCount = WAVEFORM_BAR_COUNT,
): number[] {
  if (samples.length === 0) {
    return generateWaveform('empty', barCount);
  }
  if (samples.length <= barCount) {
    return padWaveform(samples, barCount);
  }

  const chunkSize = samples.length / barCount;
  return Array.from({ length: barCount }, (_, i) => {
    const start = Math.floor(i * chunkSize);
    const end = Math.floor((i + 1) * chunkSize);
    const chunk = samples.slice(start, Math.max(start + 1, end));
    const peak = Math.max(...chunk);
    return Math.max(0.12, Math.min(1, peak));
  });
}

export function padWaveform(samples: number[], barCount: number): number[] {
  if (samples.length >= barCount) return samples.slice(0, barCount);
  const padded = [...samples];
  while (padded.length < barCount) {
    padded.push(padded[padded.length - 1] ?? 0.25);
  }
  return padded;
}

/** Deterministic pseudo-waveform so each message looks consistent. */
export function generateWaveform(
  seed: string,
  barCount = WAVEFORM_BAR_COUNT,
): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  return Array.from({ length: barCount }, (_, i) => {
    const v = Math.abs(Math.sin(hash * 0.017 + i * 1.31) * 10000) % 1;
    return 0.18 + v * 0.72;
  });
}

export function formatVoiceDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = String(safe % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export const VOICE_RECORDING_OPTIONS: any = ADAPTER_VOICE_RECORDING_OPTIONS;
