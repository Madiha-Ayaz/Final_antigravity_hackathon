import { databaseService } from '../services/database.service';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('device-token-repository');

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'web' | 'android' | 'ios';
  device_info?: Record<string, any>;
  is_active: boolean;
  last_used_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeviceTokenInput {
  user_id: string;
  token: string;
  device_type?: 'web' | 'android' | 'ios';
  device_info?: Record<string, any>;
}

class DeviceTokenRepository {
  async create(input: CreateDeviceTokenInput): Promise<DeviceToken> {
    try {
      const result = await databaseService.query<DeviceToken>(
        `INSERT INTO device_tokens (user_id, token, device_type, device_info)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, token)
         DO UPDATE SET
           is_active = true,
           last_used_at = NOW(),
           device_info = EXCLUDED.device_info
         RETURNING *`,
        [
          input.user_id,
          input.token,
          input.device_type || 'web',
          JSON.stringify(input.device_info || {}),
        ]
      );

      logger.info('Device token saved', { userId: input.user_id, tokenId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to save device token', { error, input });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<DeviceToken[]> {
    try {
      const result = await databaseService.query<DeviceToken>(
        'SELECT * FROM device_tokens WHERE user_id = $1 AND is_active = true ORDER BY last_used_at DESC',
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to find device tokens', { error, userId });
      throw error;
    }
  }

  async findActiveTokensByUserId(userId: string): Promise<string[]> {
    try {
      const result = await databaseService.query<{ token: string }>(
        'SELECT token FROM device_tokens WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      return result.rows.map((row) => row.token);
    } catch (error) {
      logger.error('Failed to find active tokens', { error, userId });
      throw error;
    }
  }

  async findActiveTokensByUserIds(userIds: string[]): Promise<Map<string, string[]>> {
    try {
      const result = await databaseService.query<{ user_id: string; token: string }>(
        'SELECT user_id, token FROM device_tokens WHERE user_id = ANY($1) AND is_active = true',
        [userIds]
      );

      const tokenMap = new Map<string, string[]>();
      result.rows.forEach((row) => {
        if (!tokenMap.has(row.user_id)) {
          tokenMap.set(row.user_id, []);
        }
        tokenMap.get(row.user_id)!.push(row.token);
      });

      return tokenMap;
    } catch (error) {
      logger.error('Failed to find active tokens for multiple users', { error, userIds });
      throw error;
    }
  }

  async deactivate(userId: string, token: string): Promise<void> {
    try {
      await databaseService.query(
        'UPDATE device_tokens SET is_active = false WHERE user_id = $1 AND token = $2',
        [userId, token]
      );

      logger.info('Device token deactivated', { userId, token: token.substring(0, 20) });
    } catch (error) {
      logger.error('Failed to deactivate device token', { error, userId });
      throw error;
    }
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    try {
      await databaseService.query('UPDATE device_tokens SET is_active = false WHERE user_id = $1', [
        userId,
      ]);

      logger.info('All device tokens deactivated for user', { userId });
    } catch (error) {
      logger.error('Failed to deactivate all tokens', { error, userId });
      throw error;
    }
  }

  async updateLastUsed(userId: string, token: string): Promise<void> {
    try {
      await databaseService.query(
        'UPDATE device_tokens SET last_used_at = NOW() WHERE user_id = $1 AND token = $2',
        [userId, token]
      );
    } catch (error) {
      logger.error('Failed to update last used', { error, userId });
      throw error;
    }
  }

  async cleanupInactiveTokens(daysInactive: number = 90): Promise<number> {
    try {
      const result = await databaseService.query(
        `DELETE FROM device_tokens
         WHERE last_used_at < NOW() - INTERVAL '${daysInactive} days'
         RETURNING id`
      );

      const deletedCount = result.rowCount || 0;
      logger.info('Cleaned up inactive tokens', { deletedCount, daysInactive });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup inactive tokens', { error });
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalTokens: number;
    activeTokens: number;
    webTokens: number;
    mobileTokens: number;
  }> {
    try {
      const result = await databaseService.query<{
        total: string;
        active: string;
        web: string;
        mobile: string;
      }>(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE device_type = 'web' AND is_active = true) as web,
          COUNT(*) FILTER (WHERE device_type IN ('android', 'ios') AND is_active = true) as mobile
        FROM device_tokens`
      );

      const row = result.rows[0];
      return {
        totalTokens: parseInt(row.total, 10),
        activeTokens: parseInt(row.active, 10),
        webTokens: parseInt(row.web, 10),
        mobileTokens: parseInt(row.mobile, 10),
      };
    } catch (error) {
      logger.error('Failed to get token statistics', { error });
      throw error;
    }
  }
}

export const deviceTokenRepository = new DeviceTokenRepository();
