import notifee, { AndroidImportance } from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import {
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { navigate } from '../utils/rootNavigation';

export function useFCMListeners() {
  useEffect(() => {
    const messaging = getMessaging(getApp());

    async function createNotificationChannel() {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    }
    createNotificationChannel();

    const parseFriend = (f: string | object | undefined) => {
      if (!f) return undefined;
      return typeof f === 'string' ? JSON.parse(f) : f;
    };

    // Show notification only
    const showNotification = async (
      remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    ) => {
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'default',
            smallIcon: 'ic_launcher',
          },
        });
      }
    };

    // Foreground messages
    const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
      console.log('FCM foreground message', remoteMessage);
      await showNotification(remoteMessage);
    });

    // Background: navigate only when user taps notification
    const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(
      messaging,
      remoteMessage => {
        const chatId = remoteMessage.data?.chatId;
        const friend = parseFriend(remoteMessage.data?.friend);
        navigate('ChatScreen', { chatId, friend });
      },
    );

    // Killed state: navigate if app opened from notification
    getInitialNotification(messaging).then(remoteMessage => {
      if (remoteMessage) {
        const chatId = remoteMessage.data?.chatId;
        const friend = parseFriend(remoteMessage.data?.friend);
        navigate('ChatScreen', { chatId, friend });
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);
}
