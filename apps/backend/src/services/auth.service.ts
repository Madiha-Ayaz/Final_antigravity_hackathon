import jwt from 'jsonwebtoken';
import { logger } from '@silentsiren/logger';
import { redisService } from './redis.service';

interface TokenPayload {
  userId: string;
  role: string;
  deviceId?: string;
  sessionId?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
  jti?: string;
  type?: 'access' | 'refresh';
}

class AuthService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry = '15m'; // 15 minutes
  private refreshTokenExpiry = '7d'; // 7 days
  private readonly REFRESH_TOKEN_KEY = 'auth:refresh';
  private readonly BLACKLIST_KEY = 'auth:blacklist';
  private readonly SESSION_KEY = 'auth:session';

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || '';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '';

    if (!this.accessTokenSecret || this.accessTokenSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    try {
      const sessionId = this.generateSessionId();
      const jti = this.generateJti();

      // Generate access token
      const accessToken = jwt.sign(
        {
          ...payload,
          sessionId,
          type: 'access',
        },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry,
          jwtid: jti,
        } as jwt.SignOptions
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          userId: payload.userId,
          sessionId,
          type: 'refresh',
        },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
        } as jwt.SignOptions
      );

      // Store refresh token in Redis
      await this.storeRefreshToken(payload.userId, refreshToken, sessionId);

      // Store session info
      await this.storeSession(sessionId, payload);

      const expiresIn = this.getExpirySeconds(this.accessTokenExpiry);

      logger.info('Token pair generated', {
        userId: payload.userId,
        sessionId,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<DecodedToken> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, this.accessTokenSecret) as DecodedToken;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Verify session is still active
      const sessionActive = await this.isSessionActive(decoded.sessionId || '');
      if (!sessionActive) {
        throw new Error('Session has expired');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<DecodedToken> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as DecodedToken;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const storedToken = await redisService.hGet(
        `${this.REFRESH_TOKEN_KEY}:${decoded.userId}`,
        decoded.sessionId || ''
      );

      if (!storedToken || storedToken !== token) {
        throw new Error('Refresh token not found or invalid');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Get session info
      const sessionData = await this.getSession(decoded.sessionId || '');
      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Generate new token pair
      return await this.generateTokenPair(sessionData);
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as DecodedToken;
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
      }

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisService.set(`${this.BLACKLIST_KEY}:${token}`, '1', ttl);
      }

      logger.info('Token revoked', { userId: decoded.userId });
    } catch (error) {
      logger.error('Failed to revoke token:', error);
      throw error;
    }
  }

  /**
   * Logout user (revoke all tokens for session)
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    try {
      // Remove refresh token
      await redisService.hDel(`${this.REFRESH_TOKEN_KEY}:${userId}`, sessionId);

      // Remove session
      await redisService.del(`${this.SESSION_KEY}:${sessionId}`);

      logger.info('User logged out', { userId, sessionId });
    } catch (error) {
      logger.error('Failed to logout user:', error);
      throw error;
    }
  }

  /**
   * Logout user from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens
      await redisService.del(`${this.REFRESH_TOKEN_KEY}:${userId}`);

      // Get all sessions for user and remove them
      // Note: This is a simplified version. In production, you'd want to track all sessions
      logger.info('User logged out from all devices', { userId });
    } catch (error) {
      logger.error('Failed to logout user from all devices:', error);
      throw error;
    }
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(userId: string, token: string, sessionId: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_KEY}:${userId}`;
    await redisService.hSet(key, sessionId, token);
    await redisService.expire(key, 7 * 86400); // 7 days
  }

  /**
   * Store session info
   */
  private async storeSession(sessionId: string, payload: TokenPayload): Promise<void> {
    const key = `${this.SESSION_KEY}:${sessionId}`;
    await redisService.set(key, JSON.stringify(payload), 7 * 86400); // 7 days
  }

  /**
   * Get session info
   */
  private async getSession(sessionId: string): Promise<TokenPayload | null> {
    const key = `${this.SESSION_KEY}:${sessionId}`;
    const data = await redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Check if session is active
   */
  private async isSessionActive(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;
    const key = `${this.SESSION_KEY}:${sessionId}`;
    return await redisService.exists(key);
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_KEY}:${token}`;
    return await redisService.exists(key);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate JWT ID
   */
  private generateJti(): string {
    return `jti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get expiry in seconds from string format
   */
  private getExpirySeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // 15 minutes default
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      return jwt.decode(token) as DecodedToken;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
