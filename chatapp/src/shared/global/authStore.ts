import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type AuthState = {
  userToken: string | null;
  setUserToken: (token: string | null) => void;
  loadToken: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  userToken: null,

  // ✅ Set token manually (e.g., after login)
  setUserToken: token => set({ userToken: token }),

  // ✅ Load token from storage on app start
  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      set({ userToken: token });
    } catch (error) {
      console.log('Error loading token:', error);
    }
  },

  // ✅ Logout clears token and updates state
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('chat-current-user-id'); // Clear chat user ID
      set({ userToken: null }); // triggers rerender of AppNavigator
    } catch (error) {
      console.log('Error logging out:', error);
    }
  },
}));
