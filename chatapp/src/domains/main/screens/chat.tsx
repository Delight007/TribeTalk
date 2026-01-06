// // ChatScreen.tsx
// import Ionicons from '@react-native-vector-icons/ionicons';
// import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useChatMessages, useCurrentUser } from '../../../api/auth';
// import api from '../../../api/axios';
// import { getSocket } from '../../../shared/contexts/socketIo';
// import { useTheme } from '../../../shared/contexts/themeContext';
// import {
//   Message as StoreMessage,
//   useChatStore,
// } from '../../../shared/global/chatStore';
// import { RootStackParamList } from '../../../types/navigation';

// type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
// type ChatScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'ChatScreen'
// >;

// export default function ChatScreen() {
//   const route = useRoute<ChatScreenRouteProp>();
//   const navigation = useNavigation<ChatScreenNavigationProp>();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';
//   const { data: currentUser } = useCurrentUser();
//   const flatListRef = useRef<FlatList<StoreMessage>>(null);

//   const {
//     sendMessage,
//     joinRoom,
//     leaveRoom,
//     addMessages,
//     messages: allMessages,
//     markMessagesRead,
//     currentRoomId,
//     setCurrentUser,
//   } = useChatStore();

//   const params = route.params;
//   const friend = params?.friend;
//   const chatId = params?.chatId;
//   const roomId = typeof chatId === 'string' ? chatId : undefined;

//   const {
//     data: chatMessages = [],
//     isLoading,
//     isError,
//     error,
//   } = useChatMessages(roomId);

//   // Set current user in store immediately
//   useEffect(() => {
//     if (currentUser?._id) {
//       setCurrentUser(currentUser._id);
//     }
//   }, [currentUser?._id, setCurrentUser]);

//   // Join room immediately when component mounts
//   useEffect(() => {
//     if (!roomId || !currentUser?._id) return;

//     joinRoom(roomId);
//     return () => {
//       leaveRoom();
//     };
//   }, [roomId, currentUser?._id, joinRoom, leaveRoom]);

//   // Sync server messages to store when they load
//   useEffect(() => {
//     if (!roomId || !chatMessages.length || !currentUser?._id) return;

//     const existingMessages = allMessages[roomId] || [];
//     const newMessages = chatMessages.filter(
//       (serverMsg: StoreMessage) =>
//         serverMsg._id && !existingMessages.some(m => m._id === serverMsg._id),
//     );

//     if (newMessages.length > 0) {
//       // Format messages for store
//       const formattedMessages = newMessages.map((msg: StoreMessage) => {
//         const senderId =
//           typeof msg.sender === 'object' ? (msg.sender as any)._id : msg.sender;
//         const isMe = senderId === currentUser._id;

//         // Determine status based on timestamps
//         let status: 'pending' | 'sent' | 'delivered' | undefined;

//         if (isMe) {
//           if (msg.readAt) {
//             // If readAt exists, message has been delivered and read
//             status = 'delivered';
//           } else if (msg.deliveredAt) {
//             // If deliveredAt exists, message has been delivered
//             status = 'delivered';
//           } else {
//             // Otherwise, it's sent but not delivered yet
//             status = 'sent';
//           }
//         }
//         // For received messages, status remains undefined

//         return {
//           ...msg,
//           chatId: roomId,
//           status,
//         };
//       });

//       addMessages(roomId, formattedMessages);
//     }
//   }, [chatMessages, roomId, allMessages, addMessages, currentUser?._id]);

//   // Mark messages as read when viewing chat
//   useEffect(() => {
//     if (!roomId || !currentUser?._id) return;

//     const roomMsgs = allMessages[roomId] || [];
//     const unreadIds = roomMsgs
//       .filter(msg => {
//         const receiverId =
//           typeof msg.receiver === 'object'
//             ? (msg.receiver as any)._id
//             : msg.receiver;
//         return receiverId === currentUser._id && !msg.readAt && msg._id;
//       })
//       .map(msg => msg._id!)
//       .filter(Boolean);

