import fs from 'fs';
import path from 'path';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('audio-storage-service');

export class AudioStorageService {
  private storageDir: string;

  constructor() {
    // Store audio files in public directory
    this.storageDir = path.join(__dirname, '../../public/emergency-audio');
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      logger.info('Created audio storage directory', { path: this.storageDir });
    }
  }

  /**
   * Save emergency audio file
   */
  async saveEmergencyAudio(
    userId: string,
    audioBuffer: Buffer,
    sessionId: string,
    format: string = 'wav'
  ): Promise<{ filePath: string; publicUrl: string }> {
    try {
      const fileName = `${userId}_${sessionId}_${Date.now()}.${format}`;
      const filePath = path.join(this.storageDir, fileName);

      // Write audio file to disk
      fs.writeFileSync(filePath, audioBuffer);

      // Generate public URL
      const publicUrl = `${process.env.APP_URL || 'http://localhost:3001'}/emergency-audio/${fileName}`;

      logger.info('Emergency audio saved', { userId, sessionId, fileName });

      return { filePath, publicUrl };
    } catch (error) {
      logger.error('Failed to save emergency audio', { error, userId, sessionId });
      throw error;
    }
  }

  /**
   * Get audio file by session ID
   */
  async getAudioBySessionId(
    sessionId: string
  ): Promise<{ filePath: string; publicUrl: string } | null> {
    try {
      const files = fs.readdirSync(this.storageDir);
      const audioFile = files.find((file) => file.includes(sessionId));

      if (!audioFile) {
        logger.warn('Audio file not found', { sessionId });
        return null;
      }

      const filePath = path.join(this.storageDir, audioFile);
      const publicUrl = `${process.env.APP_URL || 'http://localhost:3001'}/emergency-audio/${audioFile}`;

      return { filePath, publicUrl };
    } catch (error) {
      logger.error('Failed to get audio file', { error, sessionId });
      return null;
    }
  }

  /**
   * Delete old audio files (cleanup)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const files = fs.readdirSync(this.storageDir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info('Cleaned up old audio files', { deletedCount, daysOld });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files', { error });
      return 0;
    }
  }

  /**
   * Get audio file buffer
   */
  async getAudioBuffer(sessionId: string): Promise<Buffer | null> {
    const audio = await this.getAudioBySessionId(sessionId);
    if (!audio) return null;

    try {
      return fs.readFileSync(audio.filePath);
    } catch (error) {
      logger.error('Failed to read audio buffer', { error, sessionId });
      return null;
    }
  }

  /**
   * Check if audio exists
   */
  async audioExists(sessionId: string): Promise<boolean> {
    const audio = await this.getAudioBySessionId(sessionId);
    return audio !== null;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): { totalFiles: number; totalSize: number } {
    try {
      const files = fs.readdirSync(this.storageDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      return {
        totalFiles: files.length,
        totalSize, // in bytes
      };
    } catch (error) {
      logger.error('Failed to get storage stats', { error });
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

export const audioStorageService = new AudioStorageService();
