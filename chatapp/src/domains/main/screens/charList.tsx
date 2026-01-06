// src/screens/ChatList.tsx
import Ionicons from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
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

import { useCurrentUser } from '../../../api/auth'; // optional, for avatar & header
import { useTheme } from '../../../shared/contexts/themeContext';
import { ChatSummary, useChatStore } from '../../../shared/global/chatStore';
import { RootStackParamList } from '../../../types/navigation';
import BottomNavigator from '../components/bottomNavigator';

type ChatListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatList'
>;

export default function ChatList() {
  const { theme } = useTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const currentUserId = useChatStore(state => state.currentUserId);

  const { data: user, isLoading: userLoading } = useCurrentUser(); // optional
  const isDark = theme === 'dark';

  // Refetch chats when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('ChatList screen focused, refetching chats');
      // Invalidate and refetch the userChats query
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    }, [queryClient]),
  );

  // Get chat‑list summaries from store
  const summaries = useChatStore(state => state.summaries);
  const chats: ChatSummary[] = Object.values(summaries).sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
  console.log('chat summaries:', summaries);
  console.log('derived chats:', chats);
  console.log('currentUserId:', currentUserId);

  // Filter if search query is entered (defensive: friend or name may be undefined)
  const filteredChats = chats.filter(c =>
    (c.friend?.name ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  console.log('filteredChats:', filteredChats);

  // Loading fallback (optionally based on user loading or store initial state)
  // if (userLoading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" color="#16a34a" />
  //     </View>
  //   );
  // }

  const handleOpenChat = (chat: ChatSummary) => {
    // mark preview as read in store (unreadCount reset)
    useChatStore.getState().markChatRead(chat.chatId);
    console.log('Navigating to ChatScreen with friend:', chat.friend);

    navigation.navigate('ChatScreen', {
      chatId: chat.chatId,
      friend: chat.friend,
    });
  };

  return (
    <LinearGradient
      colors={
        isDark ? ['#0f3d2e', '#09261e', '#000'] : ['#b8e1af', '#d3f9d8', '#fff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          // style={{
          //   flexDirection: 'row',
          //   justifyContent: 'space-between',
          //   paddingHorizontal: 24,
          //   paddingVertical: 20,
          // }}
          className="flex flex-row items-center justify-between px-6 py-5"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                borderWidth: 2,
                borderColor: '#16a34a',
                borderRadius: 50,
                padding: 8,
                marginRight: 16,
              }}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#6B7280',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="person-outline" size={40} color="#fff" />
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: isDark ? '#fff' : '#1a2a22',
              }}
            >
              Messages
            </Text>
          </View>
          <Ionicons
            name="people-circle-outline"
            size={28}
            color={isDark ? '#fff' : '#1a2a22'}
            onPress={() => navigation.navigate('Friendlist')}
          />
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

        {/* Chat List */}
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <FlatList
            data={filteredChats}
            keyExtractor={item => item.chatId}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const friend = item.friend;
              const lastMessage = item.lastMessage ?? 'Say hi!';
              const lastMessageAt = item.lastMessageAt;
              const lastMessageTime = lastMessageAt
                ? new Date(lastMessageAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              const unreadCount = item.unreadCount ?? 0;

              return (
                <TouchableOpacity
                  onPress={() => handleOpenChat(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                  }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#6B7280',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    {friend?.avatar ? (
                      <Image
                        source={{ uri: friend.avatar }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <Ionicons name="person-outline" size={28} color="#fff" />
                    )}
                  </View>

                  {/* Name + Last Message */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: isDark ? '#fff' : '#1a2a22',
                      }}
                    >
                      {friend?.name ?? 'Unknown'}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: isDark ? '#9CA3AF' : '#4B5563',
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {lastMessage}
                      </Text>

                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? '#9CA3AF' : '#4B5563',
                        }}
                      >
                        {lastMessageTime}
                      </Text>
                    </View>
                  </View>

                  {/* Unread Count */}
                  {unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: '#16a34a',
                        borderRadius: 12,
                        minWidth: 24,
                        paddingHorizontal: 6,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>

      <BottomNavigator active="chat" />
    </LinearGradient>
  );
}
