import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useUserChats } from '../api/auth';
import { ChatSummary, useChatStore } from '../shared/global/chatStore';

// Helper function to get last message preview (imported from chatStore)
const getLastMessagePreview = (msg: { type?: string; text?: string }) => {
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

export default function ChatListLoader() {
  const currentUserId = useChatStore(state => state.currentUserId);
  const {
    data: chats,
    isLoading,
    error,
    refetch,
  } = useUserChats(currentUserId);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    // If user changed (including from undefined to a value, or from one value to another)
    const userIdChanged =
      currentUserId !== lastUserIdRef.current &&
      (currentUserId !== undefined || lastUserIdRef.current !== undefined);

    if (userIdChanged) {
      console.log(
        `User changed in ChatListLoader: ${lastUserIdRef.current} -> ${currentUserId}, clearing summaries and invalidating query`,
      );

      // Always clear summaries when userId changes
      useChatStore.getState().clearSummaries();

      // Remove all userChats queries to force fresh fetch
      queryClient.removeQueries({ queryKey: ['userChats'] });

      // If we have a new userId, refetch
      if (currentUserId) {
        console.log(`Refetching chats for new user: ${currentUserId}`);
        // Small delay to ensure query is removed first
        setTimeout(() => {
          refetch();
        }, 100);
      }
    }

    lastUserIdRef.current = currentUserId;
  }, [currentUserId, queryClient, refetch]);

  useEffect(() => {
    // Only process chats if they belong to the current user
    if (!currentUserId) {
      console.log('No currentUserId, skipping chat processing');
      return;
    }

    if (chats && chats.length > 0) {
      console.log(`Loading ${chats.length} chats for user ${currentUserId}`);
      // Clear existing summaries before loading new ones to ensure we only show current user's chats
      useChatStore.getState().clearSummaries();

      // Store to your chatStore summaries
      chats.forEach((chat: ChatSummary) => {
        // Use message type to determine display text
        const messageType = (chat as any).latestMessageType;
        const messageText = (chat as any).latestMessage ?? (chat as any).lastMessage;

        const lastMessage = messageType
          ? getLastMessagePreview({ type: messageType, text: messageText })
          : messageText ?? 'Say hi!';

        const lastMessageAt =
          (chat as any).lastMessageAt ??
          (chat as any).latestMessageCreatedAt ??
          new Date().toISOString();

        useChatStore.getState().updateSummary(chat.chatId, {
          friend: (chat as any).friend ??
            (chat as any).participants ??
            (chat as any).users ?? { _id: '', name: '' },
          lastMessage,
          lastMessageAt,
          unreadCount: chat.unreadCount ?? 0,
        });
      });
      console.log(`Loaded ${chats.length} chats into store`);
    } else if (chats && chats.length === 0) {
      // Clear summaries if user has no chats
      console.log('User has no chats, clearing summaries');
      useChatStore.getState().clearSummaries();
    }
  }, [chats, currentUserId]);

  return null;
}
