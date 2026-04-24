import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../../shared/global/authStore';
import { RootStackParamList } from '../../types/navigation';
import ConfirmationCode from '../auth/screens/confirmationCode';
import LoginScreen from '../auth/screens/login';
import SignupScreen from '../auth/screens/signup';
import ChatList from '../main/screens/charList';
import ChatScreen from '../main/screens/chat';
import EditProfile from '../main/screens/editPage';
import FeedScreen from '../main/screens/feeds';
import Friendlist from '../main/screens/friendList';
import PostScreen from '../main/screens/postScreen';
import PreviewScreen from '../main/screens/previewScreen';
import Profile from '../main/screens/profile';
import SettingsScreen from '../main/screens/settings';
import AppUsers from '../main/screens/users';
import VideoCall from '../main/screens/videoCall';

// const Stack = createNativeStackNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { userToken, loadToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadToken();
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ConfirmationCode" component={ConfirmationCode} />
        </>
      ) : (
        <>
          <Stack.Screen name="FeedScreen" component={FeedScreen} />
          <Stack.Screen name="ChatList" component={ChatList} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="AppUsers" component={AppUsers} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="VideoCall" component={VideoCall} />
          <Stack.Screen name="Friendlist" component={Friendlist} />
          <Stack.Screen name="PostScreen" component={PostScreen} />
          <Stack.Screen name="PreviewScreen" component={PreviewScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
