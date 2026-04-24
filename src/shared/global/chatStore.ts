// // chatStore.ts

// chatStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { getSocket } from '../contexts/socketIo';

// ------------------ Custom storage per user ------------------
const createUserSpecificStorage = (): StateStorage => ({
  getItem: async (name: string) => {
    try {
      const userId = await AsyncStorage.getItem('chat-current-user-id');
      if (!userId) return null;
      const userStorageKey = `chat-storage-${userId}`;
      return await AsyncStorage.getItem(userStorageKey);
    } catch (err) {
      console.warn('Error getting chat storage:', err);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      const userId = await AsyncStorage.getItem('chat-current-user-id');
      if (!userId) return;
      const userStorageKey = `chat-storage-${userId}`;
      await AsyncStorage.setItem(userStorageKey, value);
    } catch (err) {
      console.warn('Error setting chat storage:', err);
    }
  },
  removeItem: async (name: string) => {
    try {
      const userId = await AsyncStorage.getItem('chat-current-user-id');
      if (userId) {
        const userStorageKey = `chat-storage-${userId}`;
        await AsyncStorage.removeItem(userStorageKey);
      }
      await AsyncStorage.removeItem(name).catch(() => {});
    } catch (err) {
      console.warn('Error removing chat storage:', err);
    }
  },
});

// ------------------ Helpers ------------------
const getLastMessagePreview = (msg: Message) => {
  switch (msg.type) {
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'document':
      return '📄 Document';
    case 'voice':
      return '🎤 Voice message';
    default:
      return msg.text ?? '';
  }
};

// ------------------ Types ------------------
export interface Message {
  _id: string;
  chatId: string;

  type: 'text' | 'image' | 'video' | 'document' | 'voice';
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  createdAt: string;
  localUri?: string; // new: local cache path for voice
  deliveredAt?: string | null;
  readAt?: string | null;
  status?: 'pending' | 'sent' | 'delivered';
  userId: string; // <--- ID of the sender
}

export interface FriendInfo {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
  email?: string;
}

export interface ChatSummary {
  chatId: string;
  friend: FriendInfo;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatState {
  currentUserId?: string;
  currentRoomId?: string;
  messages: Record<string, Message[]>;
  summaries: Record<string, ChatSummary>;
  pendingMessages: Record<string, Message[]>;
  // currentlyPlayingVoiceNote: string | null; // messageId of currently playing voice note

  // Actions
  setCurrentUser: (id: string | undefined) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (
    msg: Omit<Message, '_id' | 'chatId' | 'createdAt' | 'status'>,
  ) => void;
  addMessage: (msg: Message, friend?: FriendInfo) => void;
  addMessages: (roomId: string, msgs: Message[], prepend?: boolean) => void;
  replaceLocalMessage: (
    roomId: string,
    tempId: string,
    serverMsg: Message,
  ) => void;
  markMessageDelivered: (
    roomId: string,
    messageId?: string,
    tempId?: string,
    deliveredAt?: string | null,
  ) => void;
  markMessagesRead: (
    roomId: string,
    messageIds: string[],
    readAt?: string | null,
  ) => void;
  retryPendingMessages: () => void;
  loadOlderMessages: (roomId: string, olderMsgs: Message[]) => void;
  updateSummary: (chatId: string, summary: Omit<ChatSummary, 'chatId'>) => void;
  markChatRead: (chatId: string) => void;
  clearSummaries: () => void;
  clearAllChatData: () => void;
}

// ------------------ Store ------------------
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUserId: undefined,
      currentRoomId: undefined,
      messages: {},
      summaries: {},
      pendingMessages: {},
      // currentlyPlayingVoiceNote: null,

