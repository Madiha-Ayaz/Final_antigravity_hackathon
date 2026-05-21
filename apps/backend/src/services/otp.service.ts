import { redisService } from './redis.service';
import { encryptionService } from './encryption.service';
import { logger } from '@silentsiren/logger';

interface OTPResult {
  success: boolean;
  message: string;
  expiresIn?: number;
  attemptsRemaining?: number;
}

interface OTPData {
  otp: string;
  phoneNumber: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
}

class OTPService {
  private readonly OTP_KEY = 'otp:verification';
  private readonly OTP_RATE_LIMIT_KEY = 'otp:ratelimit';
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_SECONDS = 300; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 3600; // 1 hour
  private readonly MAX_OTP_PER_HOUR = 5;

  /**
   * Generate and send OTP to phone number
   */
  async sendOTP(phoneNumber: string, userId?: string): Promise<OTPResult> {
    try {
      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit(phoneNumber);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: rateLimitCheck.message,
        };
      }

      // Generate OTP
      const otp = encryptionService.generateOTP(this.OTP_LENGTH);

      // Store OTP in Redis
      await this.storeOTP(phoneNumber, otp);

      // Mock SMS delivery and print code to console for hackathon demo
      logger.info(`[DEMO ONLY - NATIVE OTP] Verification Code for ${phoneNumber} is: ${otp}`);

      const smsResult = { success: true };

      // Increment rate limit counter
      await this.incrementRateLimit(phoneNumber);

      logger.info('OTP sent successfully', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        userId,
      });

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: this.OTP_EXPIRY_SECONDS,
      };
    } catch (error) {
      logger.error('Failed to send OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<OTPResult> {
    try {
      // Get stored OTP data
      const otpData = await this.getOTP(phoneNumber);

      if (!otpData) {
        return {
          success: false,
          message: 'OTP not found or expired',
        };
      }

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        await this.deleteOTP(phoneNumber);
        return {
          success: false,
          message: 'OTP has expired',
        };
      }

      // Check attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        await this.deleteOTP(phoneNumber);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded',
        };
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        // Increment attempts
        otpData.attempts += 1;
        await this.updateOTPAttempts(phoneNumber, otpData);

        return {
          success: false,
          message: 'Invalid OTP',
          attemptsRemaining: this.MAX_ATTEMPTS - otpData.attempts,
        };
      }

      // OTP is valid - delete it
      await this.deleteOTP(phoneNumber);

      logger.info('OTP verified successfully', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
      });

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      logger.error('Failed to verify OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(phoneNumber: string, userId?: string): Promise<OTPResult> {
    try {
      // Delete existing OTP
      await this.deleteOTP(phoneNumber);

      // Send new OTP
      return await this.sendOTP(phoneNumber, userId);
    } catch (error) {
      logger.error('Failed to resend OTP:', error);
      return {
        success: false,
        message: 'Failed to resend OTP',
      };
    }
  }

  /**
   * Store OTP in Redis
   */
  private async storeOTP(phoneNumber: string, otp: string): Promise<void> {
    const key = `${this.OTP_KEY}:${phoneNumber}`;
    const now = Date.now();

    const otpData: OTPData = {
      otp,
      phoneNumber,
      attempts: 0,
      createdAt: now,
      expiresAt: now + this.OTP_EXPIRY_SECONDS * 1000,
    };

    await redisService.set(key, JSON.stringify(otpData), this.OTP_EXPIRY_SECONDS);
  }

  /**
   * Get OTP from Redis
   */
  private async getOTP(phoneNumber: string): Promise<OTPData | null> {
    const key = `${this.OTP_KEY}:${phoneNumber}`;
    const data = await redisService.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Update OTP attempts
   */
  private async updateOTPAttempts(phoneNumber: string, otpData: OTPData): Promise<void> {
    const key = `${this.OTP_KEY}:${phoneNumber}`;
    const ttl = Math.floor((otpData.expiresAt - Date.now()) / 1000);

    if (ttl > 0) {
      await redisService.set(key, JSON.stringify(otpData), ttl);
    }
  }

  /**
   * Delete OTP from Redis
   */
  private async deleteOTP(phoneNumber: string): Promise<void> {
    const key = `${this.OTP_KEY}:${phoneNumber}`;
    await redisService.del(key);
  }

  /**
   * Check rate limit for OTP requests
   */
  private async checkRateLimit(
    phoneNumber: string
  ): Promise<{ allowed: boolean; message: string }> {
    const key = `${this.OTP_RATE_LIMIT_KEY}:${phoneNumber}`;
    const count = await redisService.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= this.MAX_OTP_PER_HOUR) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Maximum ${this.MAX_OTP_PER_HOUR} OTP requests per hour.`,
      };
    }

    return {
      allowed: true,
      message: 'Rate limit check passed',
    };
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(phoneNumber: string): Promise<void> {
    const key = `${this.OTP_RATE_LIMIT_KEY}:${phoneNumber}`;
    const count = await redisService.incr(key);

    if (count === 1) {
      await redisService.expire(key, this.RATE_LIMIT_WINDOW);
    }
  }

  /**
   * Get remaining OTP requests
   */
  async getRemainingOTPRequests(phoneNumber: string): Promise<number> {
    const key = `${this.OTP_RATE_LIMIT_KEY}:${phoneNumber}`;
    const count = await redisService.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;
    return Math.max(0, this.MAX_OTP_PER_HOUR - currentCount);
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 4) {
      return '****';
    }
    return phoneNumber.slice(0, 2) + '****' + phoneNumber.slice(-2);
  }

  /**
   * Generate OTP for testing (only in development)
   */
  async generateTestOTP(phoneNumber: string): Promise<string | null> {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Test OTP generation attempted in production');
      return null;
    }

    const otp = encryptionService.generateOTP(this.OTP_LENGTH);
    await this.storeOTP(phoneNumber, otp);

    logger.info('Test OTP generated', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      otp, // Only log in development
    });

    return otp;
  }
}

export const otpService = new OTPService();
