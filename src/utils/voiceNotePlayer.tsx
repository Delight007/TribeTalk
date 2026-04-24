import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Sound from 'react-native-nitro-sound';

interface VoiceNotePlayerProps {
  uri: string;
  localUri?: string | null;
  isMe: boolean;
  isDark?: boolean;
  duration?: number; // in seconds
  isUploading?: boolean;
  isDownloading?: boolean;
  uploadProgress?: number;
}

const BAR_COUNT = 30;

// Pre-generate static waveform shape — normalized 0–1
const STATIC_BAR_HEIGHTS = Array.from(
  { length: BAR_COUNT },
  () => Math.random() * 0.75 + 0.25,
);

export default function VoiceNotePlayer({
  uri,
  localUri,
  isMe,
  isDark = false,
  duration = 0,
  isUploading = false,
  isDownloading = false,
}: VoiceNotePlayerProps) {
  const filePath = localUri;

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1 playback position
  const [elapsed, setElapsed] = useState(0); // seconds elapsed
  const [totalDuration, setTotalDuration] = useState<number>(
    duration > 0 ? duration : 0,
  );

  // One Animated.Value per bar — scale multiplier while playing
  const barScales = useRef(
    STATIC_BAR_HEIGHTS.map(() => new Animated.Value(1)),
  ).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // ---- Sync duration prop ----
  useEffect(() => {
    if (duration > 0 && !playing) setTotalDuration(duration);
  }, [duration, playing]);

  // ---- File ready ----
  useEffect(() => {
    if (filePath) setLoading(false);
  }, [filePath]);

  // ---- Bar animation: gentle pulse while playing ----
  useEffect(() => {
    if (!playing) {
      animationRef.current?.stop();
      animationRef.current = null;
      barScales.forEach(s => s.setValue(1));
      return;
    }

    animationRef.current = Animated.loop(
      Animated.stagger(
        35,
        barScales.map(scale =>
          Animated.sequence([
            Animated.timing(scale, {
              toValue: Math.random() * 0.55 + 0.85, // 0.85–1.4
              duration: 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ),
      ),
    );
    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
      barScales.forEach(s => s.setValue(1));
    };
  }, [playing]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      Sound.removePlayBackListener();
    };
  }, []);

  // ---- Play / Pause handler ----
  const onPressPlay = async () => {
    console.log('PLAYING FROM:', filePath);

    if (hasError) {
      setHasError(false);
      setProgress(0);
      setElapsed(0);
    }

    if (playing) {
      setPlaying(false); // ✅ update UI instantly

      try {
        await Sound.pausePlayer();
      } catch (err) {
        console.warn('Pause error:', err);
      }

      Sound.removePlayBackListener();
    } else {
      // ✅ UPDATE UI FIRST
      setPlaying(true);
      setHasError(false);

      // 👇 run heavy stuff AFTER UI update
      requestAnimationFrame(async () => {
        try {
          if (!filePath?.startsWith('file://')) {
            console.log('Not a local file yet');
            setPlaying(false);
            return;
          }

          await Sound.stopPlayer();
          await Sound.startPlayer(filePath);

          Sound.removePlayBackListener();

          Sound.addPlayBackListener(e => {
            const pos = e.currentPosition ?? 0;
            const dur = e.duration ?? 0;

            if (dur > 0) {
              const durSec = Math.round(dur / 1000);
              setTotalDuration(prev => (prev !== durSec ? durSec : prev));
            }

            setElapsed(Math.floor(pos / 1000));
            if (dur > 0) setProgress(Math.min(pos / dur, 1));

            if (pos >= dur && dur > 0) {
              Sound.stopPlayer();
              Sound.removePlayBackListener();
              setPlaying(false);
              setProgress(0);
              setElapsed(0);
            }
          });
        } catch (err) {
          console.warn('Play error:', err);
          setPlaying(false);
          setHasError(true);
        }
      });
    }
  };

  // ---- Duration formatting ----
  const formatTime = (seconds: number) => {
    const safe = isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : 0;
    const m = Math.floor(safe / 60);
    const s = String(safe % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Show elapsed while playing, total otherwise
  const displayTime = playing ? formatTime(elapsed) : formatTime(totalDuration);

  // ---- Colors ----
  const bubbleBg = isMe
    ? isDark
      ? '#15803d'
      : '#25D366'
    : isDark
      ? '#374151'
      : '#E5E5EA';

  const fg = isMe ? '#FFFFFF' : isDark ? '#D1D5DB' : '#3C3C3C';

  // WhatsApp-style: played = opaque, unplayed = faded
  const playedColor = isMe
    ? 'rgba(255,255,255,0.92)'
    : isDark
      ? '#9CA3AF'
      : '#1F2937';
  const unplayedColor = isMe
    ? 'rgba(255,255,255,0.32)'
    : isDark
      ? '#4B5563'
      : '#C8C8CE';

  const iconName = playing
    ? 'pause-circle'
    : hasError
      ? 'alert-circle'
      : 'play-circle';
  const isBlocked = isUploading || isDownloading || loading;

  return (
    <View style={[styles.container, { backgroundColor: bubbleBg }]}>
      {/* Play / Pause */}
      {isBlocked ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <TouchableOpacity onPress={onPressPlay} activeOpacity={0.7}>
          <Ionicons name={iconName} size={36} color={fg} />
        </TouchableOpacity>
      )}

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {STATIC_BAR_HEIGHTS.map((normHeight, i) => {
          const barProgress = i / (BAR_COUNT - 1);
          const isPlayed = barProgress <= progress;
          const baseH = normHeight * 24; // pixel height 6–24

          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  backgroundColor: isPlayed ? playedColor : unplayedColor,
                  height: barScales[i].interpolate({
                    inputRange: [0.85, 1.4],
                    outputRange: [baseH * 0.85, baseH * 1.4],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          );
        })}
      </View>

      {/* Timer */}
      <Text style={[styles.duration, { color: fg }]}>{displayTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minWidth: 200,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center', // bars grow from center so tall ones expand both up and down
    marginLeft: 8,
    marginRight: 6,
    height: 32,
    flex: 1,
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
    textAlign: 'right',
  },
});
