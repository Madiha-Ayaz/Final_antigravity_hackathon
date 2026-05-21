import { Request, Response, NextFunction } from 'express';
import { antigravityTraceLogger } from '../services/antigravity/traceLogger';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('trace-middleware');

export interface TraceContext {
  traceId?: string;
  startTime: number;
  userId?: string;
  sessionId?: string;
}

// Extend Express Request to include trace context
declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext;
    }
  }
}

/**
 * Middleware to automatically trace API requests
 */
export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip tracing for health checks and static assets
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path.startsWith('/static') ||
    req.path.startsWith('/_next')
  ) {
    return next();
  }

  const startTime = Date.now();

  // Extract trace ID from header or create new one
  const existingTraceId = req.headers['x-trace-id'] as string;
  const traceId = existingTraceId || undefined;

  // Extract user info from auth
  const userId = (req as any).userId;
  const sessionId = req.headers['x-session-id'] as string;

  // Attach trace context to request
  req.traceContext = {
    traceId,
    startTime,
    userId,
    sessionId,
  };

  // Log API request event if trace exists
  if (traceId) {
    antigravityTraceLogger.logEvent(traceId, {
      eventType: 'EMERGENCY_RESPONSE',
      severity: 'LOW',
      data: {
        type: 'API_REQUEST',
        method: req.method,
        path: req.path,
        query: req.query,
        headers: {
          userAgent: req.headers['user-agent'],
          contentType: req.headers['content-type'],
        },
      },
      metadata: {
        userId,
        sessionId,
        source: 'api',
      },
    });
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    // Log API response if trace exists
    if (traceId) {
      antigravityTraceLogger.logEvent(traceId, {
        eventType: 'EMERGENCY_RESPONSE',
        severity: res.statusCode >= 400 ? 'HIGH' : 'LOW',
        data: {
          type: 'API_RESPONSE',
          statusCode: res.statusCode,
          duration,
          success: res.statusCode < 400,
        },
        metadata: {
          userId,
          sessionId,
          source: 'api',
          duration,
        },
      });
    }

    logger.debug('API request traced', {
      traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to start a new trace session for emergency endpoints
 */
export function emergencyTraceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to emergency trigger endpoints
  if (!req.path.includes('/emergency/trigger')) {
    return next();
  }

  const userId = (req as any).userId;
  const sessionId = req.headers['x-session-id'] as string;

  // Start new trace session
  const traceId = antigravityTraceLogger.startSession({
    userId,
    sessionId,
  });

  // Attach to request
  if (req.traceContext) {
    req.traceContext.traceId = traceId;
  } else {
    req.traceContext = {
      traceId,
      startTime: Date.now(),
      userId,
      sessionId,
    };
  }

  // Add trace ID to response headers
  res.setHeader('X-Trace-Id', traceId);

  logger.info('Started emergency trace session', {
    traceId,
    userId,
    path: req.path,
  });

  next();
}

/**
 * Error handling middleware with tracing
 */
export function traceErrorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const traceId = req.traceContext?.traceId;

  if (traceId) {
    antigravityTraceLogger.logEvent(traceId, {
      eventType: 'EMERGENCY_RESPONSE',
      severity: 'CRITICAL',
      data: {
        type: 'API_ERROR',
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      },
      metadata: {
        userId: req.traceContext?.userId,
        sessionId: req.traceContext?.sessionId,
        source: 'api',
      },
    });

    logger.error('API error traced', {
      traceId,
      error: error.message,
      path: req.path,
    });
  }

  next(error);
}
