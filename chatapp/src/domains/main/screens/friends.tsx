import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useFriends } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

type Friend = {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  username?: string;
};

const activefriends: Friend[] = [
  { _id: '1', name: 'Olivia' },
  { _id: '2', name: 'Daniel' },
  { _id: '3', name: 'Sophia' },
  { _id: '4', name: 'William' },
  { _id: '5', name: 'Henry' },
];

export default function FriendsList() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const navigation = useNavigation<any>();
  const { data: user } = useCurrentUser();
  const { data: friends, isLoading, isError } = useFriends();

  console.log('Friends data:', friends);

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-[#1a2a22]';
  const subText = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgColor = isDark ? 'bg-[#1a2a22]' : 'bg-gray-100/60';
  const profilebg = isDark ? 'bg-green-900' : 'bg-gray-200';

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-6">
          <View className="flex-row items-center">
            <View className="border-2 border-green-600 rounded-full p-2 mr-4">
              <View
                className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-green-900 items-center justify-center`}
              >
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-[50px] h-[50px] rounded-full"
                  />
                ) : (
                  <View className="w-[50px] h-[50px] rounded-full bg-gray-400 items-center justify-center">
                    <Ionicons name="person-outline" size={40} color="#fff" />
                  </View>
                )}
              </View>
            </View>
            <Text className={`text-xl font-bold ${textColor}`}>Messages</Text>
          </View>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={isDark ? 'white' : '#1a2a22'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6">
          <View
            className={`flex-row items-center border border-green-600 rounded-full px-3 ${bgColor}`}
          >
            <Ionicons
              name="search"
              size={16}
              color={isDark ? '#9CA3AF' : '#4B5563'}
            />
            <TextInput
              placeholder="Search here"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={query}
              onChangeText={setQuery}
              className={`flex-1 ml-2 text-sm h-[50px] ${textColor}`}
            />
          </View>
        </View>

        {/* Active friends */}
        <FlatList
          data={activefriends}
          keyExtractor={i => i._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          className="my-6"
          renderItem={({ item }) => (
            <View className="items-center mr-5">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center ${profilebg}`}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full border-green-600 border-2 p-1 items-center justify-center">
                    <View className="bg-green-400 rounded-full w-full h-full items-center justify-center">
                      <Ionicons name="person-outline" size={20} color="#fff" />
                    </View>
                  </View>
                )}
              </View>
              <Text className={`text-xs mt-1 ${textColor}`}>{item.name}</Text>
            </View>
          )}
        />

        {/* Friend List (replaces messages) */}
        <View className="px-4">
          {isLoading ? (
            <ActivityIndicator size="large" color="#16a34a" />
          ) : isError ? (
            <Text className={`text-center text-white mt-4 ${textColor}`}>
              Failed to load friends
            </Text>
          ) : friends?.length === 0 ? (
            <Text className={`text-center mt-4 ${textColor}`}>
              No friends yet 😢
            </Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ChatScreen', { user: item })
                  }
                  className="flex-row items-center py-3"
                >
                  <View
                    className={`w-14 h-14 rounded-full bg-green-300 dark:bg-green-800 items-center justify-center mr-3`}
                  >
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <Ionicons name="person-outline" size={24} color="#fff" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${textColor}`}>
                      {item.name}
                    </Text>
                    <Text className={`text-sm ${subText}`}>
                      {item.email || item.username || 'Tap to chat'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Bottom navigator */}
      <BottomNavigator active="chat" />
    </LinearGradient>
  );
}
