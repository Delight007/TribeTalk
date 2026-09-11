import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useVoiceMessage } from '../../../../hooks/useVoiceMessage';
import { useVoicePlayer } from '../../../../utils/voice/useVoicePlayer';
import { useVoicePlayerState } from '../../../../utils/voice/useVoicePlayerState';
import { formatVoiceDuration } from '../../../../utils/voice/voiceAudio';
import VoiceWaveform from './VoiceWaveform';

interface Props {
  roomId: string;
  messageId: string;
  uri: string;
  localUri?: string | null;
  isUploading?: boolean;
  isDownloading?: boolean;
  waveform?: number[];
  duration?: number;
  isMe: boolean;
  isDark: boolean;
}

const VoiceNotePlayer = ({
  roomId,
  messageId,
  uri,
  localUri,
  isUploading,
  isDownloading,
  waveform,
  duration: propDuration,
  isMe,
  isDark,
}: Props) => {
  const { prepare, play, pause, resume, seek, reset } = useVoicePlayer();

  const {
    currentAudioId,
    playbackState,
    currentPosition,
    duration: storeDuration,
    isLoading,
  } = useVoicePlayerState(messageId);

  const { isDownloading: isPreparingAudio, getPlayableUri } = useVoiceMessage({
    roomId,
    messageId,
    remoteUri: uri,
    localUri,
  });
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubRatio, setScrubRatio] = React.useState(0);

  // active = this bubble is the one currently loaded in the player
  // (covers both "playing" and "paused mid-way"). Once a note finishes,
  // the store clears currentId, so this flips back to false automatically —
  // that's what makes the WhatsApp snap-back-to-full-length behavior work.
  const active = currentAudioId === messageId;
  const finalDuration =
    active && storeDuration > 0 ? storeDuration : (propDuration ?? 0);
  const backgroundColor = isMe
    ? isDark
      ? '#15803d' // green-700
      : '#22c55e' // green-500
    : isDark
      ? '#374151' // gray-700
      : '#e5e7eb'; // gray-200
  const useLightForeground = isMe || isDark;
  const foregroundColor = useLightForeground ? '#FFFFFF' : '#1f2937';
  const unplayedWaveColor = useLightForeground
    ? 'rgba(255,255,255,0.4)'
    : 'rgba(31,41,55,0.4)';
  const safeDuration = finalDuration || 0;
  const safePosition =
    safeDuration > 0
      ? Math.min(Math.max(0, currentPosition), safeDuration)
      : Math.max(0, currentPosition);

  const liveProgress =
    active && safeDuration > 0
      ? Math.min(1, Math.max(0, safePosition / safeDuration))
      : 0;

  const progress = isScrubbing
    ? Math.min(1, Math.max(0, scrubRatio))
    : liveProgress;
  const handleSeekStart = () => {
    if (isUploading) return;
    setIsScrubbing(true);
    setScrubRatio(liveProgress); // start the thumb from wherever it currently is
  };

  const handleSeekMove = (ratio: number) => {
    setScrubRatio(ratio); // live preview while dragging, no audio calls yet
  };

  const handleSeekEnd = async (ratio: number) => {
    setIsScrubbing(false);
    if (isUploading || !finalDuration) return;
    const targetSeconds = ratio * finalDuration;

    // Already loaded — just jump
    if (active) {
      await seek(targetSeconds);
      return;
    }

    if (localUri) {
      await play(messageId, localUri, propDuration);
      await seek(targetSeconds);
      return;
    }

    const playableUri = await getPlayableUri();

    if (!playableUri) {
      return;
    }

    await play(messageId, playableUri, propDuration ?? 0);
    await seek(targetSeconds);
  };

  const onPress = async () => {
    if (isUploading || isLoading || isPreparingAudio) {
      return;
    }

    if (active) {
      if (playbackState === 'playing') {
        await pause();
        return;
      }

      if (playbackState === 'paused') {
        await resume();
        return;
      }
    }

    prepare(messageId, localUri ?? uri, propDuration ?? 0);

    const playableUri = await getPlayableUri();

    if (!playableUri) {
      reset();
      return;
    }

    await play(messageId, playableUri, propDuration ?? 0);
  };

  const icon =
    isPreparingAudio || (active && playbackState === 'playing')
      ? 'pause'
      : 'play';
  // Single number, WhatsApp-style: elapsed while active (playing or paused),
  // total length once idle/finished.
  const displaySeconds = isScrubbing
    ? scrubRatio * safeDuration
    : active
      ? safePosition
      : (propDuration ?? 0);
  const FLAT_PLACEHOLDER = Array(32).fill(0.3);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.button}
        disabled={isLoading}
      >
        <Ionicons name={icon} size={32} color={foregroundColor} />
      </TouchableOpacity>

      <View style={styles.waveWrap}>
        <VoiceWaveform
          bars={waveform && waveform.length > 0 ? waveform : FLAT_PLACEHOLDER}
          progress={progress}
          playedColor={foregroundColor}
          unplayedColor={unplayedWaveColor}
          thumbColor={foregroundColor}
          onSeekStart={handleSeekStart}
          onSeekMove={handleSeekMove}
          onSeekEnd={handleSeekEnd}
        />
      </View>

      <Text style={[styles.time, { color: foregroundColor }]}>
        {formatVoiceDuration(Math.floor(displaySeconds))}
      </Text>
    </View>
  );
};

export default React.memo(VoiceNotePlayer);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 50,
    minWidth: 220,
  },
  button: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveWrap: {
    flex: 1,
    marginHorizontal: 10,
    height: 32,
  },
  time: {
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
    opacity: 0.9,
  },
});
