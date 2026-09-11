import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useAddPostComment,
  usePostComments,
  useTogglePostBookmark,
  useTogglePostLike,
} from '../../../api/auth';
import Video from '../../../utils/appVideo';

type FeedPostProps = {
  post: any;
  theme: 'light' | 'dark';
  isVisible: boolean;
  muted: boolean;
  toggleMute: () => void;
  currentUserId?: string;
  isLiked: boolean;
  toggleLike: (id: string) => void;
  isBookmarked: boolean;
  toggleBookmark: (id: string) => void;
};

export default function FeedPost({
  post,
  theme,
  isVisible,
  muted,
  toggleMute,
  currentUserId,
  isLiked,
  toggleLike,
  isBookmarked,
  toggleBookmark,
}: FeedPostProps) {
  const videoY = useRef(0);
  // const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(
    post._id,
    commentsOpen,
  );
  const addComment = useAddPostComment(post._id);
  const toggleLikeRequest = useTogglePostLike();
  const toggleBookmarkRequest = useTogglePostBookmark();
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  const handleLike = async () => {
    toggleLike(post._id);
    try {
      await toggleLikeRequest.mutateAsync(post._id);
    } catch {
      toggleLike(post._id);
    }
  };
  const handleBookmark = async () => {
    toggleBookmark(post._id);
    try {
      await toggleBookmarkRequest.mutateAsync(post._id);
    } catch {
      toggleBookmark(post._id);
    }
  };
  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || addComment.isPending) return;
    await addComment.mutateAsync(text);
    setCommentText('');
  };
  const isVideoVisible = isVisible;
  const currentUserLikedOnServer = (post.likes ?? []).some((like: any) => {
    const likeId =
      typeof like === 'string' ? like : (like?._id ?? like?.id ?? like?.$oid);
    return likeId === currentUserId;
  });
  const likeCountDelta =
    isLiked === currentUserLikedOnServer ? 0 : isLiked ? 1 : -1;

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
                name={isPlaying ? 'pause' : 'play'}
                size={50}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleMute}
            className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full"
          >
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
          <Text
            className={`${theme === 'dark' ? 'text-white' : 'text-black'} text-sm text-blue-500 underline`}
          >
            {/* {post.tags?.join(', #')} */}
            {post.tags?.map((tag: string) => `#${tag}`).join(', ')}
          </Text>
        </View>
      )}

      {/* ACTIONS */}
      <View className="flex-row justify-between px-3 mt-3 mb-4">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? 'red' : theme === 'dark' ? '#fff' : '#000'}
          />
          <Text
            className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
          >
            {Math.max(0, post.likes.length + likeCountDelta)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setCommentsOpen(true)}
        >
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
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={
              isBookmarked ? '#16a34a' : theme === 'dark' ? '#fff' : '#000'
            }
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={commentsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            className={`max-h-[75%] rounded-t-3xl p-4 ${theme === 'dark' ? 'bg-[#10251e]' : 'bg-white'}`}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text
                className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}
              >
                Comments
              </Text>
              <TouchableOpacity onPress={() => setCommentsOpen(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme === 'dark' ? '#fff' : '#111'}
                />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color="#16a34a" />
            ) : comments.length === 0 ? (
              <Text
                className={`py-6 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
              >
                No comments yet
              </Text>
            ) : (
              comments.map(comment => (
                <View key={comment._id} className="mb-3 flex-row">
                  <Image
                    source={{ uri: comment.avatar }}
                    className="mr-2 h-8 w-8 rounded-full"
                  />
                  <View className="flex-1">
                    <Text
                      className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                    >
                      {comment.name}
                    </Text>
                    <Text
                      className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                    >
                      {comment.text}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <View className="mt-2 flex-row items-center border-t border-gray-300 pt-3">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                className={`mr-2 min-h-10 flex-1 rounded-full px-4 ${theme === 'dark' ? 'bg-[#1b3a2f] text-white' : 'bg-gray-100 text-black'}`}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={addComment.isPending}
              >
                <Ionicons name="send" size={23} color="#16a34a" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
