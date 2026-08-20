import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { notificationsApi } from '../api/notifications';

// Lazily import expo-notifications so a missing native module never crashes the app.
// The native module is only available in custom builds that include the package.
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Show notifications as banners even when the app is in the foreground.
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Native module not yet compiled into this build — push notifications disabled.
  // Rebuild the app after running: cd ios && pod install
}

/**
 * Call once at the app root (after the user is authenticated).
 * Requests push-notification permission, obtains the Expo push token,
 * registers it with the backend, and sets up tap-to-navigate handling.
 *
 * Safe to call even if the native module isn't compiled yet — all calls
 * are guarded so the app never crashes.
 *
 * @param onNotificationTap  Optional callback called with the notification
 *                           data when the user taps a notification.
 */
export function useNotifications(
  onNotificationTap?: (data: Record<string, unknown>) => void,
) {
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    if (!Notifications) return; // native module not ready yet

    registerForPushNotifications();

    // Handle taps on notifications (app in background / killed).
    listenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        onNotificationTap?.(data);
      },
    );

    return () => {
      listenerRef.current?.remove();
    };
  }, []);
}

async function registerForPushNotifications() {
  if (!Notifications || !Device) return;

  if (!Device.isDevice) {
    // Simulators cannot receive push notifications.
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FetchMart',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return; // User declined — silent failure, no retry spam
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await notificationsApi.registerToken(tokenData.data);
  } catch (err) {
    // Non-fatal — user can still use the app without push notifications.
    console.warn('[useNotifications] Push setup failed:', err);
  }
}
