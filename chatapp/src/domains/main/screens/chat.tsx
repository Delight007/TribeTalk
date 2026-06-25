// chatScreen
import { pick, types } from '@react-native-documents/picker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isCancel } from 'axios';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatMessages, useCurrentUser } from '../../../api/auth';
import api from '../../../api/axios';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { getSocket } from '../../../shared/contexts/socketIo';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useCallStore } from '../../../shared/global/callStore';
import {
  Message as StoreMessage,
  useChatStore,
} from '../../../shared/global/chatStore';
import { RootStackParamList } from '../../../types/navigation';
import Video from '../../../utils/appVideo';
import { uploadMediaToCloudinary } from '../../../utils/uploadImages';
import { formatVoiceDuration } from '../../../utils/voiceAudio';
import VoiceNotePlayer from '../../../utils/voiceNotePlayer';
import ChatHeader from '../components/chats/chatHeader';
import VoiceWaveform from '../components/VoiceWaveform';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatScreen'
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;

// Lazy Image Component for better performance
interface LazyImageProps {
  uri: string;
  style?: any;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  itemId?: string; // Optional for future lazy loading implementation
}

const LazyImage: React.FC<LazyImageProps> = ({
  uri,
  style,
  className,
  resizeMode = 'cover',
  itemId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // For simplicity, we'll load images immediately but show loading states
  // In a production app, you might want to use FlatList's onViewableItemsChanged
  // or a library like react-native-lazyload for more sophisticated lazy loading

  return (
    <View>
      {isLoading && (
        <View
          style={style}
          className={`bg-gray-200 dark:bg-gray-700 justify-center items-center ${className || ''}`}
        >
          <ActivityIndicator size="small" color="#16a34a" />
        </View>
      )}
      {!hasError ? (
        <Image
          source={{ uri }}
          style={style}
          className={className}
          resizeMode={resizeMode}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <View
          style={style}
          className={`bg-gray-200 dark:bg-gray-700 justify-center items-center ${className || ''}`}
        >
          <Ionicons name="image-outline" size={32} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Failed to load</Text>
        </View>
      )}
    </View>
  );
};

// Lazy Video Component for better performance
interface LazyVideoProps {
  uri: string;
  style?: any;
  className?: string;
  paused: boolean;
  repeat?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  uri,
  style,
  className,
  paused,
  repeat = true,
  resizeMode = 'cover',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View>
      {isLoading && !paused && (
        <View
          style={style}
          className={`absolute bg-gray-200 dark:bg-gray-700 justify-center items-center ${className || ''}`}
        >
          <ActivityIndicator size="small" color="#16a34a" />
        </View>
      )}
      {!hasError ? (
        <Video
          source={{ uri }}
          style={style}
          controls={false}
          resizeMode={resizeMode}
          paused={paused}
          repeat={repeat}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <View
          style={style}
          className={`bg-gray-200 dark:bg-gray-700 justify-center items-center ${className || ''}`}
        >
          <Ionicons name="videocam-outline" size={32} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Failed to load</Text>
        </View>
      )}
    </View>
  );
};

// Media Loading Component
interface MediaLoaderProps {
  type: 'image' | 'video';
  progress: number;
  width?: number;
  height?: number;
}

