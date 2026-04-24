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
import { useRegister } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';

const Signup = ({ navigation }: any) => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const signupMutation = useRegister();

  const handleSignup = async () => {
    if (!name || !email || !password || !confirm) {
      return Alert.alert('All fields are required');
    }

    if (password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      const res = await signupMutation.mutateAsync({ name, email, password });
      console.log('Signup response:', res); // ✅ see what you get
      Alert.alert('Success', 'Verification code sent to your email');
      navigation.navigate('ConfirmationCode', { email });
    } catch (error: any) {
      console.log('Signup error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Signup failed');
    }
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
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 justify-center">
          {/* Header */}
          <View className="mb-8 items-center">
            <View className="flex-row items-center ">
              <Image
                source={require('../../../assets/logo.png')}
                style={{ width: 50, height: 70, marginRight: -9 }}
              />
              <Text className={`text-2xl font-bold text-green-600 `}>
                ribeTalk
              </Text>
            </View>
            <Text
              className={`text-2xl font-medium text-center ${
                theme === 'dark' ? 'text-white' : 'text-[#1a2a22]'
              }`}
            >
              Sign up To Your Account
            </Text>
          </View>

          {/* Inputs */}
          <View>
            {/** Name */}
            <View className="mb-4">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Full name
              </Text>
              <TextInput
                className={`p-4 rounded-full ${
                  theme === 'dark'
                    ? ' bg-[#1a2a22] text-white'
                    : ' bg-zinc-200 text-black'
                }`}
                placeholder="Enter your full name"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/** Email */}
            <View className="mb-4">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email
              </Text>
              <TextInput
                className={`p-4 rounded-full  ${
                  theme === 'dark'
                    ? ' bg-[#1a2a22] text-white'
                    : ' bg-zinc-200 text-black'
                }`}
                placeholder="Enter your email"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/** Password */}
            <View className="mb-4">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Password
              </Text>
              <TextInput
                className={`p-4 rounded-full  ${
                  theme === 'dark'
                    ? ' bg-[#1a2a22] text-white'
                    : ' bg-zinc-200 text-black'
                }`}
                placeholder="Enter your password"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/** Confirm Password */}
            <View className="mb-6">
              <Text
                className={`mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Confirm password
              </Text>
              <TextInput
                className={`p-4 rounded-full  ${
                  theme === 'dark'
                    ? ' bg-[#1a2a22] text-white'
                    : ' bg-zinc-200 text-black'
                }`}
                placeholder="Confirm your password"
                placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>

            {/** Signup Button */}
            <TouchableOpacity
              className={`p-4 rounded-full mt-2 ${
                theme === 'dark' ? 'bg-green-600' : 'bg-green-600'
              }`}
              onPress={handleSignup}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Create account
              </Text>
            </TouchableOpacity>

            {/** Already have account */}
            <View className="flex-row justify-center mt-6">
              <Text
                className={`text-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text
                  className={`${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>

            {/** 🌗 Theme toggle for testing */}
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

export default Signup;
