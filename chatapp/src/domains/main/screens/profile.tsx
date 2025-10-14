import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

const Profile = ({ navigation }: any) => {
  const { theme, toggleTheme } = useTheme();

  const highlights: any[] = [];
  const posts: any[] = [];

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
              audi
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
          {/* Profile section */}
          <View className="flex-row items-start gap-4 mb-4 mt-2">
            {/* Profile Picture */}
            <View className="relative">
              <LinearGradient
                colors={['#facc15', '#ec4899', '#8b5cf6']}
                className="w-20 h-20 rounded-full p-1"
              >
                <View className="bg-black rounded-full flex-1 items-center justify-center">
                  <Ionicons name="car-sport-outline" size={40} color="#fff" />
                </View>
              </LinearGradient>
            </View>

            {/* Stats */}
            <View className="flex-1 flex-row justify-around text-center">
              {[
                { label: 'publicações', value: '0' },
                { label: 'seguidores', value: '0' },
                { label: 'seguindo', value: '0' },
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
              Audi
            </Text>
            <Text
              className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Innovating the road ahead | Be part of progress | {'\n'}
              #VorsprungDurchTechnik
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity className="flex-1 bg-[#1a2a22] rounded-full py-2 items-center">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-sm mr-1">
                  Seguindo
                </Text>
                <Ionicons name="chevron-down" color="#fff" size={14} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-[#1a2a22] rounded-full py-2 items-center">
              <Text className="text-white font-semibold text-sm">Mensagem</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-[#1a2a22] rounded-full py-2 px-3 items-center justify-center">
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Highlights */}
          {highlights.length === 0 ? (
            <View className="items-center mb-6">
              <Text
                className={`text-sm italic ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No highlights yet
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {highlights.map((highlight, i) => (
                <View key={i} className="items-center mr-4">
                  <View className="w-16 h-16 rounded-full border-2 border-gray-600 overflow-hidden mb-1">
                    <Image
                      source={highlight.image}
                      className="w-full h-full rounded-full"
                      resizeMode="cover"
                    />
                  </View>
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
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <View className="items-center mt-6">
              <Ionicons
                name="images-outline"
                size={48}
                color={theme === 'dark' ? '#555' : '#aaa'}
              />
              <Text
                className={`text-sm italic mt-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No posts yet
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {posts.map((post, i) => (
                <Image
                  key={i}
                  source={post}
                  className="w-[32%] aspect-square mb-1 rounded-sm"
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="flex-row justify-around py-3 border-t border-gray-700 mt-auto">
          <Ionicons
            name="home-outline"
            size={24}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
          <Ionicons
            name="search-outline"
            size={24}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
          <Ionicons
            name="film-outline"
            size={24}
            color={theme === 'dark' ? '#fff' : '#000'}
          />
          <View className="w-7 h-7 rounded-full border-2 border-white items-center justify-center">
            <Ionicons name="person-outline" size={16} color="#fff" />
          </View>
        </View>

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
