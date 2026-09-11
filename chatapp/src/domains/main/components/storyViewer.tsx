import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { FeedPost } from '../../../api/auth';
import AppVideo from '../../../utils/appVideo';

type StoryViewerProps = {
  stories: FeedPost[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

export default function StoryViewer({
  stories,
  initialIndex,
  visible,
  onClose,
}: StoryViewerProps) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [mediaIndex, setMediaIndex] = useState(0);
  const story = stories[storyIndex];
  const media = story?.media?.[mediaIndex];

  React.useEffect(() => {
    if (visible) {
      setStoryIndex(initialIndex);
      setMediaIndex(0);
    }
  }, [initialIndex, visible]);

  if (!story || !media) return null;

  const goNext = () => {
    if (mediaIndex < story.media.length - 1) {
      setMediaIndex(index => index + 1);
      return;
    }

    if (storyIndex < stories.length - 1) {
      setStoryIndex(index => index + 1);
      setMediaIndex(0);
      return;
    }

    onClose();
  };

  const goPrevious = () => {
    if (mediaIndex > 0) {
      setMediaIndex(index => index - 1);
      return;
    }

    if (storyIndex > 0) {
      const previousStory = stories[storyIndex - 1];
      setStoryIndex(index => index - 1);
      setMediaIndex(Math.max(0, previousStory.media.length - 1));
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="absolute left-0 right-0 top-0 z-10 px-4 pt-12">
          <View className="mb-4 flex-row gap-1">
            {story.media.map((_, index) => (
              <View
                key={index}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/40"
              >
                <View
                  className={`h-full ${index <= mediaIndex ? 'bg-white' : 'bg-transparent'}`}
                />
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={{ uri: story.avatar }}
                className="mr-2 h-9 w-9 rounded-full"
              />
              <View>
                <Text className="font-semibold text-white">{story.name}</Text>
                <Text className="text-xs text-gray-300">@{story.username}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {media.type === 'video' ? (
          <AppVideo
            source={{ uri: media.url }}
            style={{ flex: 1 }}
            resizeMode="contain"
            paused={!visible}
            repeat={false}
            controls={true}
          />
        ) : (
          <Image
            source={{ uri: media.url }}
            className="h-full w-full"
            resizeMode="contain"
          />
        )}

        <TouchableOpacity
          className="absolute bottom-0 left-0 top-24 w-1/3"
          onPress={goPrevious}
          activeOpacity={1}
        />
        <TouchableOpacity
          className="absolute bottom-0 right-0 top-24 w-2/3"
          onPress={goNext}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
}
