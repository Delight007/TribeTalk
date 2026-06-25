// VoiceWaveform.tsx
import React from 'react';
import {
  LayoutChangeEvent,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface VoiceWaveformProps {
  bars: number[];
  progress: number;
  onSeek?: (ratio: number) => void;
  playedColor: string;
  unplayedColor: string;
}

export default function VoiceWaveform({
  bars,
  progress,
  onSeek,
  playedColor,
  unplayedColor,
}: VoiceWaveformProps) {
  const [width, setWidth] = React.useState<number>(0);

  const handlePress = (e: any) => {
    if (!width || !onSeek) return;
    const ratio = e.nativeEvent.locationX / width;
    onSeek(Math.min(1, Math.max(0, ratio)));
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View
        style={{ flexDirection: 'row', height: 30, alignItems: 'center' }}
        onLayout={handleLayout}
      >
        {bars.map((barHeight: number, index: number) => {
          const isPlayed = index / bars.length < progress;
          return (
            <View
              key={index}
              style={{
                flex: 1,
                marginHorizontal: 1,
                height: Math.min(barHeight, 1) * 30,
                backgroundColor: isPlayed ? playedColor : unplayedColor,
              }}
            />
          );
        })}
      </View>
    </TouchableWithoutFeedback>
  );
}
