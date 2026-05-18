import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '@silentsiren/config';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('database');

class DatabaseService {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.pool.on('connect', () => {
        logger.info('New database client connected');
      });

      this.pool.on('error', (err: Error) => {
        logger.error('Unexpected database error', { error: err });
      });

      logger.info('Database pool initialized');
    } catch (error) {
      logger.error('Failed to initialize database pool', { error });
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      if (!this.pool) {
        throw new Error('Database pool not initialized');
      }

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database', { error });
      throw error;
    }
  }

  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug('Query executed', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Query failed', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.pool !== null;
  }

  async healthCheck(): Promise<{ status: 'up' | 'down'; responseTime: number; message?: string }> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        return {
          status: 'down',
          responseTime: Date.now() - startTime,
          message: 'Database pool not initialized',
        };
      }

      await this.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const databaseService = new DatabaseService();
