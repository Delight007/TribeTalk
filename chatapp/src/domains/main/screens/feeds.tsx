import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useCurrentUser, usePosts, useStories } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';
import FeedPost from '../components/feedPost';
import SkeletonPostCard from '../components/skeleton';
import StoryViewer from '../components/storyViewer';

export default function FeedScreen() {
  const { theme, toggleTheme } = useTheme();
  const { data: posts, isLoading, isError, refetch } = usePosts();
  const { data: currentUser } = useCurrentUser();
  const { data: stories = [], refetch: refetchStories } = useStories();
  const navigation = useNavigation<any>();
  const [visibleSet, setVisibleSet] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [muted, setMuted] = useState(true);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  const visibleIds = useRef(new Set());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const newSet = new Set(viewableItems.map((v: any) => v.item._id));

    visibleIds.current = newSet;
    setVisibleSet(newSet);
  });

  const postsList = Array.isArray(posts)
    ? posts
    : Array.isArray((posts as any)?.data)
      ? (posts as any).data
      : [];
  const feedPosts = postsList.filter((post: any) => post.type === 'feed');

  const currentUserId = currentUser?._id ?? currentUser?.id;

  const getStoredId = (value: any) =>
    typeof value === 'string'
      ? value
      : (value?._id ?? value?.id ?? value?.$oid);

  const storyGroups = useMemo(() => {
    const groups = new Map<string, any>();

    const storyList = Array.isArray(stories) ? stories : [];
    storyList.forEach(story => {
      const ownerId = getStoredId(story.author) ?? story.username ?? story._id;
      const existing = groups.get(ownerId);
      if (existing) {
        existing.media = [...existing.media, ...story.media];
      } else {
        groups.set(ownerId, { ...story, media: [...story.media] });
      }
    });

    return Array.from(groups.values()).sort((first, second) => {
      const firstIsCurrent = getStoredId(first.author) === currentUserId;
      const secondIsCurrent = getStoredId(second.author) === currentUserId;
      return Number(secondIsCurrent) - Number(firstIsCurrent);
    });
  }, [stories, currentUserId]);

  useEffect(() => {
    if (!currentUserId || !postsList.length) return;

    setLikedPosts(
      postsList
        .filter((post: any) =>
          (post.likes ?? []).some(
            (like: any) => getStoredId(like) === currentUserId,
          ),
        )
        .map((post: any) => post._id),
    );
    setBookmarkedPosts(
      postsList
        .filter((post: any) =>
          (post.bookmarks ?? []).some(
            (bookmark: any) => getStoredId(bookmark) === currentUserId,
          ),
        )
        .map((post: any) => post._id),
    );
  }, [currentUserId, postsList]);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId],
    );
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId],
    );
  };

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      className="flex-1"
    >
      {isLoading && (
        <>
          <SkeletonPostCard />
          <SkeletonPostCard />
        </>
      )}

      {isError && (
        <View className="py-8 items-center">
          <Text className="text-red-500">Failed to load posts</Text>
        </View>
      )}

      {/* Header */}
      <View
        className={`absolute top-0 left-0 right-0 z-10 px-4 pt-6 pb-3
          ${theme === 'dark' ? 'border-gray-700 bg-[#09261e]/80' : 'border-gray-300 bg-[#d3f9d8]/80'}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/logo.png')}
              className="w-10 h-14 mr-[-6]"
            />
            <Text
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-700'
              }`}
            >
              ribeTalk
            </Text>
          </View>

          <View className="flex-row items-center justify-between w-24">
            <TouchableOpacity>
              <Ionicons
                name="search-outline"
                size={22}
                color={theme === 'dark' ? '#4ade80' : '#15803d'}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={theme === 'dark' ? '#4ade80' : '#15803d'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons
                name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={theme === 'dark' ? '#4ade80' : '#15803d'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={feedPosts}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
              await refetchStories();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <FeedPost
            post={item}
            theme={theme}
            isVisible={visibleSet.has(item._id)}
            muted={muted}
            toggleMute={() => setMuted(!muted)}
            currentUserId={currentUserId}
            isLiked={likedPosts.includes(item._id)}
            toggleLike={toggleLike}
            isBookmarked={bookmarkedPosts.includes(item._id)}
            toggleBookmark={toggleBookmark}
          />
        )}
        ListHeaderComponent={
          <>
            {/* STORIES */}
            <View
              className={`flex-row items-center p-3 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              }`}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  className="mr-4 items-center"
                  onPress={() =>
                    navigation.navigate('PostScreen', { postType: 'STORY' })
                  }
                >
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-green-600">
                    <Ionicons name="add" size={28} color="#16a34a" />
                  </View>
                  <Text
                    className={`mt-1 text-xs ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    Add story
                  </Text>
                </TouchableOpacity>
                {storyGroups.map((story, index) => (
                  <TouchableOpacity
                    key={story._id}
                    className="mr-4 items-center"
                    onPress={() => setStoryIndex(index)}
                  >
                    <View
                      className={`border-2 rounded-full p-1 ${
                        theme === 'dark'
                          ? 'border-green-500'
                          : 'border-green-600'
                      }`}
                    >
                      <Image
                        source={{ uri: story.avatar }}
                        className="w-16 h-16 rounded-full"
                      />
                    </View>
                    <Text
                      className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {getStoredId(story.author) === currentUserId
                        ? 'Your story'
                        : story.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      <BottomNavigator active="home" />
      <StoryViewer
        stories={storyGroups}
        initialIndex={storyIndex ?? 0}
        visible={storyIndex !== null}
        onClose={() => setStoryIndex(null)}
      />
    </LinearGradient>
  );
}
