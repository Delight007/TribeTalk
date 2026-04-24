
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useRef, useState } from 'react';
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
import { usePosts } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';
import FeedPost from '../components/feedPost';
import SkeletonPostCard from '../components/skeleton';

const stories = [
  { id: 1, name: 'My story', image: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Kelly', image: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Adrian', image: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Bianca', image: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, name: 'James', image: 'https://i.pravatar.cc/150?img=5' },
];

export default function FeedScreen() {
  const { theme, toggleTheme } = useTheme();
  const { data: posts, isLoading, isError, refetch } = usePosts();
const [visibleSet, setVisibleSet] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [muted, setMuted] = useState(true);


   const visibleIds = useRef(new Set());


  const viewabilityConfig = useRef({
  itemVisiblePercentThreshold: 60,
});

const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
  const newSet = new Set(
    viewableItems.map((v: any) => v.item._id)
  );

  visibleIds.current = newSet;
  setVisibleSet(newSet); 
});

  
  
  const postsList = Array.isArray(posts)
    ? posts
    : Array.isArray((posts as any)?.data)
      ? (posts as any).data
      : [];

  const toggleLike = (postId: string) => {
    setLikedPosts(prev =>
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
  data={postsList}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}  
        contentContainerStyle={{ paddingTop: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
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
      isLiked={likedPosts.includes(item._id)}
      toggleLike={toggleLike}
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
            {stories.map(story => (
              <View key={story.id} className="items-center mr-4">
                <View
                  className={`border-2 rounded-full p-1 ${
                    theme === 'dark' ? 'border-green-500' : 'border-green-600'
                  }`}
                >
                  <Image
                    source={{ uri: story.image }}
                    className="w-16 h-16 rounded-full"
                  />
                </View>
                <Text
                  className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {story.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
    </>
  }
  onViewableItemsChanged={onViewableItemsChanged.current}
  viewabilityConfig={viewabilityConfig.current}
/>

      <BottomNavigator active="home" />
    </LinearGradient>
  );
}
