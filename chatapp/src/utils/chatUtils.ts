// src/utils/chatUtils.ts

export type Friend = {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  email?: string;
  chatId?: string;
};

export type ChatRecord = {
  _id: string; // chat ID
  participants: string[]; // user IDs in the chat
  // other fields (lastMessage etc) if you like
};

/**
 * Merge friends list with chat records to attach chatId to each friend (if one exists).
 */
export function mergeFriendsWithChats(
  friends: Friend[],
  chats: ChatRecord[]
): (Friend & { chatId?: string })[] {
  const userToChat: Record<string, string> = {};

  chats.forEach((chat) => {
    for (const userId of chat.participants) {
      userToChat[userId] = chat._id;
    }
  });

  return friends.map((friend) => {
    return {
      ...friend,
      chatId: userToChat[friend._id],
    };
  });
}
