import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import './global.css';
import { useCurrentUser } from './src/api/auth';
import AppNavigator from './src/domains/navigation/appNavigator';
import { ThemeProvider } from './src/shared/contexts/themeContext';
import { useUserStore } from './src/shared/global/userStore';

const queryClient = new QueryClient();

// ✅ Move the logic into a child component that’s *inside* the provider
function UserSync() {
  const { data: currentUser } = useCurrentUser();
  const setUser = useUserStore(s => s.setCurrentUser);

  useEffect(() => {
    console.log('Fetched user:', currentUser);
    if (currentUser) setUser(currentUser);
  }, [currentUser, setUser]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer>
          {/* ✅ Mounted here — now it has access to QueryClient context */}
          <UserSync />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
