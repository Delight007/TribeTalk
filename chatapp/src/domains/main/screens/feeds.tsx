// import Ionicons from '@react-native-vector-icons/ionicons';
// import React, { useState } from 'react';
// import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { useTheme } from '../../../shared/contexts/themeContext';
// import BottomNavigator from '../components/bottomNavigator';

// const stories = [
//   { id: 1, name: 'My story', image: 'https://i.pravatar.cc/150?img=1' },
//   { id: 2, name: 'Kelly', image: 'https://i.pravatar.cc/150?img=2' },
//   { id: 3, name: 'Adrian', image: 'https://i.pravatar.cc/150?img=3' },
//   { id: 4, name: 'Bianca', image: 'https://i.pravatar.cc/150?img=4' },
//   { id: 5, name: 'James', image: 'https://i.pravatar.cc/150?img=5' },
// ];

// const posts = [
//   {
//     id: 1,
//     username: 'Henry Courtney',
//     handle: '@parkersi',
//     image: 'https://images.unsplash.com/photo-1606131731446-556bb588a835',
//     caption: 'Charged for success',
//     tags: ['tennis', 'sport', 'lifestyle', 'team'],
//     likes: 689,
//     comments: 23,
//   },
//   {
//     id: 2,
//     username: 'Samanta Bell',
//     handle: '@bell_bell',
//     image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
//     caption: 'Weekend vibes 🌞',
//     tags: ['fashion', 'style', 'summer'],
//     likes: 432,
//     comments: 18,
//   },
// ];

// export default function FeedScreen() {
//   const { theme, toggleTheme } = useTheme();
//   const [likedPosts, setLikedPosts] = useState<number[]>([]);

//   const toggleLike = (postId: number) => {
//     setLikedPosts(prev =>
//       prev.includes(postId)
//         ? prev.filter(id => id !== postId)
//         : [...prev, postId],
//     );
//   };

//   return (
//     <LinearGradient
//       colors={
//         theme === 'dark'
//           ? ['#0f3d2e', '#09261e', '#000000']
//           : ['#b8e1af', '#d3f9d8', '#ffffff']
//       }
//       locations={[0, 0.2, 1]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       className="flex-1"
//     >
//       {/* ===== Header ===== */}
//       <View
//         className={`absolute top-0 left-0 right-0 z-10 px-4 pt-6 pb-3
//           ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}
//           ${theme === 'dark' ? 'bg-[#09261e]/80' : 'bg-[#d3f9d8]/80'}
//         `}
//       >
//         <View className="flex-row items-center justify-between">
//           {/* Logo + Name */}
//           <View className="flex-row items-center">
//             <Image
//               source={require('../../../assets/logo.png')}
//               className="w-10 h-14 mr-[-6]"
//             />
//             <Text
//               className={`text-2xl font-bold ${
//                 theme === 'dark' ? 'text-green-400' : 'text-green-700'
//               }`}
//             >
//               ribeTalk
//             </Text>
//           </View>

