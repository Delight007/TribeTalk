// // VoiceWaveform.tsx
// import React from 'react';
// import { LayoutChangeEvent, PanResponder, View } from 'react-native';

// interface VoiceWaveformProps {
//   bars: number[];
//   progress: number; // 0–1, current playback position
//   playedColor: string;
//   unplayedColor: string;
//   thumbColor?: string;
//   isAnimating?: boolean; // true for the live recording indicator — disables seeking
//   onSeekStart?: () => void;
//   onSeekMove?: (ratio: number) => void;
//   onSeekEnd?: (ratio: number) => void;
// }

// export default function VoiceWaveform({
//   bars,
//   progress,
//   playedColor,
//   unplayedColor,
//   thumbColor,
//   isAnimating,
//   onSeekStart,
//   onSeekMove,
//   onSeekEnd,
// }: VoiceWaveformProps) {
//   const widthRef = React.useRef(0);
//   const [width, setWidth] = React.useState(0);
//   const [isDragging, setIsDragging] = React.useState(false);

//   const handleLayout = (e: LayoutChangeEvent) => {
//     widthRef.current = e.nativeEvent.layout.width;
//     setWidth(e.nativeEvent.layout.width);
//   };

//   const ratioFromX = (x: number) => {
//     if (!widthRef.current) return 0;
//     return Math.min(1, Math.max(0, x / widthRef.current));
//   };

//   const canSeek = !isAnimating && !!onSeekEnd;
// const isPlayed = index / bars.length < progress;
//   const panResponder = React.useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => canSeek,
//       onMoveShouldSetPanResponder: () => canSeek,
//       onPanResponderGrant: e => {
//         setIsDragging(true);
//         onSeekStart?.();
//         onSeekMove?.(ratioFromX(e.nativeEvent.locationX));
//       },
//       onPanResponderMove: e => {
//         onSeekMove?.(ratioFromX(e.nativeEvent.locationX));
//       },
//       onPanResponderRelease: e => {
//         setIsDragging(false);
//         onSeekEnd?.(ratioFromX(e.nativeEvent.locationX));
//       },
//       onPanResponderTerminate: e => {
//         setIsDragging(false);
//         onSeekEnd?.(ratioFromX(e.nativeEvent.locationX));
//       },
//     }),
//   ).current;

//   const thumbX = width * progress;
//   const showThumb = width > 0 && (isDragging || progress > 0);

//   return (
//     <View
//       style={{ height: 34, justifyContent: 'center' }}
//       onLayout={handleLayout}
//       hitSlop={{ top: 12, bottom: 12 }}
//       {...(canSeek ? panResponder.panHandlers : {})}
//     >
//       <View style={{ flexDirection: 'row', height: 30, alignItems: 'center' }}>
//         {bars.map((barHeight, index) => {
//           const isPlayed = index / bars.length < progress;
//           return (
//             <View
//               key={index}
//               style={{
//                 flex: 1,
//                 marginHorizontal: 1,
//                 height: Math.max(3, Math.min(barHeight, 1) * 30),
//                 borderRadius: 2,
//                 backgroundColor: isPlayed ? playedColor : unplayedColor,
//               }}
//             />
//           );
//         })}
//       </View>

//       {showThumb && (
//         <View
//           pointerEvents="none"
//           style={{
//             position: 'absolute',
//             left: Math.max(0, Math.min(width - 12, thumbX - 6)),
//             width: 12,
//             height: 12,
//             borderRadius: 6,
//             backgroundColor: thumbColor ?? playedColor,
//             borderWidth: 2,
//             borderColor: '#fff',
//             elevation: 2,
//             shadowColor: '#000',
//             shadowOpacity: 0.25,
//             shadowRadius: 2,
//             shadowOffset: { width: 0, height: 1 },
//           }}
//         />
//       )}
//     </View>
//   );
// }

import React from 'react';
import { Animated, LayoutChangeEvent, PanResponder, View } from 'react-native';

interface VoiceWaveformProps {
  bars: number[];
  progress: number;
  playedColor: string;
  unplayedColor: string;
  thumbColor?: string;
  isAnimating?: boolean;
  onSeekStart?: () => void;
  onSeekMove?: (ratio: number) => void;
  onSeekEnd?: (ratio: number) => void;
}

export default function VoiceWaveform({
  bars,
  progress,
  playedColor,
  unplayedColor,
  thumbColor,
  isAnimating,
  onSeekStart,
  onSeekMove,
  onSeekEnd,
}: VoiceWaveformProps) {
  const widthRef = React.useRef(0);
  const [width, setWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const animatedProgress = React.useRef(new Animated.Value(0)).current;

  const safeProgress = Math.min(1, Math.max(0, progress));
  const canSeek = !isAnimating && !!onSeekEnd;

  const latestControls = React.useRef({
    canSeek,
    onSeekStart,
    onSeekMove,
    onSeekEnd,
  });

  latestControls.current = {
    canSeek,
    onSeekStart,
    onSeekMove,
    onSeekEnd,
  };

  React.useEffect(() => {
    animatedProgress.stopAnimation();

    if (isDragging) {
      animatedProgress.setValue(safeProgress);
      return;
    }

    animatedProgress.setValue(safeProgress);
  }, [animatedProgress, isDragging, safeProgress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const waveformWidth = event.nativeEvent.layout.width;
    widthRef.current = waveformWidth;
    setWidth(waveformWidth);
  };

  const ratioFromX = (x: number) => {
    if (!widthRef.current) return 0;

    return Math.min(1, Math.max(0, x / widthRef.current));
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latestControls.current.canSeek,
      onMoveShouldSetPanResponder: () => latestControls.current.canSeek,

      onPanResponderGrant: event => {
        setIsDragging(true);

        const ratio = ratioFromX(event.nativeEvent.locationX);
        latestControls.current.onSeekStart?.();
        latestControls.current.onSeekMove?.(ratio);
      },

      onPanResponderMove: event => {
        latestControls.current.onSeekMove?.(
          ratioFromX(event.nativeEvent.locationX),
        );
      },

      onPanResponderRelease: event => {
        setIsDragging(false);
        latestControls.current.onSeekEnd?.(
          ratioFromX(event.nativeEvent.locationX),
        );
      },

      onPanResponderTerminate: event => {
        setIsDragging(false);
        latestControls.current.onSeekEnd?.(
          ratioFromX(event.nativeEvent.locationX),
        );
      },
    }),
  ).current;

  const thumbTranslateX = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, width - 12)],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{ height: 34, justifyContent: 'center' }}
      onLayout={handleLayout}
      hitSlop={{ top: 12, bottom: 12 }}
      {...(canSeek ? panResponder.panHandlers : {})}
    >
      <View style={{ flexDirection: 'row', height: 30, alignItems: 'center' }}>
        {bars.map((barHeight, index) => {
          const barProgress = Math.min(
            1,
            Math.max(0, safeProgress * bars.length - index),
          );

          return (
            <View
              key={index}
              style={{
                flex: 1,
                marginHorizontal: 1,
                height: Math.max(3, Math.min(barHeight, 1) * 30),
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: unplayedColor,
              }}
            >
              <View
                style={{
                  width: `${barProgress * 100}%`,
                  height: '100%',
                  backgroundColor: playedColor,
                }}
              />
            </View>
          );
        })}
      </View>

      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: thumbColor ?? playedColor,
            borderWidth: 2,
            borderColor: '#fff',
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            transform: [{ translateX: thumbTranslateX }],
          }}
        />
      )}
    </View>
  );
}
