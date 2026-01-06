import notifee from '@notifee/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import './global.css';
import './src/config/firebaseConfig';

import AppNavigator from './src/domains/navigation/appNavigator';
import ChatListLoader from './src/hooks/chatList';
import { useRegisterFcmToken } from './src/hooks/useFCM';
import { useFCMListeners } from './src/hooks/useFCMListener';

import { CallProvider } from './src/shared/contexts/callProvider';
import { initSocket } from './src/shared/contexts/socketIo';
import { ThemeProvider } from './src/shared/contexts/themeContext';

import { useCurrentUser } from './src/api/auth';
import { useChatStore } from './src/shared/global/chatStore';
import { useUserStore } from './src/shared/global/userStore';

import { navigationRef } from './src/utils/rootNavigation';

/* -------------------------------------------------------------------------- */
/*                              QUERY CLIENT                                  */
/* -------------------------------------------------------------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                                   APP                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <AppInner />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                APP INNER                                   */
/* -------------------------------------------------------------------------- */

function AppInner() {
  const [socket, setSocket] = useState<any>(null);
  const { data: currentUser } = useCurrentUser();
  const appState = useRef(AppState.currentState);

  useFCMListeners();
  useRegisterFcmToken(currentUser?._id ?? null);

  /* ------------------------- Notification Permission ------------------------ */
  useEffect(() => {
    notifee.requestPermission();
  }, []);

  /* ------------------------------ Init Socket ------------------------------ */
  useEffect(() => {
    if (!currentUser?._id) return;

    initSocket(currentUser._id).then(sock => {
      if (!sock) return;

      setSocket(sock);

      if (sock.connected) {
        sock.emit('register', currentUser._id);
      } else {
        sock.once('connect', () => sock.emit('register', currentUser._id));
      }
    });
  }, [currentUser?._id]);

  /* ------------------------- App State Handling ---------------------------- */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active' &&
          currentUser?._id
        ) {
          const sock = await initSocket(currentUser._id);
          if (!sock) return;

          if (!sock.connected) sock.connect();
          sock.emit('register', currentUser._id);

          useChatStore.getState().retryPendingMessages();
        }

        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [currentUser?._id]);

  /* ------------------------------- Render --------------------------------- */
  return socket ? (
    <CallProvider socket={socket}>
      <UserSync />
      <ChatListLoader />
      <AppNavigator />
    </CallProvider>
  ) : (
    <>
      <UserSync />
      <ChatListLoader />
      <AppNavigator />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              USER SYNC                                     */
/* -------------------------------------------------------------------------- */

function UserSync() {
  const { data: currentUser } = useCurrentUser();
  const setCurrentUser = useUserStore(state => state.setCurrentUser);

  useEffect(() => {
    if (!currentUser) return;

    setCurrentUser(currentUser);
    useChatStore.getState().setCurrentUser(currentUser._id);
  }, [currentUser]);

  return null;
}
