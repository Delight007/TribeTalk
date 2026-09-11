import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

function SkeletonBlock({
  style,
  opacity,
}: {
  style: object;
  opacity: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <Animated.View
      style={[styles.block, style, { opacity }]}
    />
  );
}

export default function SkeletonPostCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View className="mb-4 p-2">
      <View className="flex-row items-center px-3 mb-2">
        <SkeletonBlock style={styles.avatar} opacity={pulse} />
        <View style={styles.nameGroup}>
          <SkeletonBlock style={styles.nameLine} opacity={pulse} />
          <SkeletonBlock style={styles.subLine} opacity={pulse} />
        </View>
      </View>

      <SkeletonBlock style={styles.media} opacity={pulse} />

      <View style={styles.captionGroup}>
        <SkeletonBlock style={styles.captionLineWide} opacity={pulse} />
        <SkeletonBlock style={styles.captionLineNarrow} opacity={pulse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E5E7EB',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nameGroup: {
    marginLeft: 12,
  },
  nameLine: {
    width: 120,
    height: 14,
    borderRadius: 4,
  },
  subLine: {
    width: 80,
    height: 12,
    borderRadius: 4,
    marginTop: 6,
  },
  media: {
    width: '100%',
    height: 240,
    borderRadius: 8,
  },
  captionGroup: {
    marginTop: 8,
  },
  captionLineWide: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
  captionLineNarrow: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    marginTop: 6,
  },
});