      // ------------------ Set current user ------------------
      setCurrentUser: async id => {
        if (!id) {
          set({
            currentUserId: undefined,
            currentRoomId: undefined,
            messages: {},
            summaries: {},
            pendingMessages: {},
          });
          await AsyncStorage.removeItem('chat-current-user-id');
          return;
        }

        await AsyncStorage.setItem('chat-current-user-id', id);
        set({ currentUserId: id });

        const socket = getSocket();
        if (!socket) return;

        socket.emit('register', id);
        socket.emit('userReconnected', id);

        socket.off('receiveMessage');
        socket.off('messageDelivered');
        socket.off('messagesRead');
        socket.off('connect');

        // Retry pending messages when socket reconnects
        socket.on('connect', () => {
          console.log('🔄 Socket reconnected, retrying pending messages');
          get().retryPendingMessages();
        });

        socket.on('receiveMessage', (payload: any) => {
          try {
            const roomId = payload.roomId || payload.chatId || payload.chat;
            if (!roomId) return;

            const msg: Message = {
              _id: String(payload._id),
              chatId: roomId,
              type: payload.type ?? 'text',
              text: payload.text,
              mediaUrl: payload.mediaUrl,
              fileName: payload.fileName,
              fileSize: payload.fileSize,
              mimeType: payload.mimeType,
              duration: payload.duration,
              createdAt: payload.createdAt,
              deliveredAt: payload.deliveredAt ?? null,
              readAt: payload.readAt ?? null,
              status: payload.delivered ? 'delivered' : 'sent',
              userId: payload.userId, // <-- Add this line
            };

            get().addMessage(msg, payload.friend);

            const friend: FriendInfo = payload.friend;
            const old = get().summaries[roomId];
            const unread = old && old.unreadCount ? old.unreadCount + 1 : 1;

            get().updateSummary(roomId, {
              friend,
              lastMessage: getLastMessagePreview(msg),
              lastMessageAt: msg.createdAt,
              unreadCount: unread,
            });
          } catch (err) {
            console.warn('receiveMessage handler error:', err);
          }
        });

        socket.on('messageDelivered', (info: any) => {
          const roomId = info.chat || get().currentRoomId;
          if (!roomId) return;
          get().markMessageDelivered(
            roomId,
            info.messageId,
            info.tempId,
            info.deliveredAt,
          );
        });

        socket.on('messagesRead', (info: any) => {
          if (!info.chatId || !info.messageIds) return;
          get().markMessagesRead(info.chatId, info.messageIds, info.readAt);
          get().markChatRead(info.chatId);
        });
      },