//     if (unreadIds.length === 0) return;

//     // Emit read receipt via socket
//     const socket = getSocket();
//     socket?.emit('markAsRead', {
//       chatId: roomId,
//       userId: currentUser._id,
//       messageIds: unreadIds,
//     });

//     // Update store
//     markMessagesRead(roomId, unreadIds, new Date().toISOString());
//   }, [roomId, allMessages, currentUser?._id, markMessagesRead]);

//   // Video call handler
//   const handleStartCall = async () => {
//     try {
//       const localUid = Math.floor(Math.random() * 1e9);
//       const response = await api.post('/agora/token', {
//         channelName: roomId,
//         uid: localUid,
//       });

//       const { rtcToken, uid: serverUid } = response.data;
//       const socket = getSocket();
//       if (!socket || !socket.connected) return;

//       socket.emit('startVideoCall', {
//         roomId: roomId,
//         to: friend._id,
//         from: currentUser._id,
//         fromName: currentUser.name,
//         token: rtcToken,
//         uid: serverUid,
//       });
//     } catch (error) {
//       console.error('Error starting video call:', error);
//     }
//   };

//   // Subscribe to call socket events
//   useEffect(() => {
//     const socket = getSocket();
//     if (!socket) return undefined;

//     const onCallAccepted = ({ channel, token, uid }: any) => {
//       navigation.navigate('VideoCall', {
//         channel,
//         token,
//         uid,
//         isInitiator: true,
//         withUserId: friend._id,
//         withUserName: friend.name,
//       });
//     };
//     const onCallRejected = () => console.log('User rejected the call');
//     const onCallUnavailable = () => console.log('User unavailable');

//     socket.on('callAccepted', onCallAccepted);
//     socket.on('callRejected', onCallRejected);
//     socket.on('callUnavailable', onCallUnavailable);

//     return () => {
//       try {
//         socket.off('callAccepted', onCallAccepted);
//         socket.off('callRejected', onCallRejected);
//         socket.off('callUnavailable', onCallUnavailable);
//       } catch (error) {
//         console.warn('Error cleaning up socket listeners:', error);
//       }
//     };
//   }, [navigation]);

//   // Scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (roomId && allMessages[roomId]?.length) {
//       setTimeout(() => {
//         flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
//       }, 100);
//     }
//   }, [roomId, allMessages]);

//   const [inputText, setInputText] = useState<string>('');

//   if (!friend || !friend._id || !currentUser?._id || !roomId) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#16a34a" />
//       </View>
//     );
//   }

//   // Get messages for this room
//   const roomMessages = allMessages[roomId] || [];

//   // If no messages in store yet but we have server messages, use server messages
//   const displayMessages = roomMessages.length > 0 ? roomMessages : chatMessages;

//   // Sort messages by date (newest first for inverted FlatList)
//   const sortedMessages = [...displayMessages].sort(
//     (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
//   );

//   const handleSend = () => {
//     const trimmed = inputText.trim();
//     if (!trimmed || !currentUser._id || !friend._id || !roomId) return;

//     // Use the store's sendMessage which handles everything
//     sendMessage({
//       sender: currentUser._id,
//       receiver: friend._id,
//       text: trimmed,
//     });

//     setInputText('');
//   };

//   const renderItem = ({ item }: { item: StoreMessage }) => {
//     const senderId =
//       typeof item.sender === 'object' ? (item.sender as any)._id : item.sender;
//     const isMe = senderId === currentUser._id;

//     const formatTime = (iso?: string | null) => {
//       if (!iso) return '';
//       try {
//         return new Date(iso).toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       } catch {
//         return '';
//       }
//     };

//     const getStatusIcon = (msg: StoreMessage) => {
//       const iconSize = 14;
//       const gray = isDark ? '#d1d5db' : '#6b7280';
//       const blue = '#34B7F1';

//       // Read status (blue double check)
//       if (msg.readAt) {
//         return (
//           <Ionicons
//             name="checkmark-done-outline"
//             size={iconSize}
//             color={blue}
//           />
//         );
//       }

