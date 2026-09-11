// // src/screens/ChatList.tsx
// import Ionicons from '@react-native-vector-icons/ionicons';
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { useQueryClient } from '@tanstack/react-query';
// import React, { useCallback, useMemo, useState } from 'react';
// import {
//   FlatList,
//   Image,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { useCurrentUser } from '../../../api/auth'; // optional, for avatar & header
// import { useTheme } from '../../../shared/contexts/themeContext';
// import { ChatSummary, useChatStore } from '../../../shared/global/chatStore';
// import { RootStackParamList } from '../../../types/navigation';
// import BottomNavigator from '../components/bottomNavigator';

// // Memoized chat item component to prevent unnecessary re-renders
// const ChatListItem = React.memo(
//   ({
//     item,
//     onPress,
//     isDark,
//   }: {
//     item: ChatSummary;
//     onPress: (chat: ChatSummary) => void;
//     isDark: boolean;
//   }) => {
//     const friend = item.friend;
//     const lastMessage = item.lastMessage ?? 'Say hi!';
//     const lastMessageAt = item.lastMessageAt;
//     const lastMessageTime = lastMessageAt
//       ? new Date(lastMessageAt).toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         })
//       : '';
//     const unreadCount = item.unreadCount ?? 0;

//     return (
//       <TouchableOpacity
//         onPress={() => onPress(item)}
//         style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           paddingVertical: 12,
//         }}
//       >
//         {/* Avatar */}
//         <View
//           style={{
//             width: 56,
//             height: 56,
//             borderRadius: 28,
//             backgroundColor: '#6B7280',
//             justifyContent: 'center',
//             alignItems: 'center',
//             marginRight: 12,
//           }}
//         >
//           {friend?.avatar ? (
//             <Image
//               source={{ uri: friend.avatar }}
//               style={{ width: 56, height: 56, borderRadius: 28 }}
//             />
//           ) : (
//             <Ionicons name="person-outline" size={28} color="#fff" />
//           )}
//         </View>

//         {/* Name + Last Message */}
//         <View style={{ flex: 1 }}>
//           <Text
//             style={{
//               fontSize: 16,
//               fontWeight: '500',
//               color: isDark ? '#fff' : '#1a2a22',
//             }}
//           >
//             {friend?.name ?? 'Unknown'}
//           </Text>

//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//             }}
//           >
//             <Text
//               style={{
//                 fontSize: 14,
//                 color: isDark ? '#9CA3AF' : '#4B5563',
//                 marginTop: 2,
//               }}
//               numberOfLines={1}
//               ellipsizeMode="tail"
//             >
//               {lastMessage}
//             </Text>

//             <Text
//               style={{
//                 fontSize: 12,
//                 color: isDark ? '#9CA3AF' : '#4B5563',
//               }}
//             >
//               {lastMessageTime}
//             </Text>
//           </View>
//         </View>

//         {/* Unread Count */}
//         {unreadCount > 0 && (
//           <View
//             style={{
//               backgroundColor: '#16a34a',
//               borderRadius: 12,
//               minWidth: 24,
//               paddingHorizontal: 6,
//               height: 24,
//               justifyContent: 'center',
//               alignItems: 'center',
//               marginLeft: 8,
//             }}
//           >
//             <Text
//               style={{
//                 color: '#fff',
//                 fontSize: 12,
//                 fontWeight: '600',
//               }}
//             >
//               {unreadCount}
//             </Text>
//           </View>
//         )}
//       </TouchableOpacity>
//     );
//   },
// );

// type ChatListNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'ChatList'
// >;

// export default function ChatList() {
//   const { theme } = useTheme();
//   const navigation = useNavigation<ChatListNavigationProp>();
//   const [query, setQuery] = useState('');
//   const queryClient = useQueryClient();
//   const { data: user, isLoading: userLoading } = useCurrentUser();
//   const isDark = useMemo(() => theme === 'dark', [theme]);

