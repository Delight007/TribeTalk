import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { useFriends, useGetOrCreateChat } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { Friend, RootStackParamList } from '../../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Friendlist'>;

export default function Friendlist({ navigation }: Props) {
  const { mutateAsync: getOrCreateChat } = useGetOrCreateChat();

  const { theme } = useTheme();
  const { data: friends, isLoading, error } = useFriends();
  const [search, setSearch] = useState('');
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');

  const filteredFriends =
    friends?.filter((f: any) =>
      f.name.toLowerCase().includes(query.toLowerCase()),
    ) ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Error loading friends</Text>
      </View>
    );
  }

  const handleOpenChat = async (friend: Friend) => {
    try {
      const response = await getOrCreateChat({ otherUserId: friend._id });
      const chatId = response?.data?.chatId;

      if (chatId) {
        navigation.navigate('ChatScreen', {
          chatId, // ✅ use the returned chatId
          friend: {
            _id: friend._id,
            name: friend.name,
            avatar: friend.avatar,
          },
        });
      } else {
        console.error('No chatId returned from backend');
      }
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const avatarUri = item.avatar ?? null;

    return (
      <View className="flex-row items-center px-4 py-3">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            className="w-12 h-12 rounded-full mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gray-600 justify-center items-center mr-3">
            <Text className="text-white text-lg">
              {item.name ? item.name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}

        <Text
          className={`flex-1 text-base ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          {item.name}
        </Text>

        <TouchableOpacity
          onPress={() => handleOpenChat(item)}
          className={`px-4 py-2 rounded-full bg-green-600`}
        >
          <Text className="text-white text-sm">Message</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-10 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text
          className={`text-2xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          Friends
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderRadius: 50,
            borderColor: '#16a34a',
            paddingHorizontal: 12,
            backgroundColor: isDark ? '#1a2a22' : '#f0f0f0',
          }}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? '#9CA3AF' : '#4B5563'}
          />
          <TextInput
            placeholder="Search here"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              marginLeft: 8,
              height: 48,
              color: isDark ? '#fff' : '#000',
            }}
          />
        </View>
      </View>

      {/* Friend list */}
      <FlatList
        data={filteredFriends}
        keyExtractor={item => item._id}
        renderItem={renderFriend}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </LinearGradient>
  );
}
