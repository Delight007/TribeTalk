// chatStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { getSocket } from '../contexts/socketIo';

// Custom storage that uses user-specific keys
const createUserSpecificStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // First, try to get the current userId from a separate key
        let userId = await AsyncStorage.getItem('chat-current-user-id');

        // If not found, try to get it from the token (decode JWT or get from user store)
        // For now, we'll rely on setCurrentUser being called after login
        // If userId is not set yet, return null (no data to load)
        if (!userId) {
          return null;
        }

        // Use user-specific storage key
        const userStorageKey = `chat-storage-${userId}`;
        const value = await AsyncStorage.getItem(userStorageKey);
        return value;
      } catch (error) {
        console.warn('Error getting chat storage:', error);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        // Get the current userId from AsyncStorage
        let userId = await AsyncStorage.getItem('chat-current-user-id');

        // If not found in AsyncStorage, try to get it from the store state
        // This handles the race condition where setCurrentUser hasn't finished writing to AsyncStorage yet
        if (!userId) {
          const storeState = useChatStore.getState();
          userId = storeState.currentUserId || null;
        }

        if (!userId) {
          // Silently skip saving if no userId - this is expected during logout or before login
          return;
        }

        // Use user-specific storage key
        const userStorageKey = `chat-storage-${userId}`;
        await AsyncStorage.setItem(userStorageKey, value);
      } catch (error) {
        console.warn('Error setting chat storage:', error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        // Get the current userId
        const userId = await AsyncStorage.getItem('chat-current-user-id');
        if (userId) {
          // Remove user-specific storage
          const userStorageKey = `chat-storage-${userId}`;
          await AsyncStorage.removeItem(userStorageKey);
        }
        // Also try to remove the generic key (for backward compatibility)
        await AsyncStorage.removeItem(name).catch(() => {});
      } catch (error) {
        console.warn('Error removing chat storage:', error);
      }
    },
  };
};

// --- Types ---

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  status?: 'pending' | 'sent' | 'delivered';
}

export interface FriendInfo {
  _id: string;
  name: string;
  avatar?: string;
  // add other fields you need (username, email, etc.)
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

  // full messages per room
  messages: Record<string, Message[]>;

  // chat‑list summaries / metadata
  summaries: Record<string, ChatSummary>;

  // pending messages (when offline / not sent yet)
  pendingMessages: Record<string, Message[]>;

  // --- actions ---
  setCurrentUser: (id: string | undefined) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;

  // sendMessage: (msg: Omit<Message, 'createdAt' | 'status'>) => void;
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

  // --- summary actions ---
  updateSummary: (chatId: string, summary: Omit<ChatSummary, 'chatId'>) => void;
  markChatRead: (chatId: string) => void;
  clearSummaries: () => void;
  clearAllChatData: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUserId: undefined,
      currentRoomId: undefined,
      messages: {},
      summaries: {},
      pendingMessages: {},

      // 1. register user & setup socket listeners
      setCurrentUser: async (id: string | undefined) => {
        const currentUserId = get().currentUserId;

        // If id is undefined, clear everything (logout)
        if (!id) {
          console.log('Clearing currentUserId (logout)');
          set({
            summaries: {},
            messages: {},
            pendingMessages: {},
            currentRoomId: undefined,
            currentUserId: undefined,
          });
          await AsyncStorage.removeItem('chat-current-user-id').catch(() => {});
          return;
        }

        // Update the stored userId FIRST before clearing state
        // This ensures the storage adapter uses the correct key
        // Await this to ensure it's set before we trigger state updates that might persist
        await AsyncStorage.setItem('chat-current-user-id', id).catch(err =>
          console.warn('Error setting chat user id:', err),
        );

        // If user is changing, clear in-memory state
        if (currentUserId && currentUserId !== id) {
          console.log(
            `User changing from ${currentUserId} to ${id}, clearing chat data`,
          );
          // Clear in-memory state immediately
          set({
            summaries: {},
            messages: {},
            pendingMessages: {},
            currentRoomId: undefined,
            currentUserId: id, // Set new userId
          });
        } else {
          // Same user or first time - just update userId
          set({ currentUserId: id });
        }

        const socket = getSocket();
        if (!socket) return;

        socket.emit('register', id);
        socket.emit('userReconnected', id);

        socket.off('receiveMessage');
        socket.off('messageDelivered');
        socket.off('messagesRead');

        socket.on('receiveMessage', payload => {
          try {
            const roomId = payload.roomId || payload.chatId || payload.chat;
            if (!roomId) {
              console.warn('receiveMessage: missing chatId/roomId', payload);
              return;
            }

            const msg: Message = {
              _id: String(payload._id),
              chatId: roomId,
              sender: payload.sender,
              receiver: payload.receiver,
              text: payload.text,
              createdAt: payload.createdAt,
              deliveredAt: payload.deliveredAt ?? null,
              readAt: payload.readAt ?? null,
              status: payload.delivered ? 'delivered' : 'sent',
            };

            // Add message to history
            get().addMessage(msg, payload.friend);

            // Update summary for chat‑list
            const friend = payload.friend as FriendInfo;
            const old = get().summaries[roomId];
            const newUnread = old && old.unreadCount ? old.unreadCount + 1 : 1;

            get().updateSummary(roomId, {
              friend,
              lastMessage: msg.text,
              lastMessageAt: msg.createdAt,
              unreadCount: newUnread,
            });
          } catch (err) {
            console.warn('⚠️ receiveMessage handler error:', err);
          }
        });

        socket.on('messageDelivered', info => {
          try {
            const roomId = info.chat || get().currentRoomId;
            if (!roomId) return;
            get().markMessageDelivered(
              roomId,
              info.messageId,
              info.tempId,
              info.deliveredAt,
            );
          } catch (err) {
            console.warn('⚠️ messageDelivered handler error:', err);
          }
        });

        socket.on('messagesRead', info => {
          try {
            const { chatId, messageIds } = info;
            if (!chatId || !messageIds) return;
            get().markMessagesRead(chatId, messageIds, info.readAt);

            // Optionally, mark chat summary unreadCount = 0
            get().markChatRead(chatId);
          } catch (err) {
            console.warn('⚠️ messagesRead handler error:', err);
          }
        });
      },

