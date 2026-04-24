import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useRef, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';

type FeedPostProps = {
  post: any;
  theme: 'light' | 'dark';
  isVisible: boolean;
  muted: boolean;
  toggleMute: () => void;
  isLiked: boolean;
  toggleLike: (id: string) => void;
};

export default function FeedPost({
  post,
  theme,
  isVisible,
  muted,
  toggleMute,
  isLiked,
  toggleLike,
}: FeedPostProps) {
  const videoY = useRef(0);
  // const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
    // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  const isVideoVisible = isVisible;

  return (
    <View
      className={`mb-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}
    >
      {/* USER */}
      <View className="flex-row items-center px-3 mb-2">
        <Image
          source={{ uri: post.avatar }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View>
          <Text
            className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}
          >
            {post.name}
          </Text>
          <Text
            className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            @{post.username}
          </Text>
        </View>
      </View>

      {/* MEDIA */}
      {post.media?.[0]?.type === 'video' ? (
        <View onLayout={e => (videoY.current = e.nativeEvent.layout.y)}>
            <Video
              source={{ uri: post.media[0].url }}
              style={{ width: '100%', height: 320 }}
              paused={!isVideoVisible || !isPlaying}
              muted={muted}
              repeat
              resizeMode="cover"
          />
          
           <View className="absolute inset-0 justify-center items-center">
          <TouchableOpacity onPress={togglePlayPause}>
             <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={50}
        color="#fff"
      />
        </TouchableOpacity>
  </View>

          <TouchableOpacity activeOpacity={0.9} onPress={toggleMute} className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full">
            {/* MUTE ICON */}
              <Ionicons
                name={muted ? 'volume-mute' : 'volume-high'}
                size={18}
                color="#fff"
              />
          </TouchableOpacity>
        </View>
      ) : (
        <Image
          source={{ uri: post.media?.[0]?.url }}
          className="w-full h-96"
          resizeMode="cover"
        />
      )}

      {/* CAPTION */}
      {post.caption && (
        <View className="px-3 mt-2 flex-row items-center justify-between">
          <Text className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {post.caption}
          </Text>
          <Text className={`${theme === 'dark' ? 'text-white' : 'text-black'} text-sm text-blue-500 underline`}>
            {/* {post.tags?.join(', #')} */}
           { post.tags?.map((tag: string) => `#${tag}`).join(', ')}
          </Text>
        </View>
      )}

      {/* ACTIONS */}
      <View className="flex-row justify-between px-3 mt-3 mb-4">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => toggleLike(post._id)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? 'red' : theme === 'dark' ? '#fff' : '#000'}
          />
          <Text
            className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
          >
            {isLiked ? post.likes.length + 1 : post.likes.length}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center">
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
          <Text
            className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
          >
            {post.commentsCount}
          </Text>
        </View>
      </View>
    </View>
  );
}
