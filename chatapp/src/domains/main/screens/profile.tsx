import Ionicons from '@react-native-vector-icons/ionicons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useUserPosts } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useAuthStore } from '../../../shared/global/authStore';
import { useChatStore } from '../../../shared/global/chatStore';
import { useUserStore } from '../../../shared/global/userStore';
import AppVideo from '../../../utils/appVideo';
import BottomNavigator from '../components/bottomNavigator';

const Profile = ({ navigation, route }: any) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'Posts' | 'Reels' | 'Tagged'>(
    'Posts',
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const { data: user, isLoading, error } = useCurrentUser();
  const { data: userPosts = [], isLoading: postsLoading } = useUserPosts(
    user?._id,
  );
  const queryClient = useQueryClient();
  const logout = useAuthStore(state => state.logout);
  const isOwnProfile =
    !route?.params?.userId || route.params.userId === user?._id;

  const profileLink = useMemo(
    () => `https://tribetalk.app/profile/${user?._id ?? user?.username ?? ''}`,
    [user?._id, user?.username],
  );

  const shareProfile = async () => {
    await Share.share({
      message: `Connect with ${user?.name ?? user?.username ?? 'me'} on TribeTalk: ${profileLink}`,
    });
    setMenuOpen(false);
  };

  const copyProfileLink = () => {
    setMenuOpen(false);
    Share.share({
      title: 'Copy profile link',
      message: profileLink,
    });
  };

  const showUnavailable = (feature: string) => {
    setMenuOpen(false);
    Alert.alert(feature, `${feature} is not available yet.`);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    useChatStore.getState().clearAllChatData();
    useChatStore.getState().setCurrentUser(undefined);
    useUserStore.getState().setCurrentUser(null);
    queryClient.removeQueries();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const visiblePosts = userPosts.filter(post => {
    if (selectedTab === 'Reels') {
      return post.media?.some(media => media.type === 'video');
    }

    return selectedTab === 'Posts';
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black/5">
        <ActivityIndicator size="large" color="#0095F6" />
        <Text className="mt-2 text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-black/5 px-6">
        <Text className="text-red-500 text-center mb-3">
          Failed to load profile: {error.message}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-green-600 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      className="flex-1"
    >
      <SafeAreaView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center py-3">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme === 'dark' ? '#fff' : '#000'}
              />
            </TouchableOpacity>
            <Text
              className={`font-semibold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              {user?.username || 'Username'}
            </Text>
            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={10}>
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={theme === 'dark' ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View className="flex-row items-center justify-between mb-4 mt-2">
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                className="w-[90px] h-[90px] rounded-full"
              />
            ) : (
              <View className="w-[90px] h-[90px] rounded-full bg-gray-400 items-center justify-center">
                <Ionicons name="person-outline" size={40} color="#fff" />
              </View>
            )}

            {/* Stats */}
            <View className="flex-1 flex-row justify-around text-center">
              {[
                { label: 'Posts', value: userPosts.length.toString() },
                { label: 'Followers', value: user?.followers?.length || '0' },
                { label: 'Following', value: user?.following?.length || '0' },
              ].map((stat, index) => (
                <View key={index} className="items-center">
                  <Text
                    className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View className="mb-4">
            <Text
              className={`font-semibold text-base ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              {user?.name || user?.username || 'User'}
            </Text>
            <Text
              className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {user?.bio || 'No bio yet.'}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 bg-[#1a2a22] rounded-full py-2 items-center"
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text className="text-white font-semibold text-sm">
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-[#1a2a22] rounded-full py-2 items-center"
              onPress={shareProfile}
            >
              <Text className="text-white font-semibold text-sm">
                Share Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#1a2a22] rounded-full py-2 px-3 items-center justify-center"
              onPress={() => navigation.navigate('AppUsers')}
            >
              <Ionicons name="person-add-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Interests */}
          <View
            className={`mb-4 rounded-2xl border p-4 ${
              theme === 'dark'
                ? 'border-green-900 bg-[#102b22]'
                : 'border-green-200 bg-white/75'
            }`}
          >
            <View className="mb-3 flex-row items-center">
              <Ionicons name="sparkles-outline" size={18} color="#16a34a" />
              <Text
                className={`ml-2 text-sm font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-green-300' : 'text-green-800'
                }`}
              >
                Interests
              </Text>
            </View>
            {user?.interests?.length ? (
              <View className="flex-row flex-wrap gap-2">
                {user.interests.map((interest: string) => (
                  <View
                    key={interest}
                    className={`rounded-full border px-3 py-2 ${
                      theme === 'dark'
                        ? 'border-green-700 bg-green-950/60'
                        : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-green-200' : 'text-green-800'
                      }`}
                    >
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-500">
                Add interests from Edit Profile.
              </Text>
            )}
          </View>

          {/* Tabs */}
          <View
            className={`mb-2 flex-row rounded-xl border ${
              theme === 'dark'
                ? 'border-green-900 bg-[#102b22]'
                : 'border-green-200 bg-white/70'
            }`}
          >
            {['Posts', 'Reels', 'Tagged'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab as any)}
                className="flex-1 items-center pt-3"
              >
                <Text
                  className={`font-semibold ${
                    selectedTab === tab
                      ? theme === 'dark'
                        ? 'text-green-300'
                        : 'text-green-700'
                      : theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  }`}
                >
                  {tab}
                </Text>
                <View
                  className={`mt-2 h-1 w-full rounded-t-full ${
                    selectedTab === tab ? 'bg-green-500' : 'bg-transparent'
                  }`}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Posts Grid */}
          {postsLoading ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : visiblePosts.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {visiblePosts.map(post => {
                const media = post.media?.[0];
                if (!media) return null;

                return (
                  <TouchableOpacity
                    key={post._id}
                    className={`mb-1 w-[32.8%] aspect-square overflow-hidden rounded-sm border ${
                      theme === 'dark' ? 'border-green-900' : 'border-green-200'
                    }`}
                    onPress={() => setSelectedPost(post)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: media.url }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                    {post.media.length > 1 && (
                      <Ionicons
                        name="copy-outline"
                        size={17}
                        color="#fff"
                        style={{ position: 'absolute', right: 6, top: 6 }}
                      />
                    )}
                    {media.type === 'video' && (
                      <Ionicons
                        name="play"
                        size={18}
                        color="#fff"
                        style={{ position: 'absolute', right: 6, bottom: 6 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="items-center py-10">
              <Ionicons
                name={
                  selectedTab === 'Reels'
                    ? 'videocam-outline'
                    : 'images-outline'
                }
                size={38}
                color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
              <Text className="mt-2 text-sm text-gray-500">
                {selectedTab === 'Reels' ? 'No reels yet' : 'No posts yet'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Theme Toggle */}
        <TouchableOpacity onPress={toggleTheme} className="mt-3 mb-4">
          <Text className="text-center text-green-600">
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={Boolean(selectedPost)}
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost && (
          <View className="flex-1 bg-black">
            <View className="z-10 flex-row items-center justify-between px-4 pb-3 pt-12">
              <View className="flex-row items-center">
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="mr-2 h-9 w-9 rounded-full"
                  />
                ) : (
                  <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-gray-500">
                    <Ionicons name="person-outline" size={18} color="#fff" />
                  </View>
                )}
                <Text className="font-semibold text-white">
                  {user?.name ?? user?.username ?? 'Post'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
                hitSlop={12}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              {selectedPost.media.map((media: any) => (
                <View
                  key={media.url}
                  className="w-screen flex-1 justify-center"
                >
                  {media.type === 'video' ? (
                    <AppVideo
                      source={{ uri: media.url }}
                      style={{ height: '70%', width: '100%' }}
                      resizeMode="contain"
                      controls
                    />
                  ) : (
                    <Image
                      source={{ uri: media.url }}
                      className="h-[70%] w-full"
                      resizeMode="contain"
                    />
                  )}
                </View>
              ))}
            </ScrollView>

            <View className="px-4 pb-10 pt-3">
              {selectedPost.caption ? (
                <Text className="text-base text-white">
                  {selectedPost.caption}
                </Text>
              ) : null}
              {selectedPost.tags?.length ? (
                <Text className="mt-1 text-sm text-green-300">
                  {selectedPost.tags.map((tag: string) => `#${tag}`).join(' ')}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/40"
          onPress={() => setMenuOpen(false)}
        >
          <View
            className={`rounded-t-3xl px-4 pb-8 pt-3 ${
              theme === 'dark' ? 'bg-[#10251e]' : 'bg-white'
            }`}
            onStartShouldSetResponder={() => true}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-gray-400" />
            {(isOwnProfile
              ? [
                  {
                    label: 'Share profile',
                    icon: 'share-outline',
                    onPress: shareProfile,
                  },
                  {
                    label: 'Copy profile link',
                    icon: 'link-outline',
                    onPress: copyProfileLink,
                  },
                  {
                    label: 'Profile QR code',
                    icon: 'qr-code-outline',
                    onPress: () => {
                      setMenuOpen(false);
                      setQrOpen(true);
                    },
                  },
                  {
                    label: 'Account settings',
                    icon: 'settings-outline',
                    onPress: () => {
                      setMenuOpen(false);
                      navigation.navigate('Settings');
                    },
                  },
                  {
                    label: 'Privacy',
                    icon: 'lock-closed-outline',
                    onPress: () => showUnavailable('Privacy'),
                  },
                  {
                    label: 'Archive',
                    icon: 'archive-outline',
                    onPress: () => showUnavailable('Archive'),
                  },
                  {
                    label: 'Saved posts',
                    icon: 'bookmark-outline',
                    onPress: () => showUnavailable('Saved posts'),
                  },
                  {
                    label: 'Log out',
                    icon: 'log-out-outline',
                    destructive: true,
                    onPress: handleLogout,
                  },
                ]
              : [
                  {
                    label: 'Share profile',
                    icon: 'share-outline',
                    onPress: shareProfile,
                  },
                  {
                    label: 'Copy profile link',
                    icon: 'link-outline',
                    onPress: copyProfileLink,
                  },
                  {
                    label: 'Mute posts',
                    icon: 'volume-mute-outline',
                    onPress: () => showUnavailable('Mute posts'),
                  },
                  {
                    label: 'Block user',
                    icon: 'ban-outline',
                    onPress: () => showUnavailable('Block user'),
                  },
                  {
                    label: 'Report user',
                    icon: 'flag-outline',
                    onPress: () => showUnavailable('Report user'),
                  },
                ]
            ).map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                className="flex-row items-center px-2 py-3"
              >
                <Ionicons
                  name={action.icon as any}
                  size={21}
                  color={
                    action.destructive
                      ? '#dc2626'
                      : theme === 'dark'
                        ? '#fff'
                        : '#111'
                  }
                />
                <Text
                  className={`ml-3 text-base ${
                    action.destructive
                      ? 'font-semibold text-red-600'
                      : theme === 'dark'
                        ? 'text-white'
                        : 'text-black'
                  }`}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={qrOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQrOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="items-center rounded-3xl bg-white p-6">
            <Text className="mb-4 text-lg font-bold text-black">
              Profile QR code
            </Text>
            <View className="h-[210px] w-[210px] items-center justify-center rounded-xl border-2 border-dashed border-green-600 px-4">
              <Ionicons name="qr-code-outline" size={72} color="#16a34a" />
              <Text className="mt-3 text-center text-gray-600">
                QR display needs a fresh native Android build.
              </Text>
            </View>
            <Text className="mt-4 text-center text-gray-600">
              {profileLink}
            </Text>
            <TouchableOpacity
              onPress={() => setQrOpen(false)}
              className="mt-5 rounded-full bg-green-600 px-6 py-2"
            >
              <Text className="font-semibold text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavigator active="profile" />
    </LinearGradient>
  );
};

export default Profile;
