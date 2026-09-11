import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Video from 'react-native-video';

export type AppVideoRef = {
  seek: (seconds: number) => Promise<void>;
};

type ResizeModeProp = 'cover' | 'contain' | 'stretch';

interface AppVideoProps {
  source: { uri: string };
  style?: StyleProp<ViewStyle>;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  controls?: boolean;
  resizeMode?: ResizeModeProp;
  onLoadStart?: () => void;
  onLoad?: (data: { duration: number }) => void;
  onError?: () => void;
  onProgress?: (data: { currentTime: number }) => void;
  onEnd?: () => void;
}

const mapResizeMode = (mode?: ResizeModeProp) => {
  switch (mode) {
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'stretch';
    default:
      return 'cover';
  }
};

const AppVideo = forwardRef<AppVideoRef, AppVideoProps>(function AppVideo(
  {
    source,
    style,
    paused = false,
    muted = false,
    repeat = false,
    resizeMode = 'cover',
    onLoadStart,
    onLoad,
    onError,
    onProgress,
    onEnd,
  },
  ref,
) {
  const videoRef = useRef<any>(null);
  const hasReportedLoad = useRef(false);

  useImperativeHandle(ref, () => ({
    seek: async (seconds: number) => {
      try {
        videoRef.current?.seek(Math.max(0, seconds));
      } catch (e) {
        // ignore
      }
    },
  }));

  // react-native-video provides onLoad/onProgress handlers directly

  return (
    <Video
      ref={videoRef}
      source={source}
      style={style}
      resizeMode={mapResizeMode(resizeMode)}
      paused={paused}
      repeat={repeat}
      muted={muted}
      controls={false}
      onLoadStart={onLoadStart}
      onLoad={e => onLoad?.({ duration: e.duration })}
      onError={onError}
      onProgress={e => onProgress?.({ currentTime: e.currentTime })}
      onEnd={onEnd}
    />
  );
});

export default AppVideo;