//   // Use simple store selectors
//   const currentUserId = useChatStore(state => state.currentUserId);
//   const summaries = useChatStore(state => state.summaries);

//   // Create stable dependency for chats memoization
//   const summariesFingerprint = useMemo(() => {
//     return Object.keys(summaries)
//       .sort()
//       .map(
//         key =>
//           `${key}:${summaries[key].lastMessageAt}:${summaries[key].unreadCount}`,
//       )
//       .join('|');
//   }, [summaries]);

//   // Memoize chats with stable reference check
//   const chats = useMemo(() => {
//     const summaryValues = Object.values(summaries);
//     if (summaryValues.length === 0) return [];

//     // Sort by lastMessageAt descending (create new array to avoid mutating original)
//     return summaryValues
//       .slice()
//       .sort(
//         (a, b) =>
//           new Date(b.lastMessageAt).getTime() -
//           new Date(a.lastMessageAt).getTime(),
//       );
//   }, [summariesFingerprint]);

//   // Filter chats based on search query - only filter if query exists
//   const filteredChats = useMemo(() => {
//     if (!query.trim()) return chats;
//     return chats.filter(c =>
//       (c.friend?.name ?? '').toLowerCase().includes(query.toLowerCase()),
//     );
//   }, [chats, query]);

//   const handleOpenChat = useCallback(
//     (chat: ChatSummary) => {
//       // mark preview as read in store (unreadCount reset)
//       useChatStore.getState().markChatRead(chat.chatId);
//       console.log('Navigating to ChatScreen with friend:', chat.friend);

//       navigation.navigate('ChatScreen', {
//         chatId: chat.chatId,
//         friend: chat.friend,
//       });
//     },
//     [navigation],
//   );

//   return (
//     <LinearGradient
//       colors={
//         isDark ? ['#0f3d2e', '#09261e', '#000'] : ['#b8e1af', '#d3f9d8', '#fff']
//       }
//       locations={[0, 0.2, 1]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={{ flex: 1 }}
//     >
//       <SafeAreaView style={{ flex: 1 }}>
//         {/* Header */}
//         <View className="flex flex-row items-center justify-between px-6 py-5">
//           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//             <View
//               style={{
//                 borderWidth: 2,
//                 borderColor: '#16a34a',
//                 borderRadius: 50,
//                 padding: 8,
//                 marginRight: 16,
//               }}
//             >
//               {user?.avatar ? (
//                 <Image
//                   source={{ uri: user.avatar }}
//                   style={{ width: 50, height: 50, borderRadius: 25 }}
//                 />
//               ) : (
//                 <View
//                   style={{
//                     width: 50,
//                     height: 50,
//                     borderRadius: 25,
//                     backgroundColor: '#6B7280',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                   }}
//                 >
//                   <Ionicons name="person-outline" size={40} color="#fff" />
//                 </View>
//               )}
//             </View>
//             <Text
//               style={{
//                 fontSize: 24,
//                 fontWeight: '600',
//                 color: isDark ? '#fff' : '#1a2a22',
//               }}
//             >
//               Messages
//             </Text>
//           </View>
//           <Ionicons
//             name="people-circle-outline"
//             size={28}
//             color={isDark ? '#fff' : '#1a2a22'}
//             onPress={() => navigation.navigate('Friendlist')}
//           />
//         </View>

//         {/* Search Bar */}
//         <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
//           <View
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               borderWidth: 1,
//               borderRadius: 50,
//               borderColor: '#16a34a',
//               paddingHorizontal: 12,
//               backgroundColor: isDark ? '#1a2a22' : '#f0f0f0',
//             }}
//           >
//             <Ionicons
//               name="search"
//               size={18}
//               color={isDark ? '#9CA3AF' : '#4B5563'}
//             />
//             <TextInput
//               placeholder="Search here"
//               placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
//               value={query}
//               onChangeText={setQuery}
//               style={{
//                 flex: 1,
//                 marginLeft: 8,
//                 height: 48,
//                 color: isDark ? '#fff' : '#000',
//               }}
//             />
//           </View>
//         </View>