      // 2. room management
      joinRoom: roomId => {
        const socket = getSocket();
        if (!socket) return;

        const prev = get().currentRoomId;
        const doJoin = () => {
          if (prev && prev !== roomId) {
            socket.emit('leaveRoom', prev);
          }
          socket.emit('joinRoom', roomId);
          set({ currentRoomId: roomId });
          set(state => ({
            messages: {
              ...state.messages,
              [roomId]: state.messages[roomId] || [],
            },
          }));
        };

        if (socket.connected) doJoin();
        else socket.once('connect', doJoin);
      },

      leaveRoom: () => {
        const socket = getSocket();
        if (!socket) return;
        const roomId = get().currentRoomId;
        if (!roomId) return;

        const doLeave = () => {
          socket.emit('leaveRoom', roomId);
          set({ currentRoomId: undefined });
        };

        if (socket.connected) doLeave();
        else socket.once('connect', doLeave);
      },

      // 3. sending messages
      sendMessage: msg => {
        const socket = getSocket();
        const roomId = get().currentRoomId;
        if (!roomId) return;

        const tempId = `local-${Date.now()}`;
        const placeholder: Message = {
          _id: tempId,
          chatId: roomId,
          sender: msg.sender,
          receiver: msg.receiver,
          text: msg.text,
          createdAt: new Date().toISOString(),
          status: socket?.connected ? 'sent' : 'pending',
        };

        get().addMessage(placeholder);

        if (socket?.connected) {
          socket.emit(
            'sendMessage',
            { roomId, message: placeholder, tempId },
            (serverMsg: any) => {
              const resolved: Message = {
                ...serverMsg,
                chatId: roomId,
                status: 'sent',
              };
              get().replaceLocalMessage(roomId, tempId, resolved);

              // Also update summary, because this user sent a message
              const friend: FriendInfo = serverMsg.friend!; // ensure backend returns friend info too
              get().updateSummary(roomId, {
                friend,
                lastMessage: resolved.text,
                lastMessageAt: resolved.createdAt,
                unreadCount: 0, // since it's sent by current user
              });
            },
          );
        } else {
          set(state => ({
            pendingMessages: {
              ...state.pendingMessages,
              [roomId]: [...(state.pendingMessages[roomId] || []), placeholder],
            },
          }));
        }
      },

      // 4. message / messages management
      addMessage: (msg, friend) => {
        const roomId = msg.chatId;
        set(state => {
          const existing = state.messages[roomId] || [];
          if (existing.some(m => m._id === msg._id)) {
            return state;
          }
          return {
            messages: {
              ...state.messages,
              [roomId]: [...existing, msg],
            },
          };
        });
      },

