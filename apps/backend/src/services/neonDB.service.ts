import { Pool } from 'pg';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('neon-db-service');

class NeonDBService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.initTables().catch(err => {
      logger.error({ error: err }, 'Failed to initialize Neon DB tables');
    });
  }

  /**
   * Initialize all required tables
   */
  async initTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          action VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          target_user_id VARCHAR(255),
          resource_id VARCHAR(255),
          resource_type VARCHAR(100),
          ip_address VARCHAR(50),
          user_agent TEXT,
          device_id VARCHAR(255),
          session_id VARCHAR(255),
          status VARCHAR(20) DEFAULT 'success',
          metadata JSONB,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Dispatch logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dispatch_logs (
          id SERIAL PRIMARY KEY,
          event_id VARCHAR(255),
          user_id VARCHAR(255),
          dispatch_type VARCHAR(50) NOT NULL,
          recipient_phone VARCHAR(50),
          recipient_name VARCHAR(255),
          message TEXT,
          threat_level VARCHAR(50),
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          status VARCHAR(50) DEFAULT 'sent',
          provider VARCHAR(50),
          provider_message_id VARCHAR(255),
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Community validation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS community_validations (
          id SERIAL PRIMARY KEY,
          alert_id INTEGER,
          user_id VARCHAR(255) NOT NULL,
          validator_id VARCHAR(255),
          validation_type VARCHAR(50) NOT NULL,
          is_valid BOOLEAN,
          confidence DECIMAL(5,4),
          comment TEXT,
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Emergency events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS emergency_events (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          event_type VARCHAR(50) NOT NULL,
          threat_level VARCHAR(50) NOT NULL,
          confidence DECIMAL(5,4),
          transcript TEXT,
          reasoning TEXT,
          category VARCHAR(50),
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          address TEXT,
          audio_url TEXT,
          contacts_notified INTEGER DEFAULT 0,
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          sms_sent BOOLEAN DEFAULT FALSE,
          call_made BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'active',
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Voice alerts table (if not exists)
      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_alerts (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          transcript TEXT,
          threat_level VARCHAR(50),
          confidence DECIMAL(5,4),
          category VARCHAR(50),
          reasoning TEXT,
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      logger.info('All Neon DB tables initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize tables');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log audit event
   */
  async logAudit(data: {
    action: string;
    userId?: string;
    targetUserId?: string;
    resourceId?: string;
    resourceType?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    sessionId?: string;
    status?: string;
    metadata?: any;
    errorMessage?: string;
  }): Promise<number> {
    try {
      const result = await this.pool.query(
        `INSERT INTO audit_logs (action, user_id, target_user_id, resource_id, resource_type, ip_address, user_agent, device_id, session_id, status, metadata, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          data.action,
          data.userId || null,
          data.targetUserId || null,
          data.resourceId || null,
          data.resourceType || null,
          data.ipAddress || null,
          data.userAgent || null,
          data.deviceId || null,
          data.sessionId || null,
          data.status || 'success',
          data.metadata ? JSON.stringify(data.metadata) : null,
          data.errorMessage || null,
        ]
      );
      return result.rows[0].id;
    } catch (error) {
      logger.error({ error }, 'Failed to log audit');
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit = 50, offset = 0, userId?: string): Promise<any[]> {
    try {
      let query = 'SELECT * FROM audit_logs';
      const params: any[] = [];

      if (userId) {
        query += ' WHERE user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get audit logs');
      return [];
    }
  }

  /**
   * Log dispatch event
   */
  async logDispatch(data: {
    eventId?: string;
    userId?: string;
    dispatchType: string;
    recipientPhone?: string;
    recipientName?: string;
    message?: string;
    threatLevel?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    provider?: string;
    providerMessageId?: string;
    errorMessage?: string;
  }): Promise<number> {
    try {
      const result = await this.pool.query(
        `INSERT INTO dispatch_logs (event_id, user_id, dispatch_type, recipient_phone, recipient_name, message, threat_level, latitude, longitude, status, provider, provider_message_id, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          data.eventId || null,
          data.userId || null,
          data.dispatchType,
          data.recipientPhone || null,
          data.recipientName || null,
          data.message || null,
          data.threatLevel || null,
          data.latitude || null,
          data.longitude || null,
          data.status || 'sent',
          data.provider || null,
          data.providerMessageId || null,
          data.errorMessage || null,
        ]
      );
      return result.rows[0].id;
    } catch (error) {
      logger.error({ error }, 'Failed to log dispatch');
      throw error;
    }
  }

  /**
   * Get dispatch logs
   */
  async getDispatchLogs(limit = 50, offset = 0): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM dispatch_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get dispatch logs');
      return [];
    }
  }

  /**
   * Add community validation
   */
  async addValidation(data: {
    alertId?: number;
    userId: string;
    validatorId?: string;
    validationType: string;
    isValid?: boolean;
    confidence?: number;
    comment?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<number> {
    try {
      const result = await this.pool.query(
        `INSERT INTO community_validations (alert_id, user_id, validator_id, validation_type, is_valid, confidence, comment, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          data.alertId || null,
          data.userId,
          data.validatorId || null,
          data.validationType,
          data.isValid !== undefined ? data.isValid : null,
          data.confidence || null,
          data.comment || null,
          data.latitude || null,
          data.longitude || null,
        ]
      );
      return result.rows[0].id;
    } catch (error) {
      logger.error({ error }, 'Failed to add validation');
      throw error;
    }
  }

  /**
   * Get community validations
   */
  async getValidations(alertId?: number, limit = 50): Promise<any[]> {
    try {
      let query = 'SELECT * FROM community_validations';
      const params: any[] = [];

      if (alertId) {
        query += ' WHERE alert_id = $1';
        params.push(alertId);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get validations');
      return [];
    }
  }

  /**
   * Create emergency event
   */
  async createEmergencyEvent(data: {
    userId?: string;
    eventType: string;
    threatLevel: string;
    confidence?: number;
    transcript?: string;
    reasoning?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    audioUrl?: string;
    contactsNotified?: number;
    whatsappSent?: boolean;
    smsSent?: boolean;
    callMade?: boolean;
  }): Promise<number> {
    try {
      const result = await this.pool.query(
        `INSERT INTO emergency_events (user_id, event_type, threat_level, confidence, transcript, reasoning, category, latitude, longitude, address, audio_url, contacts_notified, whatsapp_sent, sms_sent, call_made)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        [
          data.userId || null,
          data.eventType,
          data.threatLevel,
          data.confidence || null,
          data.transcript || null,
          data.reasoning || null,
          data.category || null,
          data.latitude || null,
          data.longitude || null,
          data.address || null,
          data.audioUrl || null,
          data.contactsNotified || 0,
          data.whatsappSent || false,
          data.smsSent || false,
          data.callMade || false,
        ]
      );
      logger.info({ eventId: result.rows[0].id }, 'Emergency event created in Neon DB');
      return result.rows[0].id;
    } catch (error) {
      logger.error({ error }, 'Failed to create emergency event');
      throw error;
    }
  }

  /**
   * Get emergency events
   */
  async getEmergencyEvents(limit = 50, offset = 0, userId?: string): Promise<any[]> {
    try {
      let query = 'SELECT * FROM emergency_events';
      const params: any[] = [];

      if (userId) {
        query += ' WHERE user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error({ error }, 'Failed to get emergency events');
      return [];
    }
  }

  /**
   * Update emergency event status
   */
  async updateEventStatus(eventId: number, status: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE emergency_events SET status = $1, resolved_at = CASE WHEN $1 = \'resolved\' THEN NOW() ELSE resolved_at END WHERE id = $2',
        [status, eventId]
      );
    } catch (error) {
      logger.error({ error }, 'Failed to update event status');
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [events, audits, dispatches, validations] = await Promise.all([
        this.pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'active\' THEN 1 END) as active FROM emergency_events'),
        this.pool.query('SELECT COUNT(*) as total FROM audit_logs'),
        this.pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'sent\' THEN 1 END) as sent FROM dispatch_logs'),
        this.pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_valid = true THEN 1 END) as valid FROM community_validations'),
      ]);

      return {
        emergencyEvents: parseInt(events.rows[0].total),
        activeEvents: parseInt(events.rows[0].active),
        auditLogs: parseInt(audits.rows[0].total),
        dispatchLogs: parseInt(dispatches.rows[0].total),
        successfulDispatches: parseInt(dispatches.rows[0].sent),
        communityValidations: parseInt(validations.rows[0].total),
        validValidations: parseInt(validations.rows[0].valid),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get statistics');
      return {};
    }
  }
}

export const neonDBService = new NeonDBService();