//         {/* Chat List */}
//         <View style={{ flex: 1, paddingHorizontal: 24 }}>
//           <FlatList
//             data={filteredChats}
//             keyExtractor={item => item.chatId}
//             showsVerticalScrollIndicator={false}
//             renderItem={({ item }) => (
//               <ChatListItem
//                 item={item}
//                 onPress={handleOpenChat}
//                 isDark={isDark}
//               />
//             )}
//           />
//         </View>
//       </SafeAreaView>

//       <BottomNavigator active="chat" />
//     </LinearGradient>
//   );
// }

import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
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

import { useCurrentUser } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { ChatSummary, useChatStore } from '../../../shared/global/chatStore';
import { RootStackParamList } from '../../../types/navigation';
import BottomNavigator from '../components/bottomNavigator';

type ChatListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatList'
>;

const formatChatTime = (date?: string) => {
  if (!date) return '';

  const messageDate = new Date(date);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return messageDate.toLocaleDateString([], { weekday: 'short' });
};

const ChatListItem = React.memo(
  ({
    item,
    onPress,
    isDark,
    isPinned,
  }: {
    item: ChatSummary;
    onPress: (chat: ChatSummary) => void;
    isDark: boolean;
    isPinned: boolean;
  }) => {
    const friend = item.friend;
    const unreadCount = item.unreadCount ?? 0;
    const lastMessage = item.lastMessage ?? 'Say hi!';
    const hasAvatar = Boolean(friend?.avatar);

    const colors = {
      card: isDark ? 'rgba(12, 52, 42, 0.72)' : 'rgba(255,255,255,0.82)',
      name: isDark ? '#F8FAFC' : '#17211D',
      preview: isDark ? '#A7B6B0' : '#607067',
      time: isDark ? '#B4C0BB' : '#6B7B73',
      online: '#34D399',
      badge: '#4ADE80',
      pinnedBg: isDark ? '#0D4939' : '#DCFCE7',
      pinnedText: isDark ? '#9AF4BE' : '#15803D',
    };

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 10,
        }}
      >
        <View style={{ position: 'relative', marginRight: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#64748B',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {hasAvatar ? (
              <Image
                source={{ uri: friend?.avatar }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Ionicons name="person-outline" size={25} color="#FFFFFF" />
            )}
          </View>

          <View
            style={{
              position: 'absolute',
              right: 1,
              bottom: 1,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: colors.online,
              borderWidth: 2,
              borderColor: colors.card,
            }}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 3,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                color: colors.name,
                fontSize: 17,
                fontWeight: '700',
              }}
            >
              {friend?.name ?? 'Unknown'}
            </Text>

            {isPinned && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.pinnedBg,
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Ionicons
                  name="pin"
                  size={11}
                  color={colors.pinnedText}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: colors.pinnedText,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  Pinned
                </Text>
              </View>
            )}
          </View>

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              color: colors.preview,
              fontSize: 14,
              lineHeight: 18,
              paddingRight: 8,
            }}
          >
            {lastMessage}
          </Text>
        </View>

        <View
          style={{
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            alignSelf: 'stretch',
            paddingVertical: 4,
            marginLeft: 8,
          }}
        >
          <Text
            style={{
              color: colors.time,
              fontSize: 12,
              fontWeight: '500',
            }}
          >
            {formatChatTime(item.lastMessageAt)}
          </Text>

          {unreadCount > 0 && (
            <View
              style={{
                minWidth: 24,
                height: 24,
                paddingHorizontal: 6,
                borderRadius: 12,
                backgroundColor: colors.badge,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#052E20',
                  fontSize: 12,
                  fontWeight: '800',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

export default function ChatList() {
  const { theme } = useTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const { data: user } = useCurrentUser();
  const [query, setQuery] = useState('');

  const isDark = theme === 'dark';
  const summaries = useChatStore(state => state.summaries);

  const chats = useMemo(() => {
    return Object.values(summaries)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      );
  }, [summaries]);

  const filteredChats = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return chats;

    return chats.filter(chat =>
      (chat.friend?.name ?? '').toLowerCase().includes(search),
    );
  }, [chats, query]);

  // Temporarily pins chats with unread messages.
  // Replace this later with a real `isPinned` field from your backend/store.
  const pinnedChats = filteredChats.filter(chat => (chat.unreadCount ?? 0) > 0);
  const regularChats = filteredChats.filter(
    chat => (chat.unreadCount ?? 0) === 0,
  );

  const handleOpenChat = useCallback(
    (chat: ChatSummary) => {
      useChatStore.getState().markChatRead(chat.chatId);

      navigation.navigate('ChatScreen', {
        chatId: chat.chatId,
        friend: chat.friend,
      });
    },
    [navigation],
  );

  const colors = {
    title: isDark ? '#FFFFFF' : '#17211D',
    searchBg: isDark ? 'rgba(16, 49, 41, 0.88)' : 'rgba(255,255,255,0.86)',
    searchBorder: isDark ? '#244F43' : '#C7D8CF',
    searchText: isDark ? '#FFFFFF' : '#17211D',
    placeholder: isDark ? '#9FAFA8' : '#718178',
    section: isDark ? '#BAC7C1' : '#486157',
    composeBorder: '#36E984',
    icon: isDark ? '#64F4A5' : '#16A34A',
  };

  const renderSection = (
    title: string,
    data: ChatSummary[],
    pinned: boolean,
  ) => {
    if (!data.length) return null;

    return (
      <>
        <Text
          style={{
            color: colors.section,
            fontSize: 16,
            fontWeight: '700',
            marginTop: title === 'Pinned' ? 4 : 18,
            marginBottom: 10,
          }}
        >
          {title}
        </Text>

        {data.map(item => (
          <ChatListItem
            key={item.chatId}
            item={item}
            isDark={isDark}
            isPinned={pinned}
            onPress={handleOpenChat}
          />
        ))}
      </>
    );
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0C3E31', '#08271F', '#020B08']
          : ['#E6F4EA', '#C8E6C9', '#A5D6A7']
      }
      locations={[0, 0.42, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ position: 'relative', marginRight: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  overflow: 'hidden',
                  backgroundColor: '#64748B',
                }}
              >
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="person-outline" size={28} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 1,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#34D399',
                  borderWidth: 2,
                  borderColor: isDark ? '#0C3E31' : '#E6F4EA',
                }}
              />
            </View>

            <Text
              style={{
                color: colors.title,
                fontSize: 30,
                fontWeight: '800',
                letterSpacing: -1,
              }}
            >
              Messages
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Friendlist')}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.composeBorder,
              backgroundColor: isDark
                ? 'rgba(8, 48, 38, 0.75)'
                : 'rgba(255,255,255,0.72)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="create-outline" size={25} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 18 }}>
          <View
            style={{
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: colors.searchBg,
              borderWidth: 1,
              borderColor: colors.searchBorder,
            }}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={colors.placeholder}
            />

            <TextInput
              placeholder="Search conversations"
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
              style={{
                flex: 1,
                height: '100%',
                marginLeft: 10,
                color: colors.searchText,
                fontSize: 16,
              }}
            />
          </View>
        </View>

        <FlatList
          data={[{ key: 'chat-content' }]}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 122,
          }}
          renderItem={() => (
            <View>
              {renderSection('Pinned', pinnedChats, true)}
              {renderSection('Messages', regularChats, false)}

              {!filteredChats.length && (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={46}
                    color={colors.placeholder}
                  />
                  <Text
                    style={{
                      color: colors.placeholder,
                      fontSize: 16,
                      marginTop: 12,
                    }}
                  >
                    No conversations found
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </SafeAreaView>

      <BottomNavigator active="chat" />
    </LinearGradient>
  );
}
