// // SettingsScreen.tsx — logout button + cache clearing
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useQueryClient } from '@tanstack/react-query';
// import React from 'react';
// import { Button, View } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { useTheme } from '../../../shared/contexts/themeContext';
// import { useAuthStore } from '../../../shared/global/authStore';
// import { useChatStore } from '../../../shared/global/chatStore';
// import { useUserStore } from '../../../shared/global/userStore';

// const SettingsScreen = ({ navigation }: any) => {
//   const logout = useAuthStore(state => state.logout);
//   const { theme } = useTheme();
//   const queryClient = useQueryClient();
// const handleLogout = async () => {
//   // 1. Clear chat store
//   useChatStore.getState().clearAllChatData();
//   useChatStore.getState().setCurrentUser(undefined); // Clear currentUserId

//   // 2. Clear / remove all react-query cache
//   queryClient.removeQueries();

//   // 3. Clear user store
//   useUserStore.getState().setCurrentUser(null);

//   // 4. Clear auth state
//   logout();

//   // 5️⃣ Clear AsyncStorage
//   await AsyncStorage.removeItem('token');
//   await AsyncStorage.removeItem('currentUserId');

//   // 6. Navigate to login
//   navigation.reset({
//     index: 0,
//     routes: [{ name: 'Login' }],
//   });
// };

//   return (
//     <LinearGradient
//       colors={
//         theme === 'dark'
//           ? ['#0f3d2e', '#09261e', '#000000']
//           : ['#b8e1af', '#d3f9d8', '#ffffff']
//       }
//       locations={[0, 0.2, 1]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       className="flex-1"
//     >
//       <View className="flex-1 justify-center items-center">
//         <Button title="Logout" onPress={handleLogout} />
//       </View>
//     </LinearGradient>
//   );
// };

// export default SettingsScreen;

import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useAuthStore } from '../../../shared/global/authStore';
import { useChatStore } from '../../../shared/global/chatStore';
import { useUserStore } from '../../../shared/global/userStore';

const SettingsScreen = ({ navigation }: any) => {
  const logout = useAuthStore(state => state.logout);
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const isDark = theme === 'dark';

  const handleLogout = async () => {
    useChatStore.getState().clearAllChatData();
    useChatStore.getState().setCurrentUser(undefined);

    queryClient.removeQueries();

    useUserStore.getState().setCurrentUser(null);

    logout();

    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('currentUserId');

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to use TribeTalk.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: handleLogout },
      ],
    );
  };

  const colors = {
    title: isDark ? '#FFFFFF' : '#17211D',
    text: isDark ? '#F8FAFC' : '#17211D',
    muted: isDark ? '#A7B6B0' : '#607067',
    card: isDark ? 'rgba(12, 52, 42, 0.82)' : 'rgba(255,255,255,0.86)',
    border: isDark ? '#255244' : '#C7D8CF',
    icon: isDark ? '#E4F1EB' : '#1E5B43',
    emerald: '#34D399',
    red: '#FB5B5B',
    logoutBg: isDark ? 'rgba(72, 27, 29, 0.4)' : '#FFF1F1',
  };

  const SettingRow = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 9,
      }}
    >
      <Ionicons
        name={icon as React.ComponentProps<typeof Ionicons>['name']}
        size={22}
        color={colors.icon}
      />

      <Text
        style={{
          flex: 1,
          marginLeft: 14,
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>

      <Ionicons name="chevron-forward" size={19} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0C3E31', '#08271F', '#020B08']
          : ['#E6F4EA', '#C8E6C9', '#A5D6A7']
      }
      locations={[0, 0.42, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            height: 58,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.title} />
          </TouchableOpacity>

          <Text
            style={{
              marginLeft: 8,
              color: colors.title,
              fontSize: 26,
              fontWeight: '800',
              letterSpacing: -0.7,
            }}
          >
            Settings
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 30,
          }}
        >
          {/* Account summary */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Profile')}
            style={{
              height: 82,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              borderRadius: 17,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#1E5B43',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: '100%', height: '100%', borderRadius: 26 }}
                />
              ) : (
                <Ionicons name="person-outline" size={27} color="#FFFFFF" />
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Your account
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {user?.username
                  ? `@${user.username}`
                  : (user?.email ?? 'Profile and account details')}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <SettingRow icon="person-outline" label="Account" />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy & safety"
          />
          <SettingRow icon="notifications-outline" label="Notifications" />

          {/* Appearance card */}
          <View
            style={{
              padding: 14,
              borderRadius: 17,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={colors.icon}
              />

              <Text
                style={{
                  marginLeft: 14,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                Appearance
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 12,
                gap: 8,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => isDark && toggleTheme()}
                style={{
                  flex: 1,
                  height: 66,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: !isDark ? colors.emerald : colors.border,
                  backgroundColor: !isDark
                    ? 'rgba(52, 211, 153, 0.1)'
                    : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="sunny-outline"
                  size={22}
                  color={!isDark ? colors.emerald : colors.muted}
                />
                <Text
                  style={{
                    color: !isDark ? colors.emerald : colors.muted,
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => !isDark && toggleTheme()}
                style={{
                  flex: 1,
                  height: 66,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: isDark ? colors.emerald : colors.border,
                  backgroundColor: isDark
                    ? 'rgba(52, 211, 153, 0.1)'
                    : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="moon-outline"
                  size={22}
                  color={isDark ? colors.emerald : colors.muted}
                />
                <Text
                  style={{
                    color: isDark ? colors.emerald : colors.muted,
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <SettingRow icon="server-outline" label="Storage & data" />
          <SettingRow icon="help-circle-outline" label="Help & support" />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={confirmLogout}
            style={{
              height: 58,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(251, 91, 91, 0.35)',
              backgroundColor: colors.logoutBg,
              marginTop: 12,
            }}
          >
            <Ionicons name="log-out-outline" size={23} color={colors.red} />

            <Text
              style={{
                marginLeft: 18,
                color: colors.red,
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              Log out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SettingsScreen;
