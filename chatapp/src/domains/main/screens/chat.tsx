import Ionicons from '@react-native-vector-icons/ionicons';
import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/contexts/themeContext';

export default function ChatScreen() {
  type Message = {
    id: string;
    text: string;
    time: string;
    sender: 'me' | 'other';
  };

  const route = useRoute<any>();
  const { user } = route.params;
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    if (message.trim() === '') return;
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: message,
        time: 'Now',
        sender: 'me',
      },
    ]);
    setMessage('');
  };

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
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <View className="flex-row items-center">
            <Image
              source={{
                uri: 'https://via.placeholder.com/40x40.png?text=U',
              }}
              className="w-10 h-10 rounded-full"
            />
            <View className="ml-2">
              <Text
                className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}
              >
                {user?.name || 'Hi, Johen'}
              </Text>
              <Text className="text-xs text-green-500">Online</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity>
              <Ionicons
                name="call-outline"
                size={20}
                color={isDark ? 'white' : '#1a2a22'}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons
                name="videocam-outline"
                size={20}
                color={isDark ? 'white' : '#1a2a22'}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={isDark ? 'white' : '#1a2a22'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat section */}
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View
              className={`my-1 ${
                item.sender === 'me' ? 'self-end' : 'self-start'
              }`}
            >
              <View
                className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                  item.sender === 'me'
                    ? 'bg-green-700'
                    : isDark
                      ? 'bg-[#1a2a22]'
                      : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm ${
                    item.sender === 'me' ? 'text-white' : 'text-black'
                  }`}
                >
                  {item.text}
                </Text>
              </View>
              <Text
                className={`text-[10px] mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {item.time}
              </Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View className="items-center my-2">
              <Text
                className={`text-xs ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                Today
              </Text>
            </View>
          )}
        />

        {/* Message input */}
        <View
          className={`flex-row items-center px-4 py-2 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <TouchableOpacity>
            <Ionicons
              name="happy-outline"
              size={22}
              color={isDark ? '#9CA3AF' : '#4B5563'}
            />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Message"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`flex-1 mx-2 rounded-full px-4 py-2 text-sm ${
              isDark ? 'bg-[#1a2a22] text-white' : 'bg-gray-100 text-black'
            }`}
          />
          <TouchableOpacity className="mr-3">
            <Ionicons
              name="mic-outline"
              size={22}
              color={isDark ? '#9CA3AF' : '#4B5563'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={sendMessage}>
            <Ionicons name="send" size={22} color="green" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
