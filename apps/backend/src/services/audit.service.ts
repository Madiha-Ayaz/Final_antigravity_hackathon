import { redisService } from './redis.service';
import { logger } from '@silentsiren/logger';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.delete'
  | 'emergency.create'
  | 'emergency.cancel'
  | 'emergency.dispatch'
  | 'validator.submit'
  | 'validator.validate'
  | 'reputation.update'
  | 'moderation.ban'
  | 'moderation.unban'
  | 'admin.settings.update'
  | 'admin.user.update'
  | 'system.config.update'
  | 'security.otp.send'
  | 'security.otp.verify'
  | 'security.token.refresh'
  | 'security.token.revoke';

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  targetUserId?: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  status: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  errorMessage?: string;
}

class AuditService {
  private readonly AUDIT_LOG_KEY = 'audit:logs';
  private readonly AUDIT_INDEX_KEY = 'audit:index';
  private readonly AUDIT_USER_KEY = 'audit:user';
  private readonly RETENTION_DAYS = 90;

  /**
   * Log an audit event
   */
  async log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = this.generateAuditId();
      const timestamp = new Date();

      const log: AuditLog = {
        id,
        timestamp,
        ...auditLog,
      };

      // Store in Redis sorted set (by timestamp)
      const score = timestamp.getTime();
      await redisService.zAdd(this.AUDIT_LOG_KEY, score, id);

      // Store log data
      await redisService.hSet(`${this.AUDIT_LOG_KEY}:${id}`, 'data', JSON.stringify(log));

      // Set expiry (90 days)
      await redisService.expire(`${this.AUDIT_LOG_KEY}:${id}`, this.RETENTION_DAYS * 86400);

      // Index by user if userId present
      if (auditLog.userId) {
        await redisService.zAdd(`${this.AUDIT_USER_KEY}:${auditLog.userId}`, score, id);
        await redisService.expire(
          `${this.AUDIT_USER_KEY}:${auditLog.userId}`,
          this.RETENTION_DAYS * 86400
        );
      }

      // Index by action
      await redisService.zAdd(`${this.AUDIT_INDEX_KEY}:${auditLog.action}`, score, id);
      await redisService.expire(
        `${this.AUDIT_INDEX_KEY}:${auditLog.action}`,
        this.RETENTION_DAYS * 86400
      );

      logger.info('Audit log created', {
        id,
        action: auditLog.action,
        userId: auditLog.userId,
        status: auditLog.status,
      });

      return id;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with pagination
   */
  async getLogs(
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      // Get total count
      const total = await redisService.sCard(this.AUDIT_LOG_KEY);

      // Get log IDs (newest first)
      const logIds = await redisService.zRangeByScore(this.AUDIT_LOG_KEY, 0, Date.now());

      // Reverse to get newest first
      logIds.reverse();

      // Apply pagination
      const paginatedIds = logIds.slice(offset, offset + limit);

      // Fetch log data
      const logs: AuditLog[] = [];
      for (const id of paginatedIds) {
        const logData = await redisService.hGet(`${this.AUDIT_LOG_KEY}:${id}`, 'data');
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      }

      return { logs, total };
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const key = `${this.AUDIT_USER_KEY}:${userId}`;

      // Get log IDs for user
      const logIds = await redisService.zRangeByScore(key, 0, Date.now());
      logIds.reverse();

      const total = logIds.length;
      const paginatedIds = logIds.slice(offset, offset + limit);

      // Fetch log data
      const logs: AuditLog[] = [];
      for (const id of paginatedIds) {
        const logData = await redisService.hGet(`${this.AUDIT_LOG_KEY}:${id}`, 'data');
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      }

      return { logs, total };
    } catch (error) {
      logger.error('Failed to get user audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs by action
   */
  async getLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    try {
      const key = `${this.AUDIT_INDEX_KEY}:${action}`;

      // Get log IDs for action
      const logIds = await redisService.zRangeByScore(key, 0, Date.now());
      logIds.reverse();

      const paginatedIds = logIds.slice(0, limit);

      // Fetch log data
      const logs: AuditLog[] = [];
      for (const id of paginatedIds) {
        const logData = await redisService.hGet(`${this.AUDIT_LOG_KEY}:${id}`, 'data');
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      }

      return logs;
    } catch (error) {
      logger.error('Failed to get audit logs by action:', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getLog(id: string): Promise<AuditLog | null> {
    try {
      const logData = await redisService.hGet(`${this.AUDIT_LOG_KEY}:${id}`, 'data');
      if (!logData) {
        return null;
      }
      return JSON.parse(logData);
    } catch (error) {
      logger.error('Failed to get audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    actionCounts: Record<string, number>;
  }> {
    try {
      const start = startDate ? startDate.getTime() : 0;
      const end = endDate ? endDate.getTime() : Date.now();

      // Get all logs in range
      const logIds = await redisService.zRangeByScore(this.AUDIT_LOG_KEY, start, end);

      let successCount = 0;
      let failureCount = 0;
      const actionCounts: Record<string, number> = {};

      for (const id of logIds) {
        const logData = await redisService.hGet(`${this.AUDIT_LOG_KEY}:${id}`, 'data');
        if (logData) {
          const log: AuditLog = JSON.parse(logData);

          if (log.status === 'success') successCount++;
          if (log.status === 'failure') failureCount++;

          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        }
      }

      return {
        totalLogs: logIds.length,
        successCount,
        failureCount,
        actionCounts,
      };
    } catch (error) {
      logger.error('Failed to get audit statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffTime = Date.now() - daysToKeep * 86400000;

      // Remove old logs from sorted set
      await redisService.zRemRangeByScore(this.AUDIT_LOG_KEY, 0, cutoffTime);

      logger.info('Audit logs cleaned up', { daysToKeep, cutoffTime });

      return cutoffTime;
    } catch (error) {
      logger.error('Failed to cleanup audit logs:', error);
      throw error;
    }
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const auditService = new AuditService();
