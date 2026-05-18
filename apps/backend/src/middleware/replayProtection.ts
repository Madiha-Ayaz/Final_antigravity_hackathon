import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';
import { encryptionService } from '../services/encryption.service';
import { logger } from '@silentsiren/logger';

interface RequestSignature {
  timestamp: number;
  nonce: string;
  signature: string;
  body: string;
}

class ReplayProtectionService {
  private readonly NONCE_KEY = 'replay:nonce';
  private readonly MAX_REQUEST_AGE_MS = 300000; // 5 minutes
  private readonly NONCE_TTL_SECONDS = 600; // 10 minutes

  /**
   * Check if nonce has been used
   */
  async isNonceUsed(nonce: string): Promise<boolean> {
    const key = `${this.NONCE_KEY}:${nonce}`;
    return await redisService.exists(key);
  }

  /**
   * Mark nonce as used
   */
  async markNonceUsed(nonce: string): Promise<void> {
    const key = `${this.NONCE_KEY}:${nonce}`;
    await redisService.set(key, '1', this.NONCE_TTL_SECONDS);
  }

  /**
   * Validate request timestamp
   */
  validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const age = now - timestamp;

    // Check if timestamp is not in the future
    if (age < 0) {
      return false;
    }

    // Check if timestamp is not too old
    if (age > this.MAX_REQUEST_AGE_MS) {
      return false;
    }

    return true;
  }

  /**
   * Validate request signature
   */
  validateSignature(
    method: string,
    path: string,
    timestamp: number,
    nonce: string,
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const data = `${method}:${path}:${timestamp}:${nonce}:${body}`;
    return encryptionService.verifySignature(data, signature, secret);
  }

  /**
   * Generate request signature
   */
  generateSignature(
    method: string,
    path: string,
    timestamp: number,
    nonce: string,
    body: string,
    secret: string
  ): string {
    const data = `${method}:${path}:${timestamp}:${nonce}:${body}`;
    return encryptionService.sign(data, secret);
  }
}

export const replayProtectionService = new ReplayProtectionService();

/**
 * Middleware to prevent replay attacks
 */
export const replayProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for GET requests (idempotent)
    if (req.method === 'GET') {
      next();
      return;
    }

    // Get signature headers
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];
    const signature = req.headers['x-signature'];

    if (!timestamp || !nonce || !signature) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Request signature headers are required',
        },
        timestamp: new Date(),
      });
      return;
    }

    const timestampNum = parseInt(timestamp as string, 10);

    // Validate timestamp
    if (!replayProtectionService.validateTimestamp(timestampNum)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIMESTAMP',
          message: 'Request timestamp is invalid or expired',
        },
        timestamp: new Date(),
      });
      return;
    }

    // Check if nonce has been used
    const nonceUsed = await replayProtectionService.isNonceUsed(nonce as string);
    if (nonceUsed) {
      logger.warn('Replay attack detected', {
        nonce,
        timestamp,
        path: req.path,
        ip: req.ip,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'REPLAY_DETECTED',
          message: 'Request has already been processed',
        },
        timestamp: new Date(),
      });
      return;
    }

    // Validate signature
    const body = JSON.stringify(req.body || {});
    const secret = process.env.JWT_SECRET || '';

    const isValid = replayProtectionService.validateSignature(
      req.method,
      req.path,
      timestampNum,
      nonce as string,
      body,
      signature as string,
      secret
    );

    if (!isValid) {
      logger.warn('Invalid request signature', {
        nonce,
        timestamp,
        path: req.path,
        ip: req.ip,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Request signature is invalid',
        },
        timestamp: new Date(),
      });
      return;
    }

    // Mark nonce as used
    await replayProtectionService.markNonceUsed(nonce as string);

    next();
  } catch (error) {
    logger.error('Replay protection middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate request',
      },
      timestamp: new Date(),
    });
  }
};

/**
 * Optional replay protection - doesn't fail if headers missing
 */
export const optionalReplayProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];
    const signature = req.headers['x-signature'];

    // If headers present, validate them
    if (timestamp && nonce && signature) {
      const timestampNum = parseInt(timestamp as string, 10);

      if (
        !replayProtectionService.validateTimestamp(timestampNum) ||
        (await replayProtectionService.isNonceUsed(nonce as string))
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request validation failed',
          },
          timestamp: new Date(),
        });
        return;
      }

      await replayProtectionService.markNonceUsed(nonce as string);
    }

    next();
  } catch (error) {
    logger.error('Optional replay protection error:', error);
    next();
  }
};
