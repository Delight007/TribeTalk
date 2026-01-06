import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogin } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useAuthStore } from '../../../shared/global/authStore';
import { useChatStore } from '../../../shared/global/chatStore';
import { useUserStore } from '../../../shared/global/userStore';

const Login = ({ navigation }: any) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useLogin();
  const setUserToken = useAuthStore(state => state.setUserToken); // ✅ Zustand action
  // inside your Login component:
  // const setToken = useAuthStore(state => state.setToken);
  const setCurrentUser = useUserStore(state => state.setCurrentUser);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: async response => {
          console.log('Full login response:', response);

          if (response?.token && response?.user) {
            // ✅ Save token
            await AsyncStorage.setItem('token', response.token);
            setUserToken(response.token);

            // ✅ Save user data in userStore
            setCurrentUser(response.user);

            // ✅ Set current user in chat store immediately
            // Use user.id or user._id depending on what the API returns
            const userId = response.user.id || response.user._id;
            if (userId) {
              console.log('Setting current user in chat store:', userId);
              useChatStore.getState().setCurrentUser(userId);
            }

            Alert.alert('Success', 'Logged in successfully!');
          } else {
            Alert.alert('Error', 'Invalid server response');
          }
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Invalid credentials',
          );
        },
      },
    );
  };

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000'] // 🌿 Dark mode gradient
          : ['#b8e1af', '#d3f9d8', '#ffffff'] // ☀️ Light mode gradient
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 justify-center">
          {/* Header */}
          <View className="mb-8 items-center">
            <View className="flex-row items-center">
              <Image
                source={require('../../../assets/logo.png')}
                style={{ width: 50, height: 70, marginRight: -9 }}
              />
              <Text className="text-2xl font-bold text-green-600">
                ribeTalk
              </Text>
            </View>
            <Text
              className={`text-2xl font-medium text-center ${
                theme === 'dark' ? 'text-white' : 'text-[#1a2a22]'
              }`}
            >
              Sign in to your account
            </Text>
          </View>

          {/* Inputs */}
          <View>
            {/* Email */}
            <View className="mb-4">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email
              </Text>
              <TextInput
                className={`p-4 rounded-full ${
                  theme === 'dark'
                    ? 'bg-[#1a2a22] text-white'
                    : 'bg-zinc-200 text-black'
                }`}
                placeholder="Enter your email"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Password
              </Text>
              <TextInput
                className={`p-4 rounded-full ${
                  theme === 'dark'
                    ? 'bg-[#1a2a22] text-white'
                    : 'bg-zinc-200 text-black'
                }`}
                placeholder="Enter your password"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Button */}
            <TouchableOpacity
              className="p-4 rounded-full mt-2 bg-green-600"
              onPress={handleLogin}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>

            {/* Remember + Forgot */}
            <View className="flex-row justify-between mt-3">
              <Text
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Remember me
              </Text>
              <TouchableOpacity>
                <Text className="text-green-600 text-sm">Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* --- OR separator with lines --- */}
            <View className="flex-row items-center my-5">
              <View
                className={`flex-1 h-[1px] ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-300'
                }`}
              />
              <Text
                className={`mx-3 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Or
              </Text>
              <View
                className={`flex-1 h-[1px] ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-300'
                }`}
              />
            </View>

            {/* Google Button */}
            <TouchableOpacity className="flex-row items-center justify-center p-4 rounded-full mb-3 bg-[#1a2a22]">
              <Text className="text-base text-white">Sign in with Google</Text>
            </TouchableOpacity>

            {/* Signup redirect */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => navigation.navigate('Signup')}
            >
              <Text className="text-gray-700 dark:text-gray-400 text-center">
                Don’t have an account?{' '}
                <Text className="text-green-600 dark:text-green-400">
                  Sign up
                </Text>
              </Text>
            </TouchableOpacity>

            {/* 🌗 Theme Toggle */}
            <TouchableOpacity onPress={toggleTheme} className="mt-6">
              <Text className="text-center text-green-600">
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Login;
