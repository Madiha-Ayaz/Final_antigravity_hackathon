import * as admin from 'firebase-admin';
import { config } from '@silentsiren/config';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('fcm-service');

class FCMService {
  private app: admin.app.App | null = null;
  private messaging: admin.messaging.Messaging | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Check if Firebase credentials are configured
      if (
        !config.FIREBASE_PROJECT_ID ||
        !config.FIREBASE_CLIENT_EMAIL ||
        !config.FIREBASE_PRIVATE_KEY
      ) {
        logger.warn(
          'Firebase credentials not configured. FCM will not be available. This is optional.'
        );
        return;
      }

      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.app = admin.apps[0];
        this.messaging = admin.messaging(this.app || undefined);
        logger.info('Firebase Admin SDK already initialized');
        return;
      }

      // Replace escaped newlines in private key
      const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.FIREBASE_PROJECT_ID,
          clientEmail: config.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      this.messaging = admin.messaging(this.app || undefined);
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error });
    }
  }

  isConfigured(): boolean {
    return this.messaging !== null;
  }

  async sendNotification(
    token: string,
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
    },
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.messaging) {
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: data || {},
        webpush: {
          notification: {
            icon: notification.icon || '/icon-192x192.png',
            badge: notification.badge || '/badge-72x72.png',
            requireInteraction: true,
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: data?.url || '/',
          },
        },
      };

      const messageId = await this.messaging.send(message);
      logger.info('Notification sent successfully', { messageId, token: token.substring(0, 20) });

      return { success: true, messageId };
    } catch (error) {
      logger.error('Failed to send notification', { error, token: token.substring(0, 20) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMulticast(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
    },
    data?: Record<string, string>
  ): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    failedTokens: string[];
  }> {
    if (!this.messaging) {
      return { success: false, successCount: 0, failureCount: tokens.length, failedTokens: tokens };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: data || {},
        webpush: {
          notification: {
            icon: notification.icon || '/icon-192x192.png',
            badge: notification.badge || '/badge-72x72.png',
            requireInteraction: true,
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: data?.url || '/',
          },
        },
      };

      const response = await this.messaging.sendEachForMulticast(message);

      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      logger.info('Multicast notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      logger.error('Failed to send multicast notification', { error });
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        failedTokens: tokens,
      };
    }
  }

  async sendEmergencyAlert(
    tokens: string[],
    emergency: {
      eventId: string;
      threatLevel: string;
      location?: string;
      userName?: string;
    }
  ): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
  }> {
    const timestamp = new Date().toISOString();
    const mapLink = emergency.location ? `https://www.google.com/maps?q=${emergency.location}` : '';

    const notification = {
      title: '🚨 Emergency Alert',
      body: `${emergency.userName || 'A user'} triggered an emergency alert (${emergency.threatLevel}).\nTime: ${timestamp}${emergency.location ? `\nLocation: ${emergency.location}\nMap: ${mapLink}` : ''}`,
      icon: '/emergency-icon.png',
      badge: '/badge-72x72.png',
    };

    const data = {
      type: 'EMERGENCY',
      eventId: emergency.eventId,
      threatLevel: emergency.threatLevel,
      url: `/emergency/${emergency.eventId}`,
      timestamp,
      mapLink,
    };

    const result = await this.sendMulticast(tokens, notification, data);

    return {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  async sendCommunityValidationRequest(
    tokens: string[],
    validation: {
      eventId: string;
      location: string;
      distance: number;
    }
  ): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
  }> {
    const notification = {
      title: '🔔 Community Validation Needed',
      body: `Emergency reported ${validation.distance}m away at ${validation.location}. Can you help validate?`,
      icon: '/validation-icon.png',
    };

    const data = {
      type: 'VALIDATION_REQUEST',
      eventId: validation.eventId,
      url: `/validate/${validation.eventId}`,
    };

    const result = await this.sendMulticast(tokens, notification, data);

    return {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.messaging) {
      return false;
    }

    try {
      // Try to send a dry-run message to validate token
      await this.messaging.send(
        {
          token,
          notification: { title: 'Test', body: 'Test' },
        },
        true // dry run
      );
      return true;
    } catch (error) {
      logger.warn('Invalid FCM token', { token: token.substring(0, 20), error });
      return false;
    }
  }
}

export const fcmService = new FCMService();
