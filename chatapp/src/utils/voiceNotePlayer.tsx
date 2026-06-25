import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useChatStore } from '../shared/global/chatStore';

import VoiceWaveform from '../domains/main/components/VoiceWaveform';
import { useVoiceStore } from '../shared/global/useVoicePlayerStore';
import { formatVoiceDuration, generateWaveform } from './voiceAudio';
import { downloadVoiceFile } from './voiceCache';

interface Props {
  roomId: string;
  messageId: string;
  uri: string;
  localUri?: string | null;
  isMe: boolean;
  isUploading?: boolean;
  isDownloading?: boolean;
  waveform?: number[];
  duration?: number;
}

const VoiceNotePlayer = ({
  roomId,
  messageId,
  uri,
  localUri,
  isMe,
  isUploading,
  isDownloading,
  waveform,
  duration: propDuration,
}: Props) => {
  const source = localUri;
  const { updateLocalUri } = useChatStore();
  const {
    play,
    pause,
    seek,
    currentId,
    isPlaying,
    position,
    duration: storeDuration,
    isLoading,
  } = useVoiceStore();
  const [loading, setLoading] = React.useState(false);
  const active = currentId === messageId;
  const finalDuration = active ? storeDuration : (propDuration ?? 0);
  // Prefer real duration from store, fallback to prop (for uploads)

  const safeDuration = finalDuration || 0;
  const safePosition = Math.min(position, safeDuration);

  const progress = active && safeDuration > 0 ? safePosition / safeDuration : 0;
  // Use real waveform if provided, otherwise generate placeholder
  const bars = React.useMemo(() => {
    return waveform ?? generateWaveform(messageId);
  }, [waveform, messageId]);

  // const onPress = () => {
  //   if (!source || isUploading || isDownloading || isLoading) return;
  //   if (active && isPlaying) {
  //     console.log(
  //       `[VoiceNotePlayer] PAUSE CLICKED - MessageId: ${messageId}, Source: ${source}`,
  //     );
  //     pause();
  //   } else {
  //     console.log(
  //       `[VoiceNotePlayer] PLAY CLICKED - MessageId: ${messageId}, Source: ${source}, isLocalUri: ${!!localUri}`,
  //     );
  //     play(messageId, source);
  //   }
  // };

  const onPress = async () => {
    if (loading || isUploading || isLoading) return;

    setLoading(true);
    try {
      let playableSource = localUri;

      if (!playableSource) {
        playableSource = await downloadVoiceFile(uri);

        if (!playableSource) return;

        updateLocalUri(roomId, messageId, playableSource);
      }

      if (active && isPlaying) {
        pause();
      } else {
        play(messageId, playableSource);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSeek = (ratio: number) => {
    if (!active || !finalDuration || isLoading) return;
    seek(ratio * finalDuration);
  };

  const icon = active && isPlaying ? 'pause' : 'play';
  const color = isMe ? '#fff' : '#000';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.button}
        disabled={isLoading}
      >
        {isUploading || isDownloading ? (
          <ActivityIndicator color={color} />
        ) : (
          <Ionicons name={icon} size={32} color={color} />
        )}
      </TouchableOpacity>

      <View style={styles.waveWrap}>
        <VoiceWaveform
          bars={bars}
          progress={progress}
          playedColor={color}
          unplayedColor="#999"
          onSeek={onSeek}
        />
      </View>

      <Text style={[styles.time, { color }]}>
        {active
          ? formatVoiceDuration(Math.floor(Math.min(position, finalDuration)))
          : formatVoiceDuration(0)}
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
    borderRadius: 18,
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
  },
});