//           {/* Header Icons */}
//           <View className="flex-row items-center justify-between w-24">
//             <TouchableOpacity>
//               <Ionicons
//                 name="search-outline"
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//             <TouchableOpacity>
//               <Ionicons
//                 name="notifications-outline"
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={toggleTheme}>
//               <Ionicons
//                 name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       {/* ===== Scrollable Feed ===== */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         className="flex-1"
//         contentContainerStyle={{ paddingTop: 90, paddingBottom: 100 }}
//       >
//         {/* ===== Stories ===== */}
//         <View
//           className={`flex-row items-center p-3 border-b ${
//             theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
//           }`}
//         >
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {stories.map(story => (
//               <View key={story.id} className="items-center mr-4">
//                 <View
//                   className={`border-2 rounded-full p-1 ${
//                     theme === 'dark' ? 'border-green-500' : 'border-green-600'
//                   }`}
//                 >
//                   <Image
//                     source={{ uri: story.image }}
//                     className="w-16 h-16 rounded-full"
//                   />
//                 </View>
//                 <Text
//                   className={`text-xs mt-1 ${
//                     theme === 'dark' ? 'text-white' : 'text-gray-800'
//                   }`}
//                 >
//                   {story.name}
//                 </Text>
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         {/* ===== Posts ===== */}
//         {posts.map(post => {
//           const isLiked = likedPosts.includes(post.id);
//           return (
//             <View
//               key={post.id}
//               className={`mb-4 p-2 border-b ${
//                 theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
//               }`}
//             >
//               {/* User Info */}
//               <View className="flex-row items-center px-3 mb-2">
//                 <Image
//                   source={{ uri: post.image }}
//                   className="w-10 h-10 rounded-full mr-3"
//                 />
//                 <View>
//                   <Text
//                     className={`font-semibold ${
//                       theme === 'dark' ? 'text-white' : 'text-black'
//                     }`}
//                   >
//                     {post.username}
//                   </Text>
//                   <Text
//                     className={`text-xs ${
//                       theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
//                     }`}
//                   >
//                     {post.handle}
//                   </Text>
//                 </View>
//               </View>

//               {/* Post Image */}
//               <Image
//                 source={{ uri: post.image }}
//                 className="w-full h-80 rounded-lg"
//                 resizeMode="cover"
//               />

//               {/* Caption */}
//               <View className="px-3 mt-2">
//                 <Text
//                   className={`text-base font-medium ${
//                     theme === 'dark' ? 'text-white' : 'text-black'
//                   }`}
//                 >
//                   {post.caption}
//                 </Text>
//                 <View className="flex-row flex-wrap mt-1">
//                   {post.tags.map((tag, index) => (
//                     <Text
//                       key={index}
//                       className={`text-xs mr-2 ${
//                         theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
//                       }`}
//                     >
//                       #{tag}
//                     </Text>
//                   ))}
//                 </View>
//               </View>

//               {/* Likes & Comments */}
//               <View className="flex-row items-center justify-between px-3 mt-3 mb-4">
//                 <TouchableOpacity
//                   className="flex-row items-center"
//                   onPress={() => toggleLike(post.id)}
//                 >
//                   <Ionicons
//                     name={isLiked ? 'heart' : 'heart-outline'}
//                     size={22}
//                     color={
//                       isLiked ? 'red' : theme === 'dark' ? '#ffffff' : '#000000'
//                     }
//                     style={{ marginRight: 6 }}
//                   />
//                   <Text
//                     className={`text-sm ${
//                       theme === 'dark' ? 'text-white' : 'text-black'
//                     }`}
//                   >
//                     {isLiked ? post.likes + 1 : post.likes}
//                   </Text>
//                 </TouchableOpacity>

//                 <View className="flex-row items-center">
//                   <Ionicons
//                     name="chatbubble-outline"
//                     size={20}
//                     color={theme === 'dark' ? '#ffffff' : '#000000'}
//                     style={{ marginRight: 6 }}
//                   />
//                   <Text
//                     className={`text-sm ${
//                       theme === 'dark' ? 'text-white' : 'text-black'
//                     }`}
//                   >
//                     {post.comments}
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           );
//         })}
//       </ScrollView>

//       {/* ===== Fixed Bottom Navigation Bar ===== */}
//       <BottomNavigator active="home" />
//     </LinearGradient>
//   );
// }

// import Ionicons from '@react-native-vector-icons/ionicons';
// import React, { useState } from 'react';
// import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { usePosts } from '../../../api/auth';
// import { useTheme } from '../../../shared/contexts/themeContext';
// import BottomNavigator from '../components/bottomNavigator';

// const stories = [
//   { id: 1, name: 'My story', image: 'https://i.pravatar.cc/150?img=1' },
//   { id: 2, name: 'Kelly', image: 'https://i.pravatar.cc/150?img=2' },
//   { id: 3, name: 'Adrian', image: 'https://i.pravatar.cc/150?img=3' },
//   { id: 4, name: 'Bianca', image: 'https://i.pravatar.cc/150?img=4' },
//   { id: 5, name: 'James', image: 'https://i.pravatar.cc/150?img=5' },
// ];

// export default function FeedScreen() {
//   const { theme, toggleTheme } = useTheme();
//   const [likedPosts, setLikedPosts] = useState<string[]>([]);

//   const toggleLike = (postId: string) => {
//     setLikedPosts(prev =>
//       prev.includes(postId)
//         ? prev.filter(id => id !== postId)
//         : [...prev, postId],
//     );
//   };

//   // React Query hook
//   const { data: posts, isLoading, isError, refetch } = usePosts();
//   console.log('🔥 Posts data:', posts);

//   return (
//     <LinearGradient
//       colors={
//         theme === 'dark'
//           ? ['#0f3d2e', '#09261e', '#000000']
//           : ['#b8e1af', '#d3f9d8', '#ffffff']
//       }
//       locations={[0, 0.2, 1]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       className="flex-1"
//     >
//       {/* ===== Header ===== */}
//       <View
//         className={`absolute top-0 left-0 right-0 z-10 px-4 pt-6 pb-3
//           ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}
//           ${theme === 'dark' ? 'bg-[#09261e]/80' : 'bg-[#d3f9d8]/80'}`}
//       >
//         <View className="flex-row items-center justify-between">
//           <View className="flex-row items-center">
//             <Image
//               source={require('../../../assets/logo.png')}
//               className="w-10 h-14 mr-[-6]"
//             />
//             <Text
//               className={`text-2xl font-bold ${
//                 theme === 'dark' ? 'text-green-400' : 'text-green-700'
//               }`}
//             >
//               ribeTalk
//             </Text>
//           </View>

//           <View className="flex-row items-center justify-between w-24">
//             <TouchableOpacity>
//               <Ionicons
//                 name="search-outline"
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//             <TouchableOpacity>
//               <Ionicons
//                 name="notifications-outline"
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={toggleTheme}>
//               <Ionicons
//                 name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
//                 size={22}
//                 color={theme === 'dark' ? '#4ade80' : '#15803d'}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       {/* ===== Scrollable Feed ===== */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         className="flex-1"
//         contentContainerStyle={{ paddingTop: 90, paddingBottom: 100 }}
//       >
//         {/* ===== Stories ===== */}
//         <View
//           className={`flex-row items-center p-3 border-b ${
//             theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
//           }`}
//         >
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {stories.map(story => (
//               <View key={story.id} className="items-center mr-4">
//                 <View
//                   className={`border-2 rounded-full p-1 ${
//                     theme === 'dark' ? 'border-green-500' : 'border-green-600'
//                   }`}
//                 >
//                   <Image
//                     source={{ uri: story.image }}
//                     className="w-16 h-16 rounded-full"
//                   />
//                 </View>
//                 <Text
//                   className={`text-xs mt-1 ${
//                     theme === 'dark' ? 'text-white' : 'text-gray-800'
//                   }`}
//                 >
//                   {story.name}
//                 </Text>
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         {/* ===== Posts ===== */}

//         {isLoading ? (
//           <View className="py-8 items-center">
//             <Text
//               className={`${
//                 theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//               }`}
//             >
//               Loading posts...
//             </Text>
//           </View>
//         ) : isError ? (
//           <View className="py-8 items-center">
//             <Text
//               className={`text-red-500 ${
//                 theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//               }`}
//             >
//               Error loading posts
//             </Text>
//             <TouchableOpacity onPress={() => refetch()}>
//               <Text className="underline">Retry</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           posts?.map((post: any) => {
//             const isLiked = likedPosts.includes(post._id);

//             return (
//               <View
//                 key={post._id}
//                 className={`mb-4 p-2 border-b ${
//                   theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
//                 }`}
//               >
//                 {/* User Info */}
//                 <View className="flex-row items-center px-3 mb-2">
//                   <Image
//                     source={{ uri: post.avatar }}
//                     className="w-10 h-10 rounded-full mr-3"
//                   />
//                   <View>
//                     <Text
//                       className={`font-semibold ${
//                         theme === 'dark' ? 'text-white' : 'text-black'
//                       }`}
//                     >
//                       {post.name}
//                     </Text>
//                     <Text
//                       className={`text-xs ${
//                         theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
//                       }`}
//                     >
//                       @{post.username}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Post Image (first media) */}
//                 {post.media?.[0]?.url && (
//                   <Image
//                     source={{ uri: post.media[0].url }}
//                     className="w-full h-80 rounded-lg"
//                     resizeMode="cover"
//                   />
//                 )}

//                 {/* Caption */}
//                 <View className="px-3 mt-2">
//                   <Text
//                     className={`text-base font-medium ${
//                       theme === 'dark' ? 'text-white' : 'text-black'
//                     }`}
//                   >
//                     {post.caption}
//                   </Text>
//                   <View className="flex-row flex-wrap mt-1">
//                     {post.tags?.map((tag: string, index: number) => (
//                       <Text
//                         key={index}
//                         className={`text-xs mr-2 ${
//                           theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
//                         }`}
//                       >
//                         #{tag}
//                       </Text>
//                     ))}
//                   </View>
//                 </View>

//                 {/* Likes & Comments */}
//                 <View className="flex-row items-center justify-between px-3 mt-3 mb-4">
//                   <TouchableOpacity
//                     className="flex-row items-center"
//                     onPress={() => toggleLike(post._id)}
//                   >
//                     <Ionicons
//                       name={isLiked ? 'heart' : 'heart-outline'}
//                       size={22}
//                       color={
//                         isLiked
//                           ? 'red'
//                           : theme === 'dark'
//                             ? '#ffffff'
//                             : '#000000'
//                       }
//                       style={{ marginRight: 6 }}
//                     />
//                     <Text
//                       className={`text-sm ${
//                         theme === 'dark' ? 'text-white' : 'text-black'
//                       }`}
//                     >
//                       {isLiked ? post.likes.length + 1 : post.likes.length}
//                     </Text>
//                   </TouchableOpacity>

//                   <View className="flex-row items-center">
//                     <Ionicons
//                       name="chatbubble-outline"
//                       size={20}
//                       color={theme === 'dark' ? '#ffffff' : '#000000'}
//                       style={{ marginRight: 6 }}
//                     />
//                     <Text
//                       className={`text-sm ${
//                         theme === 'dark' ? 'text-white' : 'text-black'
//                       }`}
//                     >
//                       {post.commentsCount}
//                     </Text>
//                   </View>
//                 </View>
//               </View>
//             );
//           })
//         )}
//       </ScrollView>

//       {/* ===== Fixed Bottom Navigation Bar ===== */}
//       <BottomNavigator active="home" />
//     </LinearGradient>
//   );
// }

import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { usePosts } from '../../../api/auth'; // adjust path if needed
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

// Define post type for TS
type PostType = {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  media: { url: string; type: 'image' | 'video' }[];
  caption?: string;
  tags?: string[];
  likes: any[];
  commentsCount: number;
};

const stories = [
  { id: 1, name: 'My story', image: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Kelly', image: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Adrian', image: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Bianca', image: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, name: 'James', image: 'https://i.pravatar.cc/150?img=5' },
];

export default function FeedScreen() {
  const { theme, toggleTheme } = useTheme();
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId],
    );
  };

  const { data: posts, isLoading, isError, refetch } = usePosts();

  // Normalize API response to an array to avoid runtime errors like "posts.map is not a function"
  const postsList: PostType[] = Array.isArray(posts)
    ? posts
    : Array.isArray((posts as any)?.data)
      ? (posts as any).data
      : Array.isArray((posts as any)?.posts)
        ? (posts as any).posts
        : [];
  console.log('posts (raw):', posts, 'postsList.length:', postsList.length);

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
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

      {/* Scrollable Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 90, paddingBottom: 100 }}
      >
        {/* Stories */}
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

        {/* Loading / Error */}
        {isLoading && (
          <View className="py-8 items-center">
            <Text
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Loading posts...
            </Text>
          </View>
        )}
        {isError && (
          <View className="py-8 items-center">
            <Text className="text-red-500">Error loading posts</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text className="underline">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posts */}
        {postsList.length === 0 && !isLoading && !isError ? (
          <View className="py-8 items-center">
            <Text
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
            >
              No posts yet
            </Text>
          </View>
        ) : (
          postsList.map((post: PostType) => {
            const isLiked = likedPosts.includes(post._id);

            return (
              <View
                key={post._id}
                className={`mb-4 p-2 border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                }`}
              >
                {/* User Info */}
                <View className="flex-row items-center px-3 mb-2">
                  <Image
                    source={{ uri: post.avatar }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View>
                    <Text
                      className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-semibold`}
                    >
                      {post.name}
                    </Text>
                    <Text
                      className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs`}
                    >
                      @{post.username}
                    </Text>
                  </View>
                </View>

                {/* Media: Video OR Image */}
                {post.media?.[0]?.type === 'video' ? (
                  <Video
                    source={{ uri: post.media[0].url }}
                    style={{ width: '100%', height: 320 }}
                    paused={true}
                    controls
                  />
                ) : (
                  <Image
                    source={{ uri: post.media?.[0]?.url }}
                    className="w-full h-80 rounded-lg"
                    resizeMode="cover"
                  />
                )}

                {/* Caption & Tags */}
                <View className="px-3 mt-2">
                  <Text
                    className={`${theme === 'dark' ? 'text-white' : 'text-black'} text-base font-medium`}
                  >
                    {post.caption}
                  </Text>
                  <View className="flex-row flex-wrap mt-1">
                    {post.tags?.map((tag: string, index: number) => (
                      <Text
                        key={index}
                        className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs mr-2`}
                      >
                        #{tag}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Likes & Comments */}
                <View className="flex-row items-center justify-between px-3 mt-3 mb-4">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => toggleLike(post._id)}
                  >
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={
                        isLiked
                          ? 'red'
                          : theme === 'dark'
                            ? '#ffffff'
                            : '#000000'
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`${theme === 'dark' ? 'text-white' : 'text-black'} text-sm`}
                    >
                      {isLiked ? post.likes.length + 1 : post.likes.length}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color={theme === 'dark' ? '#ffffff' : '#000000'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`${theme === 'dark' ? 'text-white' : 'text-black'} text-sm`}
                    >
                      {post.commentsCount}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <BottomNavigator active="home" />
    </LinearGradient>
  );
}
