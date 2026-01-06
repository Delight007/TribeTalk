import { create } from 'zustand';
import { User } from '../types';

type UserStore = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateFollowing: (userId: string, action: 'follow' | 'unfollow') => void;
};

export const useUserStore = create<UserStore>(set => ({
  currentUser: null,
  setCurrentUser: user => set({ currentUser: user }),
  updateFollowing: (userId, action) =>
    set(state => {
      if (!state.currentUser) return state;
      const updatedFollowing =
        action === 'follow'
          ? [...(state.currentUser.following || []), userId]
          : (state.currentUser.following || []).filter(id => id !== userId);

      return {
        currentUser: {
          ...state.currentUser,
          following: updatedFollowing,
        },
      };
    }),
}));
