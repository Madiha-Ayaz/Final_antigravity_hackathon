import { databaseService } from '../services/database.service';
import { createLogger } from '@silentsiren/logger';
import bcrypt from 'bcrypt';

const logger = createLogger('user-repository');

export interface User {
  id: string;
  phone_number: string;
  email?: string;
  full_name?: string;
  is_verified: boolean;
  device_fingerprint?: string;
  biometric_enabled: boolean;
  reputation_score: number;
  trust_level: string;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  is_active: boolean;
}

export interface CreateUserInput {
  phone_number: string;
  email?: string;
  full_name?: string;
  password?: string;
  device_fingerprint?: string;
}

export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  is_verified?: boolean;
  biometric_enabled?: boolean;
  device_fingerprint?: string;
}

class UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    try {
      const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;

      const result = await databaseService.query<User>(
        `INSERT INTO users (phone_number, email, full_name, password_hash, device_fingerprint)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.phone_number, input.email, input.full_name, passwordHash, input.device_fingerprint]
      );

      logger.info('User created', { userId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create user', { error, input });
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await databaseService.query<User>(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by id', { error, id });
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      const result = await databaseService.query<User>(
        'SELECT * FROM users WHERE phone_number = $1 AND is_active = true',
        [phoneNumber]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by phone', { error, phoneNumber });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await databaseService.query<User>(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(input.email);
      }
      if (input.full_name !== undefined) {
        fields.push(`full_name = $${paramIndex++}`);
        values.push(input.full_name);
      }
      if (input.is_verified !== undefined) {
        fields.push(`is_verified = $${paramIndex++}`);
        values.push(input.is_verified);
      }
      if (input.biometric_enabled !== undefined) {
        fields.push(`biometric_enabled = $${paramIndex++}`);
        values.push(input.biometric_enabled);
      }
      if (input.device_fingerprint !== undefined) {
        fields.push(`device_fingerprint = $${paramIndex++}`);
        values.push(input.device_fingerprint);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);

      const result = await databaseService.query<User>(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      logger.info('User updated', { userId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update user', { error, id, input });
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await databaseService.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
    } catch (error) {
      logger.error('Failed to update last login', { error, id });
      throw error;
    }
  }

  async updateReputationScore(id: string, score: number): Promise<void> {
    try {
      await databaseService.query('UPDATE users SET reputation_score = $1 WHERE id = $2', [
        score,
        id,
      ]);
    } catch (error) {
      logger.error('Failed to update reputation score', { error, id, score });
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      await databaseService.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
      logger.info('User deactivated', { userId: id });
    } catch (error) {
      logger.error('Failed to deactivate user', { error, id });
      throw error;
    }
  }

  async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      const result = await databaseService.query<User>(
        'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to list users', { error, limit, offset });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const result = await databaseService.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count users', { error });
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
