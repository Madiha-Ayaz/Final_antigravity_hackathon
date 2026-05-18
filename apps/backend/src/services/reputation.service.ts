import { redisService } from './redis.service';
import { logger } from '@silentsiren/logger';
import { UserReputation, DeviceFingerprint } from '@silentsiren/shared-types';

interface AbuseCheckResult {
  isAllowed: boolean;
  reason?: string;
  reputation: UserReputation;
  remainingQuota?: number;
}

class ReputationService {
  private readonly USER_REPUTATION_KEY = 'reputation:user';
  private readonly DEVICE_FINGERPRINT_KEY = 'reputation:device';
  private readonly RATE_LIMIT_KEY = 'ratelimit:user';
  private readonly BLACKLIST_KEY = 'blacklist:users';

  // Configuration
  private readonly MAX_INCIDENTS_PER_HOUR = 3;
  private readonly MAX_INCIDENTS_PER_DAY = 10;
  private readonly COOLDOWN_SECONDS = 3600; // 1 hour
  private readonly BAN_THRESHOLD_SCORE = -50;
  private readonly INITIAL_REPUTATION_SCORE = 100;
  private readonly FALSE_ALARM_PENALTY = -10;
  private readonly VALIDATED_INCIDENT_REWARD = 5;
  private readonly BAN_DURATION_SECONDS = 86400; // 24 hours

