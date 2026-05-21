import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@silentsiren/config';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Optional authentication middleware
 * - If token provided, validates it
 * - If no token, uses default test user ID
 * - Useful for testing without login
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Token provided, validate it
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } else {
      // No token, use default test user ID
      req.userId = 'test-user-001';
      console.log('⚠️ No auth token provided, using test user ID:', req.userId);
    }

    next();
  } catch (error) {
    // If token is invalid, fall back to test user
    req.userId = 'test-user-001';
    console.log('⚠️ Invalid token, using test user ID:', req.userId);
    next();
  }
};
