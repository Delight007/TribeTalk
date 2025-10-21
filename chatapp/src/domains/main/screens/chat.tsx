import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import io, { Socket } from 'socket.io-client';
import {
  useChatMessages,
  useCurrentUser,
  useSendMessage,
} from '../../../api/auth';
import api from '../../../api/axios';
import { useTheme } from '../../../shared/contexts/themeContext';
import { RootStackParamList } from '../../../types/navigation';

const SOCKET_URL = 'http://192.168.43.72:3000';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatScreen'
>;

type Message = {
  _id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt?: string;
  status?: string;
};

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user } = route.params; // person you are chatting with
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const { data: currentUser } = useCurrentUser();
  const [message, setMessage] = useState('');
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [incomingCall, setIncomingCall] = useState<null | {
    from: string;
    channel: string;
    token: string;
  }>(null);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  if (!currentUser?._id)
    return <ActivityIndicator size="large" color="green" />;

  const roomId = [currentUser._id, user._id].sort().join('_');
  const { data: chatMessages = [] } = useChatMessages(roomId);
  const sendMessageMutation = useSendMessage();

  // ✅ Load cached messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem(`chat_${roomId}`);
        if (stored) setLoadedMessages(JSON.parse(stored));
      } catch (err) {
        console.log('Error loading cached chat:', err);
      } finally {
        setIsLoadingCache(false);
      }
    };
    loadMessages();
  }, [roomId]);

  // ✅ Setup Socket.IO
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      console.log('🟢 Socket connected:', socketRef.current?.id);
      socketRef.current?.emit('register', currentUser._id);
      socketRef.current?.emit('joinRoom', roomId);
    });

    // --- Handle incoming messages
    socketRef.current.on('receiveMessage', (msg: Message) => {
      setLoadedMessages(prev => {
        const exists = prev.some(m => m._id === msg._id);
        if (exists) return prev;
        const updated = [...prev, msg];
        AsyncStorage.setItem(`chat_${roomId}`, JSON.stringify(updated));
        queryClient.setQueryData(['messages', roomId], updated);
        return updated;
      });
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    // --- Handle incoming video call
    socketRef.current.on(
      'incomingCall',
      ({
        from,
        channel,
        token,
      }: {
        from: string;
        channel: string;
        token: string;
      }) => {
        setIncomingCall({ from, channel, token });
      },
    );

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser, roomId]);

  // ✅ Sync backend messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      setLoadedMessages(chatMessages);
      AsyncStorage.setItem(`chat_${roomId}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // ✅ Send message
  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage: Message = {
      senderId: currentUser._id,
      receiverId: user._id,
      text: message.trim(),
      _id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    socketRef.current?.emit('sendMessage', { roomId, message: newMessage });

    setLoadedMessages(prev => {
      const updated = [...prev, newMessage];
      AsyncStorage.setItem(`chat_${roomId}`, JSON.stringify(updated));
      queryClient.setQueryData(['messages', roomId], updated);
      return updated;
    });

    sendMessageMutation.mutate(newMessage);
    setMessage('');
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // ✅ Outgoing video call
  const handleStartCall = async () => {
    try {
      if (!socketRef.current || !socketRef.current.connected) {
        Alert.alert('Error', 'Socket not connected yet. Please try again.');
        return;
      }

      const res = await api.get(`/agora/token/${roomId}`);
      const { token } = res.data;

      socketRef.current.emit('startVideoCall', {
        roomId,
        from: currentUser._id,
        fromName: currentUser.name,
        to: user._id,
      });

      navigation.navigate('VideoCall', { channel: roomId, token });
    } catch (error) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', 'Unable to start video call. Please try again.');
    }
  };

  if (isLoadingCache) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        isDark ? ['#0f3d2e', '#09261e', '#000'] : ['#b8e1af', '#d3f9d8', '#fff']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View
          className={`flex-row items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <View className="flex-row items-center">
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }}
              className="w-10 h-10 rounded-full"
            />
            <View className="ml-2">
              <Text
                className={`text-base font-semibold ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {user?.name || 'Unknown'}
              </Text>
              <Text className="text-xs text-green-500">Online</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleStartCall}>
            <Ionicons
              name="videocam-outline"
              size={22}
              color={isDark ? 'white' : '#1a2a22'}
            />
          </TouchableOpacity>
        </View>

        {/* MESSAGES LIST */}
        <FlatList
          ref={flatListRef}
          data={loadedMessages}
          keyExtractor={(item, index) =>
            item._id ?? `${index}-${item.senderId}`
          }
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser._id;
            return (
              <View className={`my-1 ${isMe ? 'self-end' : 'self-start'}`}>
                <View
                  className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe
                      ? 'bg-green-700'
                      : isDark
                        ? 'bg-[#d3f9d8]'
                        : 'bg-[#1a2a22]'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isMe ? 'text-white' : isDark ? 'text-black' : 'text-white'
                    }`}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* INPUT */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <View
            className={`flex-row items-center px-4 py-2 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-300'
            }`}
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              className={`flex-1 mx-2 rounded-full px-4 py-2 text-sm ${
                isDark ? 'bg-[#1a2a22] text-white' : 'bg-gray-100 text-black'
              }`}
            />
            <TouchableOpacity onPress={handleSend}>
              <Ionicons name="send" size={22} color="green" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* 📞 Incoming Call Overlay */}
        {incomingCall && (
          <View className="absolute inset-0 bg-black/70 items-center justify-center">
            <View className="bg-white w-80 p-6 rounded-2xl items-center">
              <Text className="text-lg font-bold mb-4">
                {incomingCall.from} is calling…
              </Text>
              <View className="flex-row gap-6">
                <TouchableOpacity
                  onPress={() => {
                    socketRef.current?.emit('rejectCall', {
                      to: incomingCall.from,
                    });
                    setIncomingCall(null);
                  }}
                  className="bg-red-500 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    socketRef.current?.emit('acceptCall', {
                      to: incomingCall.from,
                      channel: incomingCall.channel,
                      uid: currentUser._id,
                    });
                    navigation.navigate('VideoCall', {
                      channel: incomingCall.channel,
                      token: incomingCall.token,
                    });
                    setIncomingCall(null);
                  }}
                  className="bg-green-500 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
