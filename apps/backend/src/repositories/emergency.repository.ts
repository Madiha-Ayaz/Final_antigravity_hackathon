import { databaseService } from '../services/database.service';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('emergency-repository');

export interface EmergencyEvent {
  id: string;
  user_id: string;
  event_type: 'VOICE_TRIGGER' | 'MANUAL' | 'PANIC_BUTTON';
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'VERIFIED' | 'FALSE_ALARM' | 'DISPATCHED' | 'RESOLVED';
  latitude?: number;
  longitude?: number;
  address?: string;
  audio_url?: string;
  transcript?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  detected_patterns?: string[];
  emotional_stress?: number;
  dispatch_recommended: boolean;
  dispatch_sent: boolean;
  dispatch_sent_at?: Date;
  user_verified?: boolean;
  user_verified_at?: Date;
  community_validated: boolean;
  validation_count: number;
  false_alarm_reported: boolean;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmergencyEventInput {
  user_id: string;
  event_type: 'VOICE_TRIGGER' | 'MANUAL' | 'PANIC_BUTTON';
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude?: number;
  longitude?: number;
  address?: string;
  audio_url?: string;
  transcript?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  detected_patterns?: string[];
  emotional_stress?: number;
  dispatch_recommended?: boolean;
}

export interface UpdateEmergencyEventInput {
  status?: 'PENDING' | 'VERIFIED' | 'FALSE_ALARM' | 'DISPATCHED' | 'RESOLVED';
  address?: string;
  dispatch_sent?: boolean;
  user_verified?: boolean;
  community_validated?: boolean;
  validation_count?: number;
  false_alarm_reported?: boolean;
}

class EmergencyEventRepository {
  async create(input: CreateEmergencyEventInput): Promise<EmergencyEvent> {
    try {
      const result = await databaseService.query<EmergencyEvent>(
        `INSERT INTO emergency_events (
          user_id, event_type, threat_level, latitude, longitude, address,
          audio_url, transcript, ai_confidence, ai_reasoning, detected_patterns,
          emotional_stress, dispatch_recommended
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          input.user_id,
          input.event_type,
          input.threat_level,
          input.latitude,
          input.longitude,
          input.address,
          input.audio_url,
          input.transcript,
          input.ai_confidence,
          input.ai_reasoning,
          input.detected_patterns,
          input.emotional_stress,
          input.dispatch_recommended || false,
        ]
      );

      logger.info('Emergency event created', { eventId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create emergency event', { error, input });
      throw error;
    }
  }

  async findById(id: string): Promise<EmergencyEvent | null> {
    try {
      const result = await databaseService.query<EmergencyEvent>(
        'SELECT * FROM emergency_events WHERE id = $1',
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find emergency event', { error, id });
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<EmergencyEvent[]> {
    try {
      const result = await databaseService.query<EmergencyEvent>(
        'SELECT * FROM emergency_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to find emergency events by user', { error, userId });
      throw error;
    }
  }

  async update(id: string, input: UpdateEmergencyEventInput): Promise<EmergencyEvent> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(input.status);

        if (input.status === 'RESOLVED') {
          fields.push(`resolved_at = NOW()`);
        }
      }

      if (input.address !== undefined) {
        fields.push(`address = $${paramIndex++}`);
        values.push(input.address);
      }

      if (input.dispatch_sent !== undefined) {
        fields.push(`dispatch_sent = $${paramIndex++}`);
        values.push(input.dispatch_sent);

        if (input.dispatch_sent) {
          fields.push(`dispatch_sent_at = NOW()`);
        }
      }

      if (input.user_verified !== undefined) {
        fields.push(`user_verified = $${paramIndex++}`);
        values.push(input.user_verified);
        fields.push(`user_verified_at = NOW()`);
      }

      if (input.community_validated !== undefined) {
        fields.push(`community_validated = $${paramIndex++}`);
        values.push(input.community_validated);
      }

      if (input.validation_count !== undefined) {
        fields.push(`validation_count = $${paramIndex++}`);
        values.push(input.validation_count);
      }

      if (input.false_alarm_reported !== undefined) {
        fields.push(`false_alarm_reported = $${paramIndex++}`);
        values.push(input.false_alarm_reported);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);

      const result = await databaseService.query<EmergencyEvent>(
        `UPDATE emergency_events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Emergency event not found');
      }

      logger.info('Emergency event updated', { eventId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update emergency event', { error, id, input });
      throw error;
    }
  }

  async findRecent(limit: number = 50): Promise<EmergencyEvent[]> {
    try {
      const result = await databaseService.query<EmergencyEvent>(
        'SELECT * FROM emergency_events ORDER BY created_at DESC LIMIT $1',
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to find recent emergency events', { error, limit });
      throw error;
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<EmergencyEvent[]> {
    try {
      // Using Haversine formula for distance calculation
      const result = await databaseService.query<EmergencyEvent>(
        `SELECT *,
          (6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )) AS distance
        FROM emergency_events
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND created_at > NOW() - INTERVAL '24 hours'
        HAVING distance < $3
        ORDER BY distance
        LIMIT $4`,
        [latitude, longitude, radiusKm, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to find nearby emergency events', { error, latitude, longitude });
      throw error;
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      const result = await databaseService.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM emergency_events WHERE status = $1',
        [status]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count emergency events by status', { error, status });
      throw error;
    }
  }

  async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    verified: number;
    falseAlarms: number;
    dispatched: number;
    resolved: number;
  }> {
    try {
      const whereClause = userId ? 'WHERE user_id = $1' : '';
      const params = userId ? [userId] : [];

      const result = await databaseService.query<{
        total: string;
        pending: string;
        verified: string;
        false_alarms: string;
        dispatched: string;
        resolved: string;
      }>(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified,
          COUNT(*) FILTER (WHERE status = 'FALSE_ALARM') as false_alarms,
          COUNT(*) FILTER (WHERE status = 'DISPATCHED') as dispatched,
          COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved
        FROM emergency_events
        ${whereClause}`,
        params
      );

      const row = result.rows[0];
      return {
        total: parseInt(row.total, 10),
        pending: parseInt(row.pending, 10),
        verified: parseInt(row.verified, 10),
        falseAlarms: parseInt(row.false_alarms, 10),
        dispatched: parseInt(row.dispatched, 10),
        resolved: parseInt(row.resolved, 10),
      };
    } catch (error) {
      logger.error('Failed to get emergency event statistics', { error, userId });
      throw error;
    }
  }
}

export const emergencyEventRepository = new EmergencyEventRepository();
