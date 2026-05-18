import { redisService } from './redis.service';
import { logger } from '@silentsiren/logger';

interface AbuseMetrics {
  totalIncidents: number;
  falseAlarms: number;
  validatedIncidents: number;
  falseAlarmRate: number;
  averageConfidence: number;
  suspiciousUsers: string[];
  suspiciousDevices: string[];
  topAbusers: Array<{ userId: string; count: number }>;
}

interface UserBehaviorPattern {
  userId: string;
  incidentCount: number;
  falseAlarmCount: number;
  averageTimeBetweenIncidents: number;
  suspiciousPatterns: string[];
  riskScore: number;
}

interface AbuseAlert {
  id: string;
  type: 'high_false_alarm_rate' | 'rapid_incidents' | 'suspicious_device' | 'coordinated_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  deviceId?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AbuseAnalyticsService {
  private readonly ANALYTICS_KEY = 'analytics:abuse';
  private readonly PATTERN_KEY = 'analytics:pattern';
  private readonly ALERT_KEY = 'analytics:alert';

  /**
   * Get abuse metrics for a time period
   */
  async getMetrics(startDate?: Date, endDate?: Date): Promise<AbuseMetrics> {
    try {
      const start = startDate ? startDate.getTime() : Date.now() - 86400000; // Last 24h
      const end = endDate ? endDate.getTime() : Date.now();

      // Get all incidents in time range
      const incidents = await this.getIncidentsInRange(start, end);

      let totalIncidents = 0;
      let falseAlarms = 0;
      let validatedIncidents = 0;
      let totalConfidence = 0;
      const userIncidents: Record<string, number> = {};
      const deviceIncidents: Record<string, number> = {};

      for (const incident of incidents) {
        totalIncidents++;

        if (incident.status === 'false_alarm') {
          falseAlarms++;
        }

        if (incident.status === 'validated') {
          validatedIncidents++;
        }

        if (incident.confidence) {
          totalConfidence += incident.confidence;
        }

        // Track user incidents
        if (incident.userId) {
          userIncidents[incident.userId] = (userIncidents[incident.userId] || 0) + 1;
        }

        // Track device incidents
        if (incident.deviceId) {
          deviceIncidents[incident.deviceId] = (deviceIncidents[incident.deviceId] || 0) + 1;
        }
      }

      const falseAlarmRate = totalIncidents > 0 ? falseAlarms / totalIncidents : 0;
      const averageConfidence = totalIncidents > 0 ? totalConfidence / totalIncidents : 0;

      // Find suspicious users (>5 incidents or >50% false alarm rate)
      const suspiciousUsers = Object.entries(userIncidents)
        .filter(([_, count]) => count > 5)
        .map(([userId]) => userId);

      // Find suspicious devices (>10 incidents)
      const suspiciousDevices = Object.entries(deviceIncidents)
        .filter(([_, count]) => count > 10)
        .map(([deviceId]) => deviceId);

      // Get top abusers
      const topAbusers = Object.entries(userIncidents)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }));

      return {
        totalIncidents,
        falseAlarms,
        validatedIncidents,
        falseAlarmRate,
        averageConfidence,
        suspiciousUsers,
        suspiciousDevices,
        topAbusers,
      };
    } catch (error) {
      logger.error('Failed to get abuse metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorPattern> {
    try {
      const incidents = await this.getUserIncidents(userId);

      let incidentCount = 0;
      let falseAlarmCount = 0;
      const timestamps: number[] = [];
      const suspiciousPatterns: string[] = [];

      for (const incident of incidents) {
        incidentCount++;
        timestamps.push(new Date(incident.timestamp).getTime());

        if (incident.status === 'false_alarm') {
          falseAlarmCount++;
        }
      }

      // Calculate average time between incidents
      let averageTimeBetweenIncidents = 0;
      if (timestamps.length > 1) {
        timestamps.sort((a, b) => a - b);
        const timeDiffs = [];
        for (let i = 1; i < timestamps.length; i++) {
          timeDiffs.push(timestamps[i] - timestamps[i - 1]);
        }
        averageTimeBetweenIncidents =
          timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
      }

      // Detect suspicious patterns
      if (falseAlarmCount / incidentCount > 0.5) {
        suspiciousPatterns.push('high_false_alarm_rate');
      }

      if (averageTimeBetweenIncidents < 300000) {
        // Less than 5 minutes
        suspiciousPatterns.push('rapid_incident_creation');
      }

      if (incidentCount > 20) {
        suspiciousPatterns.push('excessive_incidents');
      }

      // Calculate risk score (0-100)
      let riskScore = 0;
      riskScore += (falseAlarmCount / incidentCount) * 40; // 40 points for false alarm rate
      riskScore += Math.min((incidentCount / 50) * 30, 30); // 30 points for incident count
      riskScore += suspiciousPatterns.length * 10; // 10 points per pattern

      return {
        userId,
        incidentCount,
        falseAlarmCount,
        averageTimeBetweenIncidents,
        suspiciousPatterns,
        riskScore: Math.min(riskScore, 100),
      };
    } catch (error) {
      logger.error('Failed to analyze user behavior:', error);
      throw error;
    }
  }

  /**
   * Create abuse alert
   */
  async createAlert(alert: Omit<AbuseAlert, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = this.generateAlertId();
      const timestamp = new Date();

      const fullAlert: AbuseAlert = {
        id,
        timestamp,
        ...alert,
      };

      // Store alert
      const score = timestamp.getTime();
      await redisService.zAdd(this.ALERT_KEY, score, id);
      await redisService.hSet(`${this.ALERT_KEY}:${id}`, 'data', JSON.stringify(fullAlert));
      await redisService.expire(`${this.ALERT_KEY}:${id}`, 30 * 86400); // 30 days

      logger.warn('Abuse alert created', {
        id,
        type: alert.type,
        severity: alert.severity,
        userId: alert.userId,
      });

      return id;
    } catch (error) {
      logger.error('Failed to create abuse alert:', error);
      throw error;
    }
  }

  /**
   * Get recent alerts
   */
  async getAlerts(limit: number = 50): Promise<AbuseAlert[]> {
    try {
      const alertIds = await redisService.zRangeByScore(this.ALERT_KEY, 0, Date.now());
      alertIds.reverse();

      const alerts: AbuseAlert[] = [];
      for (const id of alertIds.slice(0, limit)) {
        const alertData = await redisService.hGet(`${this.ALERT_KEY}:${id}`, 'data');
        if (alertData) {
          alerts.push(JSON.parse(alertData));
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to get abuse alerts:', error);
      throw error;
    }
  }

  /**
   * Detect coordinated attacks
   */
  async detectCoordinatedAttacks(): Promise<AbuseAlert[]> {
    try {
      const alerts: AbuseAlert[] = [];
      const now = Date.now();
      const timeWindow = 300000; // 5 minutes

      // Get recent incidents
      const incidents = await this.getIncidentsInRange(now - timeWindow, now);

      // Group by location
      const locationGroups: Record<string, any[]> = {};
      for (const incident of incidents) {
        if (incident.location) {
          const key = `${Math.floor(incident.location.latitude * 100)},${Math.floor(incident.location.longitude * 100)}`;
          if (!locationGroups[key]) {
            locationGroups[key] = [];
          }
          locationGroups[key].push(incident);
        }
      }

      // Check for suspicious patterns
      for (const [location, groupIncidents] of Object.entries(locationGroups)) {
        if (groupIncidents.length > 10) {
          // More than 10 incidents in same area
          const uniqueUsers = new Set(groupIncidents.map((i) => i.userId)).size;

          if (uniqueUsers > 5) {
            // Multiple different users
            const alertId = await this.createAlert({
              type: 'coordinated_attack',
              severity: 'critical',
              description: `Detected ${groupIncidents.length} incidents from ${uniqueUsers} users in same location`,
              metadata: {
                location,
                incidentCount: groupIncidents.length,
                userCount: uniqueUsers,
              },
            });

            const alert = await this.getAlert(alertId);
            if (alert) {
              alerts.push(alert);
            }
          }
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to detect coordinated attacks:', error);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  private async getAlert(id: string): Promise<AbuseAlert | null> {
    const alertData = await redisService.hGet(`${this.ALERT_KEY}:${id}`, 'data');
    return alertData ? JSON.parse(alertData) : null;
  }

  /**
   * Get incidents in time range (mock - replace with actual implementation)
   */
  private async getIncidentsInRange(start: number, end: number): Promise<any[]> {
    // This should query your actual incident storage
    // For now, returning empty array
    return [];
  }

  /**
   * Get user incidents (mock - replace with actual implementation)
   */
  private async getUserIncidents(userId: string): Promise<any[]> {
    // This should query your actual incident storage
    return [];
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get abuse statistics summary
   */
  async getSummary(): Promise<{
    last24h: AbuseMetrics;
    last7d: AbuseMetrics;
    activeAlerts: number;
    highRiskUsers: number;
  }> {
    const now = Date.now();
    const last24h = await this.getMetrics(new Date(now - 86400000), new Date(now));
    const last7d = await this.getMetrics(new Date(now - 7 * 86400000), new Date(now));

    const alerts = await this.getAlerts(100);
    const activeAlerts = alerts.filter(
      (a) => a.severity === 'high' || a.severity === 'critical'
    ).length;

    const highRiskUsers = last24h.suspiciousUsers.length;

    return {
      last24h,
      last7d,
      activeAlerts,
      highRiskUsers,
    };
  }
}

export const abuseAnalyticsService = new AbuseAnalyticsService();
