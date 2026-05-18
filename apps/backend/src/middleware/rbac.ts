import { Request, Response, NextFunction } from 'express';
import { Permission, ROLE_PERMISSIONS } from '@silentsiren/shared-types';
import { logger } from '@silentsiren/logger';

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
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

    const userRole = req.user.role as keyof typeof ROLE_PERMISSIONS;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        role: userRole,
        requiredPermissions,
        userPermissions,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: {
            required: requiredPermissions,
            missing: requiredPermissions.filter((p) => !userPermissions.includes(p)),
          },
        },
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (...requiredPermissions: Permission[]) => {
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

    const userRole = req.user.role as keyof typeof ROLE_PERMISSIONS;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Check if user has at least one required permission
    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        role: userRole,
        requiredPermissions,
      });

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
 * Check if user can access resource owned by another user
 */
export const canAccessResource = (resourceUserId: string, req: Request): boolean => {
  if (!req.user) {
    return false;
  }

  // User can access their own resources
  if (req.user.userId === resourceUserId) {
    return true;
  }

  // Admins and moderators can access any resource
  const userRole = req.user.role;
  return userRole === 'admin' || userRole === 'superadmin' || userRole === 'moderator';
};

/**
 * Middleware to check resource ownership
 */
export const requireOwnership = (getUserIdFromRequest: (req: Request) => string) => {
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

    const resourceUserId = getUserIdFromRequest(req);

    if (!canAccessResource(resourceUserId, req)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};
