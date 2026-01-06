// SettingsScreen.tsx — logout button + cache clearing
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Button, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useAuthStore } from '../../../shared/global/authStore';
import { useChatStore } from '../../../shared/global/chatStore';
import { useUserStore } from '../../../shared/global/userStore';

const SettingsScreen = ({ navigation }: any) => {
  const logout = useAuthStore(state => state.logout);
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    // 1. Clear chat store
    useChatStore.getState().clearAllChatData();
    useChatStore.getState().setCurrentUser(undefined); // Clear currentUserId

    // 2. Clear / remove all react-query cache
    queryClient.removeQueries(); // remove all queries

    // 3️⃣ Clear user store ❗❗❗
    useUserStore.getState().setCurrentUser(null);

    // 4. Clear auth state
    logout();

    // 4. Navigate to login (or wherever appropriate)
  };

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <View className="flex-1 justify-center items-center">
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </LinearGradient>
  );
};

export default SettingsScreen;