const MediaLoader: React.FC<MediaLoaderProps> = ({
  type,
  progress,
  width = MAX_IMAGE_WIDTH,
  height = 200,
}) => {
  return (
    <View
      style={{ width, height }}
      className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 justify-center items-center"
    >
      <View className="absolute inset-0 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>

      {/* Progress overlay */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xs">
            {type === 'image' ? 'Sending photo...' : 'Sending video...'}
          </Text>
          <Text className="text-white text-xs font-medium">
            {progress.toFixed(0)}%
          </Text>
        </View>
        <View className="h-1.5 bg-gray-600 rounded-full overflow-hidden mt-1">
          <View
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* File type icon */}
      <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
        <Ionicons
          name={type === 'image' ? 'image-outline' : 'videocam-outline'}
          size={16}
          color="white"
        />
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?._id;

  const flatListRef = useRef<FlatList<StoreMessage>>(null);
  const { setActiveCall } = useCallStore();

  const params = route.params;
  const friend = params?.friend;
  const chatId = params?.chatId;

  // Animation values for voice note
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const recordSheetAnim = useRef(new Animated.Value(0)).current; // ← add this

  // State variables
  const [inputText, setInputText] = useState<string>('');
  const [showAttachments, setShowAttachments] = useState(false);

  const {
    isRecording,
    recordingSeconds,
    liveBars,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  // Pagination state
  const [messageLimit, setMessageLimit] = useState(50);
  const [messageOffset, setMessageOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Video playback state
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());

  // Memoize trimmed text to optimize send button performance
  const trimmedInputText = useMemo(() => inputText.trim(), [inputText]);
  const canSendMessage = useMemo(
    () => trimmedInputText.length > 0,
    [trimmedInputText],
  );

  // Memoize video playback check for performance
  const isVideoPlaying = useCallback(
    (messageId: string) => {
      return playingVideos.has(messageId);
    },
    [playingVideos],
  );
  const [uploadingMessages, setUploadingMessages] = useState<
    Record<
      string,
      {
        type: 'image' | 'video' | 'voice' | 'document';
        progress: number;
        fileName?: string;
        fileSize?: number;
        duration?: number;
      }
    >
  >({});

  // Use correct type for browser/React Native - just use `null` initial value
  const recordingCooldownRef = useRef(false); // Prevent rapid successive recordings

  // Simulate upload progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadingMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].progress < 100) {
            updated[key].progress = Math.min(updated[key].progress + 10, 100);
          }
        });
        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const pickMediaFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed', // images and videos
      quality: 0.8,
    });

    if (result.didCancel || !result.assets?.length) return null;

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      type: asset.type,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    };
  };

  const pickDocument = async () => {
    try {
      const [res] = await pick({
        allowMultiSelection: false,
        type: [types.allFiles],
      });

      return {
        uri: res.uri,
        type: res.type,
        fileName: res.name,
        fileSize: res.size,
      };
    } catch (err) {
      if (isCancel(err)) return null;
      throw err;
    }
  };

  // All hooks must be called before any early returns
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
  } = useChatMessages(chatId, messageLimit, messageOffset);

  // Early validation - must come after all hooks
  if (!friend || !friend._id || !currentUserId || !chatId) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Now we can safely assert these are defined
  const roomId = chatId as string;
  const userId = currentUser._id as string;
  const friendId = friend._id as string;
  const friendName = friend.name as string;

  // Animation for attachment menu
  useEffect(() => {
    if (showAttachments) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showAttachments]);

  // Animation for voice recording indicator
  useEffect(() => {
    if (isRecording) {
      // Slide sheet up
      Animated.spring(recordSheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      // Pulse the dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Slide sheet back down
      Animated.timing(recordSheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleVoiceNotePressIn = async () => {
    if (isRecording || recordingCooldownRef.current) return;

    const started = await startRecording();
    if (!started) {
      Alert.alert(
        'Microphone Permission',
        'We need microphone access to record voice notes.',
      );
    }
  };

  const handleVoiceNotePressOut = async () => {
    if (!isRecording) return;

    recordingCooldownRef.current = true;
    setTimeout(() => {
      recordingCooldownRef.current = false;
    }, 500);

    const result = await stopRecording();
    if (!result) return;

    const { uri: recordPath, duration, waveform } = result;
    const tempId = `uploading-voice-${Date.now()}`;

    setUploadingMessages(prev => ({
      ...prev,
      [tempId]: { type: 'voice', progress: 0, duration },
    }));

    try {
      const voiceUrl = await uploadMediaToCloudinary(recordPath, {
        isAudio: true,
      });

      setUploadingMessages(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });

      handleSendMessage({
        type: 'voice',
        mediaUrl: voiceUrl,
        fileName: 'voice_message.m4a',
        duration,
        localUri: recordPath,
        waveform,
      });
    } catch (error) {
      console.error('Failed to upload voice note:', error);

      setUploadingMessages(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });

      Alert.alert(
        'Upload Failed',
        'Failed to upload voice note. Please try again.',
      );
    }
  };

  // Handle attachment button press
  const handleAttachmentPress = () => {
    setShowAttachments(!showAttachments);
  };

  // Handle individual attachment option press
  const handleAttachmentOptionPress = async (option: string) => {
    setShowAttachments(false); // close menu

    if (option === 'Photo & Video') {
      const media = await pickMediaFromGallery(); // your image/video picker
      if (!media) return;

      const isVideo = media.type?.startsWith('video');
      if (!media.uri) return; // early exit if the uri is undefined

      // Generate temporary ID for uploading message
      const tempId = `uploading-${Date.now()}`;

      // Add to uploading messages state
      setUploadingMessages(prev => ({
        ...prev,
        [tempId]: {
          type: isVideo ? 'video' : 'image',
          progress: 0,
          fileName: media.fileName,
          fileSize: media.fileSize,
        },
      }));

      try {
        console.log('Starting media upload...');
        const mediaUrl = await uploadMediaToCloudinary(media.uri, {
          isVideo: !!isVideo,
        });
        console.log('Media upload completed:', mediaUrl);

        // Remove from uploading messages
        setUploadingMessages(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });

        handleSendMessage({
          type: isVideo ? 'video' : 'image',
          mediaUrl,
          fileName: media.fileName,
          fileSize: media.fileSize,
          mimeType: media.type,
        });
      } catch (error) {
        console.error('Media upload failed:', error);
        // Remove from uploading messages on error
        setUploadingMessages(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
        Alert.alert(
          'Upload Failed',
          'Failed to upload media. Please try again.',
        );
      }
    }

    if (option === 'Document') {
      const doc = await pickDocument();
      if (!doc) return;

      // Generate temporary ID
      const tempId = `uploading-doc-${Date.now()}`;

      // Add to uploading messages state
      setUploadingMessages(prev => ({
        ...prev,
        [tempId]: {
          type: 'document',
          progress: 0,
          fileName: doc.fileName ?? undefined,
          fileSize: doc.fileSize ?? undefined,
        },
      }));

      try {
        // You can reuse Cloudinary for documents or Firebase Storage
        const fileUrl = await uploadMediaToCloudinary(doc.uri, {
          isVideo: false,
        });

        // Remove from uploading messages
        setUploadingMessages(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });

        handleSendMessage({
          type: 'document',
          mediaUrl: fileUrl,
          fileName: doc.fileName ?? '', // fallback to empty string
          fileSize: doc.fileSize ?? undefined, // fallback undefined instead of null
          mimeType: doc.type ?? undefined, // fallback undefined
        });
      } catch (error) {
        console.error('Document upload failed:', error);
        // Remove from uploading messages on error
        setUploadingMessages(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
        Alert.alert(
          'Upload Failed',
          'Failed to upload document. Please try again.',
        );
      }
    }

    // Add other attachment options as needed
    if (option === 'Camera') {
      Alert.alert('Coming Soon', 'Camera feature will be added soon!');
    }

    if (option === 'Location') {
      Alert.alert(
        'Coming Soon',
        'Location sharing feature will be added soon!',
      );
    }
  };

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
        const isMe = msg.userId === currentUserId;

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
  }, [chatMessages, roomId, userId]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!roomId || !userId) return;

    const roomMsgs = allMessages[roomId] || [];
    const unreadIds = roomMsgs
      .filter(msg => {
        // Message is unread if it's NOT from me and hasn't been read yet
        return msg.userId !== currentUserId && !msg.readAt && msg._id;
      })
      .map(msg => msg._id)
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
      Alert.alert('Call Rejected', `${friendName} rejected the call.`);
    };

    const onCallUnavailable = () => {
      Alert.alert('Unavailable', `${friendName} is currently unavailable.`);
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
  }, [navigation, friendName]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (roomId && allMessages[roomId]?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [roomId, allMessages]);

  // Get messages for this room
  const roomMessages = allMessages[roomId] || [];

  // ⬇️ Add this right after you define roomMessages
  // useEffect(() => {
  //   const downloadVoiceMessages = async () => {
  //     const roomMsgs = roomMessages; // messages for this chat

  //     for (const msg of roomMsgs) {
  //       if (msg.type === 'voice' && msg.mediaUrl && !msg.localUri) {
  //         const localPath = await downloadVoiceFile(msg.mediaUrl);
  //         if (localPath) {
  //           // Update the message in the store with a local path
  //           useChatStore.getState().replaceLocalMessage(roomId, msg._id, {
  //             ...msg,
  //             localUri: localPath,
  //           });
  //         }
  //       }
  //     }
  //   };

  //   downloadVoiceMessages();
  // }, [roomMessages, roomId]);

  // Create uploading message objects
  const uploadingMessageObjects = Object.entries(uploadingMessages).map(
    ([id, upload]) => ({
      _id: id,
      userId: userId,
      sender: userId,
      receiver: friendId,
      type: upload.type,
      text: '',
      mediaUrl: null,
      fileName: upload.fileName || '',
      fileSize: upload.fileSize || null,
      mimeType:
        upload.type === 'image'
          ? 'image/jpeg'
          : upload.type === 'video'
            ? 'video/mp4'
            : 'audio/mp3',
      duration: upload.type === 'voice' ? (upload.duration ?? null) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'uploading' as const,
      uploading: true,
      uploadProgress: upload.progress,
    }),
  );

  // Prioritize store messages (real-time updates) over API messages (initial load)
  const displayMessages = roomMessages.length > 0 ? roomMessages : chatMessages;

  // Combine regular messages with uploading messages
  const allDisplayMessages = [...displayMessages, ...uploadingMessageObjects];

  // Sort messages by date (newest first for inverted FlatList)
  const sortedMessages = [...allDisplayMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Handles text, media, document, voice, or location
  const handleSendMessage = (payload: {
    type?: 'text' | 'image' | 'video' | 'document' | 'voice';
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    localUri?: string;
    waveform?: number[];
  }) => {
    if (!userId || !friendId || !roomId) return;

    sendMessage({
      type: payload.type || 'text',
      text: payload.text,
      mediaUrl: payload.mediaUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      mimeType: payload.mimeType,
      duration: payload.duration,
      localUri: payload.localUri,
      waveform: payload.waveform,
      userId: currentUserId!,
    });
  };

  const handleSend = () => {
    if (!canSendMessage) return;

    handleSendMessage({ type: 'text', text: trimmedInputText });
    setInputText('');
  };

  // Load more messages when scrolling to the top (since list is inverted)
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages || !chatId) return;

    setLoadingMore(true);
    try {
      const nextOffset = messageOffset + messageLimit;
      const response = await api.get(
        `/chatMessages/${chatId}?limit=${messageLimit}&offset=${nextOffset}`,
      );

      if (response.data && response.data.length > 0) {
        // Add new messages to the store
        const formattedMessages = response.data.map((msg: StoreMessage) => {
          const isMe = msg.userId === currentUserId;
          let status: 'pending' | 'sent' | 'delivered' | undefined;

          if (isMe) {
            if (msg.readAt) {
              status = 'delivered';
            } else if (msg.deliveredAt) {
              status = 'delivered';
            } else {
              status = 'sent';
            }
          }

          return {
            ...msg,
            chatId: roomId,
            status,
          };
        });

        addMessages(roomId, formattedMessages, true); // prepend = true for older messages
        setMessageOffset(nextOffset);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle video play/pause with immediate feedback
  const toggleVideoPlayback = useCallback((messageId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        // Pause all other videos when starting a new one
        newSet.clear();
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const renderItem = ({
    item,
  }: {
    item: StoreMessage & { uploading?: boolean; uploadProgress?: number };
  }) => {
    const isMe = item.userId === currentUserId;

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

      if (msg.readAt) {
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={iconSize}
            color={blue}
          />
        );
      }

      if (msg.deliveredAt || msg.status === 'delivered') {
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={iconSize}
            color={gray}
          />
        );
      }

      if (msg.status === 'sent') {
        return (
          <Ionicons name="checkmark-outline" size={iconSize} color={gray} />
        );
      }

      if (msg.status === 'pending') {
        return <Ionicons name="time-outline" size={iconSize} color={gray} />;
      }

      return null;
    };

    // Handle uploading state
    if (item.uploading) {
      const uploadInfo = uploadingMessages[item._id!];

      if (item.type === 'image' || item.type === 'video') {
        return (
          <View
            className={`my-1 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
          >
            <MediaLoader
              type={item.type}
              progress={item.uploadProgress || uploadInfo?.progress || 0}
            />
            <View
              className={`flex-row items-center mt-0.5 ${
                isMe ? 'justify-end' : 'justify-start'
              }`}
            >
              <Text
                className={`text-xs ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}
              >
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons name="time-outline" size={14} color="#6b7280" />
              )}
            </View>
          </View>
        );
      }

      if (item.type === 'voice') {
        return (
          <View
            className={`my-1 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
          >
            <VoiceNotePlayer
              messageId={item._id || 'uploading-voice'}
              uri=""
              isMe={isMe}
              isDark={isDark}
              isUploading={true}
            />

            <View
              className={`flex-row items-center mt-0.5 ${
                isMe ? 'justify-end' : 'justify-start'
              }`}
            >
              <Text
                className={`text-xs ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}
              >
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons name="time-outline" size={14} color="#6b7280" />
              )}
            </View>
          </View>
        );
      }

      if (item.type === 'document') {
        return (
          <View
            className={`my-1 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
          >
            <View
              className={`px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-800`}
            >
              <View className="flex-row items-center">
                <View className="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 mr-3">
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="#666"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium text-gray-800 dark:text-gray-200"
                    numberOfLines={1}
                  >
                    {item.fileName || 'Document'}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <ActivityIndicator
                      size="small"
                      color="#10B981"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                      Uploading...{' '}
                      {(
                        item.uploadProgress ||
                        uploadInfo?.progress ||
                        0
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>
                  {item.fileSize && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View
              className={`flex-row items-center mt-0.5 ${
                isMe ? 'justify-end' : 'justify-start'
              }`}
            >
              <Text
                className={`text-xs ${isMe ? 'mr-1' : 'ml-1'} text-gray-500`}
              >
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons name="time-outline" size={14} color="#6b7280" />
              )}
            </View>
          </View>
        );
      }
    }

    // Render regular messages
    return (
      <View className={`my-1 max-w-[90%] ${isMe ? 'self-end' : 'self-start'}`}>
        {/* IMAGE */}
        {item.type === 'image' && item.mediaUrl && (
          <View className="rounded-lg overflow-hidden mb-1">
            <LazyImage
              uri={item.mediaUrl}
              style={{ width: MAX_IMAGE_WIDTH, height: 200 }}
              className="rounded-lg"
              resizeMode="cover"
              itemId={item._id || `temp-${Date.now()}`}
            />
          </View>
        )}

        {/* VIDEO */}
        {item.type === 'video' && item.mediaUrl && (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => toggleVideoPlayback(item._id || '')}
            className="rounded-lg overflow-hidden mb-1 bg-black"
          >
            <LazyVideo
              uri={item.mediaUrl}
              style={{ width: MAX_IMAGE_WIDTH, height: 200 }}
              className="rounded-lg"
              paused={!isVideoPlaying(item._id || '')}
              repeat={true}
              resizeMode="cover"
            />
            {!isVideoPlaying(item._id || '') && (
              <View className="absolute inset-0 justify-center items-center bg-black/30">
                <View className="bg-black/60 rounded-full p-4">
                  <Ionicons name="play" size={32} color="white" />
                </View>
              </View>
            )}
            <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
              <Ionicons
                name={isVideoPlaying(item._id || '') ? 'pause' : 'play'}
                size={16}
                color="white"
              />
            </View>
          </TouchableOpacity>
        )}

        {/* VOICE NOTE */}
        {item.type === 'voice' && item.mediaUrl && (
          <VoiceNotePlayer
            roomId={roomId}
            messageId={item._id || item.mediaUrl || 'voice'}
            uri={item.mediaUrl}
            localUri={item.localUri}
            isMe={isMe}
            isDark={isDark}
            duration={item.duration}
            waveform={item.waveform}
            isDownloading={!item.localUri}
          />
        )}

        {/* DOCUMENT */}
        {item.type === 'document' && (
          <TouchableOpacity
            activeOpacity={0.7}
            className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <View className="flex-row items-center">
              <View
                className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-gray-300'} mr-3`}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={isMe ? 'white' : '#666'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium ${isMe ? 'text-white' : 'text-gray-800'}`}
                  numberOfLines={1}
                >
                  {item.fileName || 'Document'}
                </Text>
                {item.fileSize && (
                  <Text
                    className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-600'} mt-0.5`}
                  >
                    {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
              </View>
              <Ionicons
                name="download-outline"
                size={20}
                color={isMe ? 'white' : '#666'}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Text content (if any) */}
        {item.text ? (
          <View
            className={`px-4 py-3 rounded-2xl ${
              isMe
                ? isDark
                  ? 'bg-green-700'
                  : 'bg-green-500'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
            } ${isMe ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
          >
            <Text
              className={`text-base ${
                isMe ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'
              }`}
              style={{ flexShrink: 1 }}
            >
              {item.text}
            </Text>
          </View>
        ) : null}

        {/* Time and status */}
        {(item.type === 'text' ||
          item.type === 'document' ||
          (item.type === 'image' && !item.text) ||
          (item.type === 'video' && !item.text) ||
          item.type === 'voice') && (
          <View
            className={`flex-row items-center mt-0.5 ${
              isMe ? 'justify-end' : 'justify-start'
            }`}
          >
            <Text
              className={`text-xs ${
                isMe ? 'mr-1' : 'ml-1'
              } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {formatTime(item.createdAt)}
            </Text>

            {isMe && getStatusIcon(item) && (
              <View className="ml-1">{getStatusIcon(item)}</View>
            )}
          </View>
        )}
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
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <ChatHeader
          friend={friend}
          isDark={isDark}
          isLoading={isLoading}
          onBack={() => navigation.goBack()}
          onStartCall={handleStartCall}
        />

        {/* Messages */}
        {isLoading && !sortedMessages.length ? (
          <View className="flex-1 justify-center items-center">
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
            className="px-4 py-2"
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color="#16a34a" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <Text
                  className={`text-base ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  No messages yet. Start a conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Voice Note Recording Indicator */}
        {isRecording && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              transform: [
                {
                  translateY: recordSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0], // starts 300px below, slides up to 0
                  }),
                },
              ],
            }}
            pointerEvents={isRecording ? 'auto' : 'none'}
          >
            <View
              className={`rounded-t-3xl pt-2 pb-6 ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } border-t ${isDark ? 'border-green-600' : 'border-gray-200'}`}
            >
              {/* Handle pill */}
              <View className="w-9 h-1 rounded-full bg-gray-400 self-center mb-3" />

              {/* Hint */}
              <View className="flex-row items-center justify-center mb-3">
                <Ionicons
                  name="chevron-back"
                  size={13}
                  color={isDark ? '#4a6a52' : '#9ca3af'}
                />
                <Text
                  className={`text-xs ml-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                >
                  slide left to cancel
                </Text>
              </View>

              {/* Waveform row */}
              <View
                className="flex-row items-center px-4 mb-5"
                style={{ gap: 10 }}
              >
                {/* Blinking dot */}
                <Animated.View
                  style={{
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [1, 0],
                    }),
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#ef4444',
                  }}
                />

                {/* Live waveform */}
                <View style={{ flex: 1, height: 40 }}>
                  <VoiceWaveform
                    bars={liveBars}
                    isAnimating={isRecording}
                    playedColor="#16a34a"
                    unplayedColor={isDark ? '#14532d' : '#bbf7d0'}
                  />
                </View>

                {/* Timer */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isDark ? '#f87171' : '#ef4444',
                    fontVariant: ['tabular-nums'],
                    minWidth: 36,
                  }}
                >
                  {formatVoiceDuration(recordingSeconds)}
                </Text>
              </View>

              {/* Actions */}
              <View className="flex-row items-center justify-between px-6">
                {/* Delete / cancel */}
                <TouchableOpacity
                  onPress={async () => {
                    await stopRecording(); // returns null for short recordings, discards
                  }}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    isDark ? 'border-gray-700' : 'border-gray-300'
                  }`}
                  style={{ gap: 6 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <Text
                    className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>

                {/* Send button with pulse ring */}
                <TouchableOpacity
                  onPress={handleVoiceNotePressOut}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#16a34a',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="send" size={22} color="white" />
                </TouchableOpacity>

                {/* Lock placeholder */}
                <View className="items-center" style={{ gap: 4 }}>
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={isDark ? '#4a7a52' : '#9ca3af'}
                    />
                  </View>
                  <Text className="text-xs text-gray-500">Lock</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Attachment Menu - Shows when attachment button is clicked */}
        {showAttachments && (
          <Animated.View
            style={{
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            }}
            className={`px-4 py-3 border-t ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Attach File
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => handleAttachmentOptionPress('Camera')}
                className="items-center"
              >
                <View className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center">
                  <Ionicons name="camera-outline" size={24} color="#3b82f6" />
                </View>
                <Text className="text-xs text-gray-500 mt-1">Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAttachmentOptionPress('Photo & Video')}
                className="items-center"
              >
                <View className="w-12 h-12 rounded-full bg-purple-100 justify-center items-center">
                  <Ionicons name="image-outline" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-xs text-gray-500 mt-1">Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAttachmentOptionPress('Document')}
                className="items-center"
              >
                <View className="w-12 h-12 rounded-full bg-yellow-100 justify-center items-center">
                  <Ionicons name="document-outline" size={24} color="#f59e0b" />
                </View>
                <Text className="text-xs text-gray-500 mt-1">Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAttachmentOptionPress('Location')}
                className="items-center"
              >
                <View className="w-12 h-12 rounded-full bg-red-100 justify-center items-center">
                  <Ionicons name="location-outline" size={24} color="#ef4444" />
                </View>
                <Text className="text-xs text-gray-500 mt-1">Location</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View
            className={`flex-row items-center p-2 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-300'
            }`}
          >
            {/* Attachment Button */}
            <TouchableOpacity
              onPress={handleAttachmentPress}
              className={`w-10 h-10 rounded-full justify-center items-center ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={showAttachments ? 'close' : 'attach-outline'}
                size={22}
                color={isDark ? '#d1d5db' : '#6b7280'}
              />
            </TouchableOpacity>

            {/* Voice Note Button */}
            <TouchableOpacity
              onPressIn={handleVoiceNotePressIn}
              onPressOut={handleVoiceNotePressOut}
              disabled={recordingCooldownRef.current}
              className={`w-10 h-10 rounded-full justify-center items-center ml-2 ${
                isRecording
                  ? 'bg-red-100'
                  : recordingCooldownRef.current
                    ? 'bg-gray-400'
                    : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={20}
                color={
                  isRecording
                    ? '#dc2626'
                    : recordingCooldownRef.current
                      ? '#9ca3af'
                      : isDark
                        ? '#d1d5db'
                        : '#6b7280'
                }
              />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
              className={`flex-1 mx-2 px-4 py-2 rounded-full ${
                isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
              } text-base`}
              multiline
              maxLength={2000}
              enablesReturnKeyAutomatically
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              className={`w-11 h-11 rounded-full justify-center items-center ${
                canSendMessage
                  ? 'bg-green-600'
                  : isDark
                    ? 'bg-gray-800'
                    : 'bg-gray-100'
              }`}
              disabled={!canSendMessage}
            >
              <Ionicons
                name={canSendMessage ? 'send' : 'send-outline'}
                size={22}
                color={
                  canSendMessage ? 'white' : isDark ? '#6b7280' : '#9ca3af'
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