  /**
   * Check if user is allowed to submit an incident
   */
  async checkUserAllowed(userId: string, deviceId: string): Promise<AbuseCheckResult> {
    try {
      // Check if user is blacklisted
      const isBlacklisted = await this.isUserBlacklisted(userId);
      if (isBlacklisted) {
        const reputation = await this.getUserReputation(userId);
        return {
          isAllowed: false,
          reason: 'User is temporarily banned due to abuse',
          reputation,
        };
      }

      // Get or create user reputation
      const reputation = await this.getUserReputation(userId);

      // Check reputation score
      if (reputation.score <= this.BAN_THRESHOLD_SCORE) {
        await this.banUser(userId, 'Low reputation score', this.BAN_DURATION_SECONDS);
        return {
          isAllowed: false,
          reason: 'User reputation too low',
          reputation,
        };
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          isAllowed: false,
          reason: rateLimitCheck.reason,
          reputation,
          remainingQuota: 0,
        };
      }

      // Check device fingerprint for suspicious activity
      const deviceCheck = await this.checkDeviceFingerprint(deviceId, userId);
      if (!deviceCheck.allowed) {
        return {
          isAllowed: false,
          reason: deviceCheck.reason,
          reputation,
        };
      }

      return {
        isAllowed: true,
        reputation,
        remainingQuota: rateLimitCheck.remaining,
      };
    } catch (error) {
      logger.error('Failed to check user allowed:', error);
      throw error;
    }
  }

  /**
   * Get user reputation or create new one
   */
  async getUserReputation(userId: string): Promise<UserReputation> {
    const key = `${this.USER_REPUTATION_KEY}:${userId}`;
    const dataStr = await redisService.hGet(key, 'data');

    if (dataStr) {
      return JSON.parse(dataStr);
    }

    // Create new reputation
    const newReputation: UserReputation = {
      userId,
      score: this.INITIAL_REPUTATION_SCORE,
      totalIncidents: 0,
      validatedIncidents: 0,
      falseAlarms: 0,
      isBanned: false,
    };

    await this.saveUserReputation(newReputation);
    return newReputation;
  }

  /**
   * Save user reputation
   */
  private async saveUserReputation(reputation: UserReputation): Promise<void> {
    const key = `${this.USER_REPUTATION_KEY}:${reputation.userId}`;
    await redisService.hSet(key, 'data', JSON.stringify(reputation));
    // Keep reputation data for 90 days
    await redisService.expire(key, 90 * 86400);
  }

  /**
   * Update reputation after incident validation
   */
  async updateReputationAfterIncident(
    userId: string,
    wasValidated: boolean,
    wasFalseAlarm: boolean
  ): Promise<void> {
    const reputation = await this.getUserReputation(userId);

    reputation.totalIncidents += 1;
    reputation.lastIncidentTime = new Date();

    if (wasValidated) {
      reputation.validatedIncidents += 1;
      reputation.score += this.VALIDATED_INCIDENT_REWARD;
    }

    if (wasFalseAlarm) {
      reputation.falseAlarms += 1;
      reputation.score += this.FALSE_ALARM_PENALTY;
    }

    // Check if should be banned
    if (reputation.score <= this.BAN_THRESHOLD_SCORE) {
      await this.banUser(userId, 'Reputation score too low', this.BAN_DURATION_SECONDS);
      reputation.isBanned = true;
    }

    await this.saveUserReputation(reputation);

    logger.info('User reputation updated', {
      userId,
      score: reputation.score,
      totalIncidents: reputation.totalIncidents,
      validatedIncidents: reputation.validatedIncidents,
      falseAlarms: reputation.falseAlarms,
    });
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(
    userId: string
  ): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
    const hourKey = `${this.RATE_LIMIT_KEY}:${userId}:hour`;
    const dayKey = `${this.RATE_LIMIT_KEY}:${userId}:day`;

    // Check hourly limit
    const hourCount = await redisService.get(hourKey);
    const hourlyIncidents = hourCount ? parseInt(hourCount, 10) : 0;

    if (hourlyIncidents >= this.MAX_INCIDENTS_PER_HOUR) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.MAX_INCIDENTS_PER_HOUR} incidents per hour`,
        remaining: 0,
      };
    }

    // Check daily limit
    const dayCount = await redisService.get(dayKey);
    const dailyIncidents = dayCount ? parseInt(dayCount, 10) : 0;

    if (dailyIncidents >= this.MAX_INCIDENTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.MAX_INCIDENTS_PER_DAY} incidents per day`,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: this.MAX_INCIDENTS_PER_HOUR - hourlyIncidents,
    };
  }

  /**
   * Increment rate limit counters
   */
  async incrementRateLimit(userId: string): Promise<void> {
    const hourKey = `${this.RATE_LIMIT_KEY}:${userId}:hour`;
    const dayKey = `${this.RATE_LIMIT_KEY}:${userId}:day`;

    // Increment hourly counter
    const hourCount = await redisService.incr(hourKey);
    if (hourCount === 1) {
      await redisService.expire(hourKey, 3600); // 1 hour
    }

    // Increment daily counter
    const dayCount = await redisService.incr(dayKey);
    if (dayCount === 1) {
      await redisService.expire(dayKey, 86400); // 24 hours
    }
  }

  /**
   * Check device fingerprint for suspicious activity
   */
  private async checkDeviceFingerprint(
    deviceId: string,
    userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const key = `${this.DEVICE_FINGERPRINT_KEY}:${deviceId}`;
    const dataStr = await redisService.hGet(key, 'data');

    let fingerprint: DeviceFingerprint;

    if (dataStr) {
      fingerprint = JSON.parse(dataStr);
      fingerprint.lastSeen = new Date();
      fingerprint.incidentCount += 1;

      // Check for suspicious patterns
      // Pattern 1: Too many incidents from same device
      if (fingerprint.incidentCount > 20) {
        fingerprint.isSuspicious = true;
        await this.saveDeviceFingerprint(fingerprint);
        return {
          allowed: false,
          reason: 'Device flagged as suspicious due to high incident count',
        };
      }

      // Pattern 2: Multiple users from same device (potential Sybil attack)
      const deviceUsersKey = `device:users:${deviceId}`;
      await redisService.sAdd(deviceUsersKey, userId);
      const userCount = await redisService.sCard(deviceUsersKey);

      if (userCount > 5) {
        fingerprint.isSuspicious = true;
        await this.saveDeviceFingerprint(fingerprint);
        return {
          allowed: false,
          reason: 'Device associated with too many users (potential Sybil attack)',
        };
      }

      await this.saveDeviceFingerprint(fingerprint);
    } else {
      // Create new fingerprint
      fingerprint = {
        deviceId,
        userAgent: '',
        platform: '',
        firstSeen: new Date(),
        lastSeen: new Date(),
        incidentCount: 1,
        isSuspicious: false,
      };
      await this.saveDeviceFingerprint(fingerprint);

      // Track device-user association
      const deviceUsersKey = `device:users:${deviceId}`;
      await redisService.sAdd(deviceUsersKey, userId);
      await redisService.expire(deviceUsersKey, 30 * 86400); // 30 days
    }

    return { allowed: true };
  }

  /**
   * Save device fingerprint
   */
  private async saveDeviceFingerprint(fingerprint: DeviceFingerprint): Promise<void> {
    const key = `${this.DEVICE_FINGERPRINT_KEY}:${fingerprint.deviceId}`;
    await redisService.hSet(key, 'data', JSON.stringify(fingerprint));
    await redisService.expire(key, 90 * 86400); // 90 days
  }

  /**
   * Ban user temporarily
   */
  async banUser(userId: string, reason: string, durationSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    await redisService.set(
      `${this.BLACKLIST_KEY}:${userId}`,
      JSON.stringify({ reason, expiresAt }),
      durationSeconds
    );

    // Update reputation
    const reputation = await this.getUserReputation(userId);
    reputation.isBanned = true;
    reputation.banReason = reason;
    reputation.banExpiresAt = expiresAt;
    await this.saveUserReputation(reputation);

    logger.warn('User banned', { userId, reason, expiresAt });
  }

  /**
   * Check if user is blacklisted
   */
  async isUserBlacklisted(userId: string): Promise<boolean> {
    return await redisService.exists(`${this.BLACKLIST_KEY}:${userId}`);
  }

  /**
   * Unban user
   */
  async unbanUser(userId: string): Promise<void> {
    await redisService.del(`${this.BLACKLIST_KEY}:${userId}`);

    const reputation = await this.getUserReputation(userId);
    reputation.isBanned = false;
    reputation.banReason = undefined;
    reputation.banExpiresAt = undefined;
    await this.saveUserReputation(reputation);

    logger.info('User unbanned', { userId });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserReputation> {
    return await this.getUserReputation(userId);
  }
}

export const reputationService = new ReputationService();
