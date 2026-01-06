import { create } from 'zustand';

type Message = {
  _id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt?: string;
  status?: string;
};

interface MessageStore {
  unreadMessages: Message[];
  currentChatId: string | null;
  addUnreadMessage: (msg: Message) => void;
  clearUnreadForChat: (roomId: string) => void;
  setCurrentChat: (roomId: string | null) => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  unreadMessages: [],
  currentChatId: null,

  addUnreadMessage: msg =>
    set(state => ({
      unreadMessages: [...state.unreadMessages, msg],
    })),

  clearUnreadForChat: roomId =>
    set(state => ({
      unreadMessages: state.unreadMessages.filter(m => {
        const r = [m.senderId, m.receiverId].sort().join('_');
        return r !== roomId;
      }),
    })),

  setCurrentChat: roomId => set({ currentChatId: roomId }),
}));
