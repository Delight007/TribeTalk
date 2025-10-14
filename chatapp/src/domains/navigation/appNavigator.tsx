import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ConfirmationCode from '../auth/screens/confirmationCode';
import LoginScreen from '../auth/screens/login';
import SignupScreen from '../auth/screens/signup'; // 👈 add this import
import ChatScreen from '../main/screens/chat';
import FeedScreen from '../main/screens/feeds';
import FriendsList from '../main/screens/friends';
import Profile from '../main/screens/profile';

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#1f2937',
      },
      headerTintColor: '#10b981',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen
      name="Signup"
      component={SignupScreen}
      options={{
        headerShown: false, // hide header for signup too
      }}
    />
    <Stack.Screen
      name="ConfirmationCode"
      component={ConfirmationCode}
      options={{
        headerShown: false, // hide header for confirmation code screen
      }}
    />
    <Stack.Screen
      name="FeedScreen"
      component={FeedScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="FriendsList"
      component={FriendsList}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ChatScreen"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Profile"
      component={Profile}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default AppNavigator;