//       // Delivered status (gray double check)
//       if (msg.deliveredAt || msg.status === 'delivered') {
//         return (
//           <Ionicons
//             name="checkmark-done-outline"
//             size={iconSize}
//             color={gray}
//           />
//         );
//       }

//       // Sent status (single check)
//       if (msg.status === 'sent') {
//         return (
//           <Ionicons name="checkmark-outline" size={iconSize} color={gray} />
//         );
//       }

//       // Pending status (clock)
//       if (msg.status === 'pending') {
//         return <Ionicons name="time-outline" size={iconSize} color={gray} />;
//       }

//       return null;
//     };

//     return (
//       <View
//         style={{
//           alignSelf: isMe ? 'flex-end' : 'flex-start',
//           marginVertical: 4,
//           maxWidth: '80%',
//         }}
//       >
//         <View
//           style={{
//             backgroundColor: isMe
//               ? isDark
//                 ? '#15803d'
//                 : 'green'
//               : isDark
//                 ? '#374151'
//                 : '##16a34a',
//             paddingHorizontal: 12,
//             paddingVertical: 8,
//             borderRadius: 20,
//             borderBottomRightRadius: isMe ? 4 : 20,
//             borderBottomLeftRadius: isMe ? 20 : 4,
//           }}
//         >
//           <Text
//             style={{
//               color: isMe ? 'white' : isDark ? 'white' : 'black',
//               fontSize: 16,
//             }}
//           >
//             {item.text}
//           </Text>
//         </View>

//         <View
//           style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: isMe ? 'flex-end' : 'flex-start',
//             marginTop: 2,
//           }}
//         >
//           <Text
//             style={{
//               fontSize: 11,
//               color: isDark ? '#9ca3af' : '#6b7280',
//               marginRight: isMe ? 4 : 0,
//               marginLeft: isMe ? 0 : 4,
//             }}
//           >
//             {formatTime(item.createdAt)}
//           </Text>

//           {isMe && getStatusIcon(item) && (
//             <View style={{ marginLeft: 4 }}>{getStatusIcon(item)}</View>
//           )}
//         </View>
//       </View>
//     );
//   };

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
//         <View
//           style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             paddingHorizontal: 16,
//             paddingVertical: 12,
//             borderBottomWidth: 1,
//             borderColor: isDark ? '#444' : '#ccc',
//           }}
//         >
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={{ marginRight: 12 }}
//           >
//             <Ionicons
//               name="arrow-back"
//               size={24}
//               color={isDark ? 'white' : '#1f2937'}
//             />
//           </TouchableOpacity>

//           <Image
//             source={{ uri: friend.avatar || 'https://via.placeholder.com/40' }}
//             style={{ width: 40, height: 40, borderRadius: 20 }}
//           />

//           <View style={{ marginLeft: 12, flex: 1 }}>
//             <Text
//               style={{
//                 fontWeight: '600',
//                 fontSize: 16,
//                 color: isDark ? 'white' : '#1f2937',
//               }}
//             >
//               {friend.name}
//             </Text>
//             <Text style={{ fontSize: 12, color: '#16a34a' }}>
//               {isLoading ? 'Loading...' : 'Online'}
//             </Text>
//           </View>

//           <TouchableOpacity
//             onPress={handleStartCall}
//             style={{
//               backgroundColor: isDark ? '#374151' : '#f3f4f6',
//               padding: 8,
//               borderRadius: 20,
//               marginLeft: 8,
//             }}
//           >
//             <Ionicons
//               name="videocam-outline"
//               size={20}
//               color={isDark ? 'white' : '#1f2937'}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Messages */}
//         {isLoading && !sortedMessages.length ? (
//           <View
//             style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
//           >
//             <ActivityIndicator size="large" color="#16a34a" />
//           </View>
//         ) : (
//           <FlatList
//             ref={flatListRef}
//             data={sortedMessages}
//             inverted
//             keyExtractor={(item, index) =>
//               item._id ? item._id : `temp-${index}-${Date.now()}`
//             }
//             contentContainerStyle={{
//               paddingHorizontal: 16,
//               paddingVertical: 8,
//             }}
//             showsVerticalScrollIndicator={false}
//             renderItem={renderItem}
//             ListEmptyComponent={
//               <View
//                 style={{
//                   flex: 1,
//                   justifyContent: 'center',
//                   alignItems: 'center',
//                   marginTop: 100,
//                 }}
//               >
//                 <Text
//                   style={{
//                     color: isDark ? '#9ca3af' : '#6b7280',
//                     fontSize: 16,
//                   }}
//                 >
//                   No messages yet. Start a conversation!
//                 </Text>
//               </View>
//             }
//           />
//         )}

