import React from 'react';
import { Button, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useAuthStore } from '../../../shared/global/authStore';

const SettingsScreen = () => {
  const logout = useAuthStore(state => state.logout);
  const { theme } = useTheme();

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
        <Button title="Logout" onPress={logout} />
      </View>
    </LinearGradient>
  );
};

export default SettingsScreen;
