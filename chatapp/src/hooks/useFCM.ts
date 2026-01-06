// useFCM.ts
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { useEffect } from 'react';

interface SaveTokenParams {
  userId: string | null;
  token: string;
}

async function saveFcmTokenToBackend({
  userId,
  token,
}: SaveTokenParams): Promise<void> {
  if (!userId) return;
  try {
    await fetch('http://10.177.54.72:3000/api/save-token', {
      // adjust URL if needed
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fcmToken: token }),
    });
    console.log('FCM token sent to backend');
  } catch (error) {
    console.error('Error sending FCM token:', error);
  }
}

export function useRegisterFcmToken(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    async function registerToken() {
      try {
        const app = getApp();
        const messaging = getMessaging();
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Notification permission not granted');
          return;
        }

        const token = await getToken(messaging);
        console.log('FCM Token:', token);

        if (token) {
          await saveFcmTokenToBackend({ userId, token });
        }

        const unsubscribe = onTokenRefresh(messaging, async newToken => {
          console.log('FCM Token refreshed:', newToken);
          await saveFcmTokenToBackend({ userId, token: newToken });
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error in registerToken:', error);
      }
    }

    registerToken();
  }, [userId]);
}