//         {/* Input Area */}
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//         >
//           <View
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               padding: 8,
//               borderTopWidth: 1,
//               borderColor: isDark ? '#444' : '#ccc',
//             }}
//           >
//             <TextInput
//               value={inputText}
//               onChangeText={setInputText}
//               placeholder="Type a message..."
//               placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
//               style={{
//                 flex: 1,
//                 paddingHorizontal: 16,
//                 paddingVertical: Platform.OS === 'ios' ? 12 : 8,
//                 borderRadius: 24,
//                 backgroundColor: isDark ? '#1a2a22' : '#f0f0f0',
//                 //                 color: isDark ? 'white' : 'black',
//                 color: isDark ? 'white' : '#1f2937',
//                 fontSize: 16,
//                 maxHeight: 100,
//               }}
//               multiline
//               enablesReturnKeyAutomatically
//               returnKeyType="send"
//               onSubmitEditing={handleSend}
//             />

//             <TouchableOpacity
//               onPress={handleSend}
//               style={{
//                 marginLeft: 12,
//                 // backgroundColor: inputText.trim()
//                 //   ? '#16a34a'
//                 //   : isDark
//                 //     ? '#374151'
//                 //     : '#d1d5db',
//                 backgroundColor: inputText.trim()
//                   ? '#16a34a'
//                   : isDark
//                     ? '#1a2a22'
//                     : '#f0f0f0',

//                 width: 44,
//                 height: 44,
//                 borderRadius: 22,
//                 justifyContent: 'center',
//                 alignItems: 'center',
//               }}
//               disabled={!inputText.trim()}
//             >
//               <Ionicons
//                 name="send"
//                 size={20}
//                 color={
//                   inputText.trim() ? 'white' : isDark ? '#6b7280' : '#9ca3af'
//                 }
//               />
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </LinearGradient>
//   );
// }