      addMessages: (roomId, msgs, prepend = false) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const ids = new Set(existing.map(m => m._id));
          const newOnes = msgs.filter(m => m._id && !ids.has(m._id));
          if (newOnes.length === 0) return state;
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
          if (idx === -1) {
            if (existing.some(m => m._id === serverMsg._id)) return state;
            return {
              messages: {
                ...state.messages,
                [roomId]: [...existing, serverMsg],
              },
            };
          }
          const updated = [...existing];
          updated[idx] = serverMsg;
          return {
            messages: {
              ...state.messages,
              [roomId]: updated,
            },
          };
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
          const msg = { ...existing[idx] };
          msg.deliveredAt = deliveredAt ?? new Date().toISOString();
          msg.status = 'delivered';
          const updated = [...existing];
          updated[idx] = msg;
          return {
            messages: {
              ...state.messages,
              [roomId]: updated,
            },
          };
        });
      },

      markMessagesRead: (roomId, ids, readAt) => {
        set(state => {
          const existing = state.messages[roomId] || [];
          const idSet = new Set(ids);
          const updated = existing.map(m =>
            m._id && idSet.has(m._id)
              ? { ...m, readAt: readAt ?? new Date().toISOString() }
              : m,
          );
          return {
            messages: {
              ...state.messages,
              [roomId]: updated,
            },
          };
        });
      },

      loadOlderMessages: (roomId, olderMsgs) => {
        get().addMessages(roomId, olderMsgs, true);
      },

      retryPendingMessages: () => {
        const roomId = get().currentRoomId;
        if (!roomId) return;
        const pending = get().pendingMessages[roomId] || [];
        if (pending.length === 0) return;
        const socket = getSocket();
        if (!socket?.connected) return;

        pending.forEach(msg => {
          socket.emit('sendMessage', {
            roomId,
            message: msg,
            tempId: msg._id,
          });
        });

        set(state => ({
          pendingMessages: {
            ...state.pendingMessages,
            [roomId]: [],
          },
        }));
      },

      // 5. summary actions
      updateSummary: (chatId, summaryData) => {
        set(state => {
          const existing = state.summaries[chatId];
          return {
            summaries: {
              ...state.summaries,
              [chatId]: {
                chatId,
                friend: summaryData.friend ?? existing?.friend,
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

      markChatRead: (chatId: string) => {
        set(state => {
          const existing = state.summaries[chatId];
          if (!existing) return {};
          return {
            summaries: {
              ...state.summaries,
              [chatId]: {
                ...existing,
                unreadCount: 0,
              },
            },
          };
        });
      },

      clearSummaries: () => {
        set({ summaries: {} });
      },

      clearAllChatData: () => {
        // Clear in-memory state only
        // Storage is user-specific, so we don't need to clear it
        // When user changes, the new user's storage will be loaded automatically
        set({
          summaries: {},
          messages: {},
          pendingMessages: {},
          currentRoomId: undefined,
        });
      },
    }),
    {
      name: 'chat-storage', // This is just a name, actual key is user-specific
      storage: createJSONStorage(createUserSpecificStorage),
      // Only persist certain fields - DO NOT persist summaries
      // Summaries should always be loaded fresh from the API for each user
      partialize: state => ({
        currentUserId: state.currentUserId,
        currentRoomId: state.currentRoomId,
        // Persist messages and pendingMessages for offline support
        messages: state.messages,
        pendingMessages: state.pendingMessages,
        // DO NOT persist summaries - they will be loaded from API
      }),
      // Validate on rehydration
      onRehydrateStorage: () => async (state, error) => {
        if (error) {
          console.warn('Error rehydrating chat store:', error);
          return;
        }

        // Get the expected userId from AsyncStorage
        const expectedUserId = await AsyncStorage.getItem(
          'chat-current-user-id',
        ).catch(() => null);

        // If rehydrated state has a userId
        if (state?.currentUserId) {
          // Check if the rehydrated userId matches the expected userId
          if (expectedUserId && state.currentUserId !== expectedUserId) {
            // User mismatch - clear the rehydrated data and set correct userId
            console.log(
              `User mismatch detected: rehydrated=${state.currentUserId}, expected=${expectedUserId}, clearing data`,
            );
            // Clear all data and set the correct userId without triggering socket setup
            useChatStore.setState({
              summaries: {}, // Always clear summaries on user mismatch
              messages: {},
              pendingMessages: {},
              currentRoomId: undefined,
              currentUserId: expectedUserId,
            });
            return;
          }

          // User matches - ensure it's stored for storage key lookup
          await AsyncStorage.setItem(
            'chat-current-user-id',
            state.currentUserId,
          ).catch(() => {});
        } else {
          // If no userId in state, try to get it from storage
          if (expectedUserId) {
            // Set the userId in state if it exists in storage but not in state
            // Use setState to avoid triggering socket setup during rehydration
            useChatStore.setState({
              currentUserId: expectedUserId,
              summaries: {}, // Ensure summaries are empty on initial load
            });
          }
        }

        // Always ensure summaries are empty after rehydration
        // They will be loaded fresh from the API
        if (state?.summaries && Object.keys(state.summaries).length > 0) {
          console.log(
            'Clearing persisted summaries after rehydration - will load fresh from API',
          );
          useChatStore.setState({ summaries: {} });
        }
      },
    },
  ),
);
