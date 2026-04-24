import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

const Profile = ({ navigation }: any) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'Posts' | 'Reels' | 'Tagged'>(
    'Posts',
  );

  const { data: user, isLoading, error } = useCurrentUser();

  const highlights = [
    { id: '1', name: 'Trips', uri: 'https://placekitten.com/100/100' },
    { id: '2', name: 'Cars', uri: 'https://placekitten.com/101/101' },
  ];

  const posts = Array.from({ length: 12 }).map((_, i) => ({
    id: i.toString(),
    uri: `https://placekitten.com/${100 + i}/${100 + i}`,
  }));

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

          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
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
                { label: 'Posts', value: posts.length.toString() },
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

            <TouchableOpacity className="flex-1 bg-[#1a2a22] rounded-full py-2 items-center">
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

          {/* Highlights */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {highlights.map(highlight => (
              <View key={highlight.id} className="items-center mr-4">
                <Image
                  source={{ uri: highlight.uri }}
                  className="w-16 h-16 rounded-full border-2 border-gray-600 mb-1"
                />
                <Text
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {highlight.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View className="flex-row justify-around border-t border-gray-300 mb-2">
            {['Posts', 'Reels', 'Tagged'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab as any)}
                className="py-2 flex-1 items-center"
              >
                <Text
                  className={`font-semibold ${
                    selectedTab === tab
                      ? 'text-black dark:text-white'
                      : 'text-gray-500'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Posts Grid */}
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                className="w-[32%] aspect-square mb-1 rounded-sm"
              />
            )}
          />
        </ScrollView>

        {/* Theme Toggle */}
        <TouchableOpacity onPress={toggleTheme} className="mt-3 mb-4">
          <Text className="text-center text-green-600">
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <BottomNavigator active="profile" />
    </LinearGradient>
  );
};

export default Profile;
