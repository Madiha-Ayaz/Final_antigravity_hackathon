import { databaseService } from '../services/database.service';
import { createLogger } from '@silentsiren/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

const logger = createLogger('db-init');

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database schema...');

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await databaseService.query(schema);

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema', { error });
    throw error;
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await databaseService.connect();
    const health = await databaseService.healthCheck();

    if (health.status === 'up') {
      logger.info('Database connection verified', { responseTime: health.responseTime });
      return true;
    } else {
      logger.error('Database health check failed', { message: health.message });
      return false;
    }
  } catch (error) {
    logger.error('Database connection check failed', { error });
    return false;
  }
}
