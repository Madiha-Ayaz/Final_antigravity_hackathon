'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initializeFirebase,
  getFCMToken,
  onMessageListener,
  saveFCMToken,
  requestNotificationPermission,
} from '../lib/firebase';

interface UseFCMOptions {
  apiUrl?: string;
  authToken?: string | null;
  autoRequest?: boolean;
}

interface UseFCMReturn {
  token: string | null;
  permission: NotificationPermission | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useFCM = (options: UseFCMOptions = {}): UseFCMReturn => {
  const { apiUrl = process.env.NEXT_PUBLIC_API_URL, authToken, autoRequest = false } = options;

  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Initialize Firebase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, []);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Notifications not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);

          // Save token to backend if auth token is available
          if (authToken && apiUrl) {
            const saved = await saveFCMToken(fcmToken, apiUrl, authToken);
            if (!saved) {
              console.warn('Failed to save FCM token to backend');
            }
          }
        } else {
          setError('Failed to get FCM token');
        }
      } else {
        setError('Notification permission denied');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, authToken, apiUrl]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (permission === 'granted') {
      await requestPermission();
    }
  }, [permission, requestPermission]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequest && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [autoRequest, isSupported, permission, requestPermission]);

  // Listen for foreground messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      unsubscribe = await onMessageListener((payload) => {
        console.log('Foreground message received:', payload);

        // Show notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'SilentSiren', {
            body: payload.notification?.body,
            icon: payload.notification?.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: payload.data?.type || 'default',
            requireInteraction: true,
            data: payload.data,
          });
        }
      });
    };

    if (token) {
      setupListener();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [token]);

  return {
    token,
    permission,
    isSupported,
    isLoading,
    error,
    requestPermission,
    refreshToken,
  };
};
