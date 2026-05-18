import { fcmService } from '../services/fcm.service';
import { deviceTokenRepository } from '../repositories/deviceToken.repository';
import { emergencyEventRepository } from '../repositories/emergency.repository';
import { userRepository } from '../repositories/user.repository';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('notification-service');

class NotificationService {
  /**
   * Send emergency alert to user's devices
   */
  async sendEmergencyAlert(
    userId: string,
    emergency: {
      eventId: string;
      threatLevel: string;
      location?: string;
      userName?: string;
    }
  ): Promise<{ success: boolean; sentCount: number }> {
    try {
      const tokens = await deviceTokenRepository.findActiveTokensByUserId(userId);

      if (tokens.length === 0) {
        logger.warn('No active tokens for user', { userId });
        return { success: false, sentCount: 0 };
      }

      const result = await fcmService.sendEmergencyAlert(tokens, emergency);

      logger.info('Emergency alert sent', {
        userId,
        eventId: emergency.eventId,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return { success: result.success, sentCount: result.successCount };
    } catch (error) {
      logger.error('Failed to send emergency alert', { error, userId });
      return { success: false, sentCount: 0 };
    }
  }

  /**
   * Send community validation request to nearby users
   */
  async sendCommunityValidationRequest(
    eventId: string,
    location: { latitude: number; longitude: number; address?: string },
    radiusKm: number = 5
  ): Promise<{ success: boolean; sentCount: number }> {
    try {
      // Find nearby emergency events to get nearby users
      const nearbyEvents = await emergencyEventRepository.findNearby(
        location.latitude,
        location.longitude,
        radiusKm,
        50
      );

      // Get unique user IDs
      const userIds = [...new Set(nearbyEvents.map((e) => e.user_id))];

      if (userIds.length === 0) {
        logger.info('No nearby users found for validation request', { eventId });
        return { success: true, sentCount: 0 };
      }

      // Get all tokens for these users
      const tokenMap = await deviceTokenRepository.findActiveTokensByUserIds(userIds);
      const allTokens: string[] = [];
      tokenMap.forEach((tokens) => allTokens.push(...tokens));

      if (allTokens.length === 0) {
        logger.warn('No active tokens for nearby users', { eventId, userCount: userIds.length });
        return { success: false, sentCount: 0 };
      }

      const result = await fcmService.sendCommunityValidationRequest(allTokens, {
        eventId,
        location: location.address || `${location.latitude}, ${location.longitude}`,
        distance: Math.round(radiusKm * 1000), // Convert to meters
      });

      logger.info('Community validation request sent', {
        eventId,
        userCount: userIds.length,
        tokenCount: allTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return { success: result.success, sentCount: result.successCount };
    } catch (error) {
      logger.error('Failed to send community validation request', { error, eventId });
      return { success: false, sentCount: 0 };
    }
  }

  /**
   * Send notification to specific users
   */
  async sendToUsers(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      image?: string;
    },
    data?: Record<string, string>
  ): Promise<{ success: boolean; sentCount: number }> {
    try {
      const tokenMap = await deviceTokenRepository.findActiveTokensByUserIds(userIds);
      const allTokens: string[] = [];
      tokenMap.forEach((tokens) => allTokens.push(...tokens));

      if (allTokens.length === 0) {
        logger.warn('No active tokens for users', { userIds });
        return { success: false, sentCount: 0 };
      }

      const result = await fcmService.sendMulticast(allTokens, notification, data);

      logger.info('Notification sent to users', {
        userCount: userIds.length,
        tokenCount: allTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return { success: result.success, sentCount: result.successCount };
    } catch (error) {
      logger.error('Failed to send notification to users', { error, userIds });
      return { success: false, sentCount: 0 };
    }
  }

  /**
   * Send notification to all active users (use sparingly!)
   */
  async sendToAllUsers(
    notification: {
      title: string;
      body: string;
      icon?: string;
      image?: string;
    },
    data?: Record<string, string>
  ): Promise<{ success: boolean; sentCount: number }> {
    try {
      logger.warn('Sending notification to ALL users');

      // Get all users (paginated)
      const users = await userRepository.list(1000, 0);
      const userIds = users.map((u) => u.id);

      return await this.sendToUsers(userIds, notification, data);
    } catch (error) {
      logger.error('Failed to send notification to all users', { error });
      return { success: false, sentCount: 0 };
    }
  }
}

export const notificationService = new NotificationService();
