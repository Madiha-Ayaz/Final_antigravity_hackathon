import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = (): FirebaseApp | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }

  if (!app) {
    initializeFirebase();
  }

  if (!messaging && app) {
    messaging = getMessaging(app);
  }

  return messaging;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      throw new Error('Messaging not initialized');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key not configured');
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) {
      console.log('FCM Token generated:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onMessageListener = async (
  callback: (payload: any) => void
): Promise<(() => void) | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return null;
  }
};

export const saveFCMToken = async (
  token: string,
  apiUrl: string,
  authToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${apiUrl}/api/fcm/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        deviceType: 'web',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save FCM token');
    }

    const data = await response.json();
    console.log('FCM token saved:', data);
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
};
