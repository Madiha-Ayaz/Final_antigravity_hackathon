import { createLogger } from '@silentsiren/logger';
import { databaseService } from './database.service';
import admin from 'firebase-admin';

const logger = createLogger('firebase-neon-sync');

export interface FirebaseUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

export class FirebaseNeonSyncService {
  /**
   * Sync Firebase user to Neon database
   * Creates or updates user in Neon when they authenticate with Firebase
   */
  async syncUserToNeon(firebaseUser: FirebaseUser): Promise<string> {
    try {
      logger.info({ firebaseUid: firebaseUser.uid }, 'Syncing Firebase user to Neon');

      // Check if user already exists
      const existingUser = await databaseService.query(
        'SELECT id FROM users WHERE firebase_uid = $1',
        [firebaseUser.uid]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user
        const userId = existingUser.rows[0].id;

        await databaseService.query(
          `UPDATE users
           SET email = $1,
               full_name = $2,
               phone_number = $3,
               is_verified = $4,
               last_login_at = NOW(),
               updated_at = NOW()
           WHERE firebase_uid = $5`,
          [
            firebaseUser.email || null,
            firebaseUser.displayName || null,
            firebaseUser.phoneNumber || null,
            firebaseUser.emailVerified,
            firebaseUser.uid,
          ]
        );

        logger.info({ userId, firebaseUid: firebaseUser.uid }, 'User updated in Neon');
        return userId;
      } else {
        // Create new user
        const result = await databaseService.query(
          `INSERT INTO users (
            firebase_uid,
            email,
            full_name,
            phone_number,
            is_verified,
            last_login_at,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
          RETURNING id`,
          [
            firebaseUser.uid,
            firebaseUser.email || null,
            firebaseUser.displayName || null,
            firebaseUser.phoneNumber || null,
            firebaseUser.emailVerified,
          ]
        );

        const userId = result.rows[0].id;
        logger.info({ userId, firebaseUid: firebaseUser.uid }, 'User created in Neon');
        return userId;
      }
    } catch (error) {
      logger.error({ error, firebaseUid: firebaseUser.uid }, 'Failed to sync user to Neon');
      throw error;
    }
  }

  /**
   * Get Neon user ID from Firebase UID
   */
  async getNeonUserId(firebaseUid: string): Promise<string | null> {
    try {
      const result = await databaseService.query('SELECT id FROM users WHERE firebase_uid = $1', [
        firebaseUid,
      ]);

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      return null;
    } catch (error) {
      logger.error({ error, firebaseUid }, 'Failed to get Neon user ID');
      return null;
    }
  }

  /**
   * Verify Firebase token and sync user
   */
  async verifyAndSyncUser(idToken: string): Promise<{ userId: string; firebaseUid: string }> {
    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Get full user data from Firebase
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);

      // Sync to Neon
      const userId = await this.syncUserToNeon({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
      });

      return {
        userId,
        firebaseUid: firebaseUser.uid,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to verify and sync user');
      throw error;
    }
  }

  /**
   * Bulk sync all Firebase users to Neon (for migration)
   */
  async bulkSyncUsers(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      logger.info('Starting bulk sync of Firebase users to Neon');

      // List all Firebase users
      const listUsersResult = await admin.auth().listUsers(1000);

      for (const user of listUsersResult.users) {
        try {
          await this.syncUserToNeon({
            uid: user.uid,
            email: user.email,
            phoneNumber: user.phoneNumber,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          });
          synced++;
        } catch (error) {
          logger.error({ error, uid: user.uid }, 'Failed to sync user');
          failed++;
        }
      }

      logger.info({ synced, failed }, 'Bulk sync complete');
      return { synced, failed };
    } catch (error) {
      logger.error({ error }, 'Bulk sync failed');
      throw error;
    }
  }
}

export const firebaseNeonSyncService = new FirebaseNeonSyncService();