      // ------------------ Join / Leave rooms ------------------
      joinRoom: roomId => {
        const socket = getSocket();
        if (!socket) return;

        const prev = get().currentRoomId;
        if (prev && prev !== roomId) socket.emit('leaveRoom', prev);

        socket.emit('joinRoom', roomId);
        set({ currentRoomId: roomId });
        set(state => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId] || [],
          },
        }));
      },

      leaveRoom: () => {
        const socket = getSocket();
        if (!socket) return;
        const roomId = get().currentRoomId;
        if (!roomId) return;

        socket.emit('leaveRoom', roomId);
        set({ currentRoomId: undefined });
      },

      // ------------------ Send message ------------------
      sendMessage: msg => {
        const socket = getSocket();
        const roomId = get().currentRoomId;
        const currentUserId = get().currentUserId;

        if (!roomId) return;

        // Create a temporary local message for optimistic UI
        const tempId = `local-${Date.now()}`;
        const placeholder: Message = {
          _id: tempId,
          chatId: roomId,
          type: msg.type,
          text: msg.text,
          mediaUrl: msg.mediaUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          mimeType: msg.mimeType,
          duration: msg.duration,
          createdAt: new Date().toISOString(),
          status: socket?.connected ? 'sent' : 'pending',
          userId: currentUserId!, // <-- Add this
        };

        // Add the placeholder locally
        get().addMessage(placeholder);

        if (!socket?.connected) {
          // Store pending message if offline
          set(state => ({
            pendingMessages: {
              ...state.pendingMessages,
              [roomId]: [...(state.pendingMessages[roomId] || []), placeholder],
            },
          }));
          return;
        }

        // Send to server
        socket.emit(
          'sendMessage',
          { roomId, message: placeholder, tempId },
          (serverMsg: any) => {
            // Server replaces local message
            const resolved: Message = {
              ...serverMsg,
              chatId: roomId,
              status: 'sent',
            };
            get().replaceLocalMessage(roomId, tempId, resolved);

            // Update chat summary
            const friend: FriendInfo = serverMsg.friend!;
            get().updateSummary(roomId, {
              friend,
              lastMessage: getLastMessagePreview(resolved),
              lastMessageAt: resolved.createdAt,
              unreadCount: 0,
            });
          },
        );
      },

      // ------------------ Message management ------------------
      addMessage: (msg, friend) => {
        const roomId = msg.chatId;
        set(state => {
          const existing = state.messages[roomId] || [];
          if (existing.some(m => m._id === msg._id)) return state;
          return {
            messages: { ...state.messages, [roomId]: [...existing, msg] },
          };
        });
      },

      addMessages: (roomId, msgs, prepend = false) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const ids = new Set(existing.map(m => m._id));
          const newOnes = msgs.filter(m => m._id && !ids.has(m._id));
          if (!newOnes.length) return state;
          return {
            messages: {
              ...state.messages,
              [roomId]: prepend
                ? [...newOnes, ...existing]
                : [...existing, ...newOnes],
            },
          };
        });
      },

      replaceLocalMessage: (roomId, tempId, serverMsg) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const idx = existing.findIndex(m => m._id === tempId);
          if (idx === -1)
            return {
              messages: {
                ...state.messages,
                [roomId]: [...existing, serverMsg],
              },
            };
          const updated = [...existing];
          updated[idx] = serverMsg;
          return { messages: { ...state.messages, [roomId]: updated } };
        });
      },

      markMessageDelivered: (roomId, messageId, tempId, deliveredAt) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const idx = existing.findIndex(
            m =>
              (messageId && m._id === messageId) ||
              (!messageId && tempId && m._id === tempId),
          );
          if (idx === -1) return state;
          const updated = [...existing];
          updated[idx] = {
            ...existing[idx],
            deliveredAt: deliveredAt ?? new Date().toISOString(),
            status: 'delivered' as const,
          };
          return { messages: { ...state.messages, [roomId]: updated } };
        });
      },

      markMessagesRead: (roomId, ids, readAt) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const idSet = new Set(ids);
          const updated = existing.map(m =>
            idSet.has(m._id)
              ? { ...m, readAt: readAt ?? new Date().toISOString() }
              : m,
          );
          return { messages: { ...state.messages, [roomId]: updated } };
        });
      },

      loadOlderMessages: (roomId, olderMsgs) =>
        get().addMessages(roomId, olderMsgs, true),

      retryPendingMessages: () => {
        const roomId = get().currentRoomId;
        if (!roomId) return;
        const pending = get().pendingMessages[roomId] || [];
        if (!pending.length) return;
        const socket = getSocket();
        if (!socket?.connected) return;

        pending.forEach(msg =>
          socket.emit('sendMessage', { roomId, message: msg, tempId: msg._id }),
        );
        set(state => ({
          pendingMessages: { ...state.pendingMessages, [roomId]: [] },
        }));
      },

      // ------------------ Chat summaries ------------------
      updateSummary: (chatId, summaryData) => {
        set(state => {
          const existing = state.summaries[chatId];
          return {
            summaries: {
              ...state.summaries,
              [chatId]: {
                chatId,
                friend: summaryData.friend ?? existing?.friend!,
                lastMessage:
                  summaryData.lastMessage ?? existing?.lastMessage ?? '',
                lastMessageAt:
                  summaryData.lastMessageAt ??
                  existing?.lastMessageAt ??
                  new Date().toISOString(),
                unreadCount:
                  summaryData.unreadCount ?? existing?.unreadCount ?? 0,
              },
            },
          };
        });
      },

      markChatRead: chatId => {
        set(state => {
          const existing = state.summaries[chatId];
          if (!existing) return {};
          return {
            summaries: {
              ...state.summaries,
              [chatId]: { ...existing, unreadCount: 0 },
            },
          };
        });
      },

      clearSummaries: () => set({ summaries: {} }),
      clearAllChatData: () => {
        set({
          summaries: {},
          messages: {},
          pendingMessages: {},
          currentRoomId: undefined,
        });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(createUserSpecificStorage),
      partialize: state => ({
        currentUserId: state.currentUserId,
        currentRoomId: state.currentRoomId,
        messages: state.messages,
        pendingMessages: state.pendingMessages,
      }),
      onRehydrateStorage: () => async (state, error) => {
        if (error) console.warn('Error rehydrating chat store:', error);
        const expectedUserId = await AsyncStorage.getItem(
          'chat-current-user-id',
        ).catch(() => null);
        if (
          state?.currentUserId &&
          expectedUserId &&
          state.currentUserId !== expectedUserId
        ) {
          useChatStore.setState({
            summaries: {},
            messages: {},
            pendingMessages: {},
            currentRoomId: undefined,
            currentUserId: expectedUserId,
          });
        }
        useChatStore.setState({ summaries: {} });
      },
    },
  ),
);
