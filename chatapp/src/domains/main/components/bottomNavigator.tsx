// components/BottomNavigator.tsx
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../shared/contexts/themeContext';

const BottomNavigator = ({ active }: { active?: string }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View
      className={`absolute bottom-4 left-0 right-0 flex-row items-center justify-around py-3 z-20 m-2 rounded-xl
        ${theme === 'dark' ? 'bg-[#09261e]/70' : 'bg-gray-200/90'}
      `}
    >
      {/* Home */}
      <TouchableOpacity
        className="items-center"
        // onPress={() => navigation.navigate('FeedScreen')}
        onPress={() => navigation.navigate('FeedScreen')}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={
            active === 'home'
              ? '#4ade80'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000'
          }
        />
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate('ChatList')}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color={
            active === 'chat'
              ? '#4ade80'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000'
          }
        />
      </TouchableOpacity>

      {/* Add */}
      <TouchableOpacity
        className={`w-12 h-12 rounded-full items-center justify-center shadow-lg
          ${theme === 'dark' ? 'bg-green-500' : 'bg-green-700'}
        `}
        onPress={() => navigation.navigate('PostScreen')}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Likes */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons
          name="heart-outline"
          size={24}
          color={
            active === 'likes'
              ? '#4ade80'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000'
          }
        />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name="person-outline"
          size={24}
          color={
            active === 'profile'
              ? '#4ade80'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000'
          }
        />
      </TouchableOpacity>
    </View>
  );
};

export default BottomNavigator;