// ChatScreen.tsx
import Ionicons from '@react-native-vector-icons/ionicons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatMessages, useCurrentUser } from '../../../api/auth';
import api from '../../../api/axios';
import { getSocket } from '../../../shared/contexts/socketIo';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useCallStore } from '../../../shared/global/callStore';
import {
  Message as StoreMessage,
  useChatStore,
} from '../../../shared/global/chatStore';
import { RootStackParamList } from '../../../types/navigation';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatScreen'
>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data: currentUser } = useCurrentUser();
  const flatListRef = useRef<FlatList<StoreMessage>>(null);
  const { setActiveCall } = useCallStore();

  const params = route.params;
  const friend = params?.friend;
  const chatId = params?.chatId;

  // Early validation
  if (!friend || !friend._id || !currentUser?._id || !chatId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Now we can safely assert these are defined
  const roomId = chatId as string;
  const userId = currentUser._id as string;
  const friendId = friend._id as string;
  const friendName = friend.name as string;

  const {
    sendMessage,
    joinRoom,
    leaveRoom,
    addMessages,
    messages: allMessages,
    markMessagesRead,
    currentRoomId,
    setCurrentUser,
  } = useChatStore();

  const {
    data: chatMessages = [],
    isLoading,
    isError,
    error,
  } = useChatMessages(roomId);

  // Set current user in store immediately
  useEffect(() => {
    if (userId) {
      setCurrentUser(userId);
    }
  }, [userId, setCurrentUser]);

  // Join room immediately when component mounts
  useEffect(() => {
    if (!roomId || !userId) return;

    joinRoom(roomId);
    return () => {
      leaveRoom();
    };
  }, [roomId, userId, joinRoom, leaveRoom]);

  // Sync server messages to store when they load
  useEffect(() => {
    if (!roomId || !chatMessages.length || !userId) return;

    const existingMessages = allMessages[roomId] || [];
    const newMessages = chatMessages.filter(
      (serverMsg: StoreMessage) =>
        serverMsg._id && !existingMessages.some(m => m._id === serverMsg._id),
    );

    if (newMessages.length > 0) {
      // Format messages for store
      const formattedMessages = newMessages.map((msg: StoreMessage) => {
        const senderId =
          typeof msg.sender === 'object' ? (msg.sender as any)._id : msg.sender;
        const isMe = senderId === userId;

        // Determine status based on timestamps
        let status: 'pending' | 'sent' | 'delivered' | undefined;

        if (isMe) {
          if (msg.readAt) {
            // If readAt exists, message has been delivered and read
            status = 'delivered';
          } else if (msg.deliveredAt) {
            // If deliveredAt exists, message has been delivered
            status = 'delivered';
          } else {
            // Otherwise, it's sent but not delivered yet
            status = 'sent';
          }
        }
        // For received messages, status remains undefined

        return {
          ...msg,
          chatId: roomId,
          status,
        };
      });

      addMessages(roomId, formattedMessages);
    }
  }, [chatMessages, roomId, allMessages, addMessages, userId]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!roomId || !userId) return;

    const roomMsgs = allMessages[roomId] || [];
    const unreadIds = roomMsgs
      .filter(msg => {
        const receiverId =
          typeof msg.receiver === 'object'
            ? (msg.receiver as any)._id
            : msg.receiver;
        return receiverId === userId && !msg.readAt && msg._id;
      })
      .map(msg => msg._id!)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    // Emit read receipt via socket
    const socket = getSocket();
    socket?.emit('markAsRead', {
      chatId: roomId,
      userId: userId,
      messageIds: unreadIds,
    });

    // Update store
    markMessagesRead(roomId, unreadIds, new Date().toISOString());
  }, [roomId, allMessages, userId, markMessagesRead]);

  // Video call handler - NOW NAVIGATES IMMEDIATELY
  // const handleStartCall = async () => {
  //   try {
  //     const localUid = Math.floor(Math.random() * 1e9);
  //     const response = await api.post('/agora/token', {
  //       channelName: roomId,
  //       uid: localUid,
  //     });

  //     const { rtcToken, uid: serverUid } = response.data;
  //     const socket = getSocket();

  //     // Navigate to VideoCall screen IMMEDIATELY
  //     navigation.navigate('VideoCall', {
  //       channel: roomId,
  //       token: rtcToken,
  //       uid: serverUid,
  //       isInitiator: true,
  //       withUserId: friendId,
  //       withUserName: friendName,
  //     });

  //     // Also set active call in store
  //     setActiveCall({
  //       channel: roomId,
  //       token: rtcToken,
  //       uid: serverUid,
  //       isInitiator: true,
  //       withUserId: friendId,
  //       withUserName: friendName,
  //       // status: 'ringing',
  //     });

  //     // Then emit the call request
  //     if (socket && socket.connected) {
  //       socket.emit('startVideoCall', {
  //         roomId: roomId,
  //         to: friendId,
  //         from: userId,
  //         fromName: currentUser.name,
  //         token: rtcToken,
  //         uid: serverUid,
  //       });
  //     } else {
  //       console.warn('Socket not connected, call may not be delivered');
  //     }
  //   } catch (error) {
  //     console.error('Error starting video call:', error);
  //     // You could show an error toast here
  //   }
  // };

  // const handleStartCall = async () => {
  //   try {
  //     const localUid = Math.floor(Math.random() * 1e9);
  //     const response = await api.post('/agora/token', {
  //       channelName: roomId,
  //       uid: localUid,
  //     });

  //     const { rtcToken, uid: serverUid } = response.data;
  //     const socket = getSocket();
  //     if (!socket || !socket.connected) return;

  //     setActiveCall({
  //       channel: roomId,
  //       token: rtcToken,
  //       uid: serverUid,
  //       isInitiator: true,
  //       withUserId: friendId,
  //       withUserName: friendName,
  //     });

  //     // Store outgoing call state
  //     socket.emit('startVideoCall', {
  //       roomId: roomId,
  //       to: friend._id,
  //       from: currentUser._id,
  //       fromName: currentUser.name,
  //       token: rtcToken,
  //       uid: serverUid,
  //     });
  //   } catch (error) {
  //     console.error('Error starting video call:', error);
  //   }
  // };

  // Subscribe to call socket events for rejection/unavailable only

  // const handleStartCall = async () => {
  //   try {
  //     const localUid = Math.floor(Math.random() * 1e9);
  //     const response = await api.post('/agora/token', {
  //       channelName: roomId,
  //       uid: localUid,
  //     });

  //     const { rtcToken } = response.data;
  //     const socket = getSocket();
  //     if (!socket || !socket.connected) return;

  //     setActiveCall({
  //       channel: roomId,
  //       token: rtcToken,
  //       uid: localUid,
  //       isInitiator: true,
  //       withUserId: friendId,
  //       withUserName: friendName,
  //     });

  //     socket.emit('startVideoCall', {
  //       roomId: roomId,
  //       to: friend._id,
  //       from: currentUser._id,
  //       fromName: currentUser.name,
  //       token: rtcToken,
  //       uid: localUid,
  //     });

  //     // Navigate safely after interactions
  //     InteractionManager.runAfterInteractions(() => {
  //       navigation.navigate('VideoCall', {
  //         channel: roomId,
  //         token: rtcToken,
  //         uid: localUid,
  //         isInitiator: true,
  //         withUserId: friendId,
  //         withUserName: friendName,
  //       });
  //     });
  //   } catch (error) {
  //     console.error('Error starting video call:', error);
  //   }
  // };

  const handleStartCall = async () => {
    try {
      // Generate a random UID for this client
      const localUid = Math.floor(Math.random() * 1e9);

      // Request an Agora token from your backend
      const response = await api.post('/agora/token', {
        channelName: roomId,
        uid: localUid,
      });

      const { rtcToken } = response.data;

      if (!rtcToken) {
        console.error('No RTC token returned from server');
        return;
      }

      // Set the active call in your app state (optional)
      setActiveCall({
        channel: roomId,
        token: rtcToken,
        uid: localUid, // use the same UID you sent
        isInitiator: true,
        withUserId: friendId,
        withUserName: friendName,
      });

      // Emit startVideoCall event to the peer
      const socket = getSocket();
      if (!socket || !socket.connected) return;

      socket.emit('startVideoCall', {
        roomId: roomId,
        to: friend._id,
        from: currentUser._id,
        fromName: currentUser.name,
        token: rtcToken,
        uid: localUid,
      });

      // Navigate after interactions
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('VideoCall', {
          channel: roomId,
          token: rtcToken,
          uid: localUid,
          isInitiator: true,
          withUserId: friendId,
          withUserName: friendName,
        });
      });
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onCallRejected = () => {
      console.log('User rejected the call');
    };

    const onCallUnavailable = () => {
      console.log('User unavailable');
    };

    socket.on('callRejected', onCallRejected);
    socket.on('callUnavailable', onCallUnavailable);

    return () => {
      try {
        socket.off('callRejected', onCallRejected);
        socket.off('callUnavailable', onCallUnavailable);
      } catch (error) {
        console.warn('Error cleaning up socket listeners:', error);
      }
    };
  }, [navigation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (roomId && allMessages[roomId]?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [roomId, allMessages]);

  const [inputText, setInputText] = useState<string>('');

  // Get messages for this room
  const roomMessages = allMessages[roomId] || [];

  // If no messages in store yet but we have server messages, use server messages
  const displayMessages = roomMessages.length > 0 ? roomMessages : chatMessages;

  // Sort messages by date (newest first for inverted FlatList)
  const sortedMessages = [...displayMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !userId || !friendId || !roomId) return;

    // Use the store's sendMessage which handles everything
    sendMessage({
      sender: userId,
      receiver: friendId,
      text: trimmed,
    });

    setInputText('');
  };

  const renderItem = ({ item }: { item: StoreMessage }) => {
    const senderId =
      typeof item.sender === 'object' ? (item.sender as any)._id : item.sender;
    const isMe = senderId === userId;

    const formatTime = (iso?: string | null) => {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    };

    const getStatusIcon = (msg: StoreMessage) => {
      const iconSize = 14;
      const gray = isDark ? '#d1d5db' : '#6b7280';
      const blue = '#34B7F1';

      // Read status (blue double check)
      if (msg.readAt) {
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={iconSize}
            color={blue}
          />
        );
      }

      // Delivered status (gray double check)
      if (msg.deliveredAt || msg.status === 'delivered') {
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={iconSize}
            color={gray}
          />
        );
      }

      // Sent status (single check)
      if (msg.status === 'sent') {
        return (
          <Ionicons name="checkmark-outline" size={iconSize} color={gray} />
        );
      }

      // Pending status (clock)
      if (msg.status === 'pending') {
        return <Ionicons name="time-outline" size={iconSize} color={gray} />;
      }

      return null;
    };

    return (
      <View
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          maxWidth: '80%',
        }}
      >
        <View
          style={{
            backgroundColor: isMe
              ? isDark
                ? '#15803d'
                : 'green'
              : isDark
                ? '#374151'
                : '#d1fae5',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderBottomRightRadius: isMe ? 4 : 20,
            borderBottomLeftRadius: isMe ? 20 : 4,
          }}
        >
          <Text
            style={{
              color: isMe ? 'white' : isDark ? 'white' : 'black',
              fontSize: 16,
            }}
          >
            {item.text}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginRight: isMe ? 4 : 0,
              marginLeft: isMe ? 0 : 4,
            }}
          >
            {formatTime(item.createdAt)}
          </Text>

          {isMe && getStatusIcon(item) && (
            <View style={{ marginLeft: 4 }}>{getStatusIcon(item)}</View>
          )}
        </View>
      </View>
    );
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: isDark ? '#444' : '#ccc',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? 'white' : '#1f2937'}
            />
          </TouchableOpacity>

          <Image
            source={{ uri: friend.avatar || 'https://via.placeholder.com/40' }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 16,
                color: isDark ? 'white' : '#1f2937',
              }}
            >
              {friendName}
            </Text>
            <Text style={{ fontSize: 12, color: '#16a34a' }}>
              {isLoading ? 'Loading...' : 'Online'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleStartCall}
            style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              padding: 8,
              borderRadius: 20,
              marginLeft: 8,
            }}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color={isDark ? 'white' : '#1f2937'}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading && !sortedMessages.length ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={sortedMessages}
            inverted
            keyExtractor={(item, index) =>
              item._id ? item._id : `temp-${index}-${Date.now()}`
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 100,
                }}
              >
                <Text
                  style={{
                    color: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: 16,
                  }}
                >
                  No messages yet. Start a conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderTopWidth: 1,
              borderColor: isDark ? '#444' : '#ccc',
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                borderRadius: 24,
                backgroundColor: isDark ? '#1a2a22' : '#f0f0f0',
                color: isDark ? 'white' : '#1f2937',
                fontSize: 16,
                maxHeight: 100,
              }}
              multiline
              enablesReturnKeyAutomatically
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity
              onPress={handleSend}
              style={{
                marginLeft: 12,
                backgroundColor: inputText.trim()
                  ? '#16a34a'
                  : isDark
                    ? '#1a2a22'
                    : '#f0f0f0',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() ? 'white' : isDark ? '#6b7280' : '#9ca3af'
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
