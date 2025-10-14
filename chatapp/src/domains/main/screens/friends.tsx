import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

const stories = [
  { id: '1', name: 'Olivia' },
  { id: '2', name: 'Daniel' },
  { id: '3', name: 'Sophia' },
  { id: '4', name: 'William' },
  { id: '5', name: 'Henry' },
];

const messages = [
  { id: '1', name: 'Charlotte', text: 'Hey, mate please ...', time: '29 Jun' },
  {
    id: '2',
    name: 'Arafat Khan',
    text: 'https://linkedin.com/post/…',
    time: '28 Jun',
  },
  {
    id: '3',
    name: 'Ajoy Mondal',
    text: 'https://behance.net/gallery/…',
    time: '26 Jun',
  },
  { id: '4', name: 'Patricia', text: 'Short update', time: '24 Jun' },
  { id: '5', name: 'Isabella', text: 'Sent you an attachment', time: '20 Jun' },
  {
    id: '6',
    name: 'John Mendala',
    text: 'The audio call ended',
    time: '20 Jun',
  },
];

export default function FriendsList() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const navigation = useNavigation<any>();

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-[#1a2a22]';
  const subText = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgColor = isDark ? 'bg-[#1a2a22]' : 'bg-gray-100';

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
      <SafeAreaView className="">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-6">
          <View className="flex-row items-center">
            <View
              className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-green-900 items-center justify-center mr-2`}
            >
              <Text className={`font-semibold ${textColor}`}>L</Text>
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
        <View className="px-6 ">
          <View
            className={`flex-row items-center rounded-full px-3 ${bgColor}`}
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

        {/* Stories */}
        <FlatList
          data={stories}
          keyExtractor={i => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          className="my-6"
          renderItem={({ item }) => (
            <View className="items-center mr-5">
              <View
                className={`w-16 h-16 rounded-full bg-green-200 dark:bg-green-900 items-center justify-center`}
              >
                <Text className={`font-semibold ${textColor}`}>
                  {item.name[0]}
                </Text>
              </View>
              <Text className={`text-xs mt-1 ${textColor}`}>{item.name}</Text>
            </View>
          )}
        />

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatScreen', { user: item })}
              className={`flex-row items-center py-3  ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
            >
              <View
                className={`w-14 h-14 rounded-full bg-green-300 dark:bg-green-800 items-center justify-center mr-3`}
              >
                <Text className={`font-bold ${textColor}`}>{item.name[0]}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className={`font-semibold ${textColor}`}>
                    {item.name}
                  </Text>
                  <Text className={`text-xs ${subText}`}>{item.time}</Text>
                </View>
                <Text className={`text-sm mt-1 ${subText}`} numberOfLines={1}>
                  {item.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>

      {/* Bottom navigator */}
      <BottomNavigator active="chat" />
    </LinearGradient>
  );
}
