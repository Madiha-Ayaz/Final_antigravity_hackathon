import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '@silentsiren/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        deviceId?: string;
        sessionId?: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        },
        timestamp: new Date(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = await authService.verifyAccessToken(token);

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        deviceId: decoded.deviceId,
        sessionId: decoded.sessionId,
      };

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message,
        },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
      timestamp: new Date(),
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = await authService.verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
          deviceId: decoded.deviceId,
          sessionId: decoded.sessionId,
        };
      } catch (error) {
        // Silently fail - user remains unauthenticated
        logger.debug('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};
