import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { auditService } from '../services/audit.service';
import { z } from 'zod';

const router = Router();
const logger = createLogger('audit-routes');

/**
 * GET /api/audit/logs
 * Get audit logs with pagination
 */
router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await auditService.getLogs(limit, offset);

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch audit logs');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch audit logs',
      },
    });
  }
});

/**
 * GET /api/audit/logs/user/:userId
 * Get audit logs for specific user
 */
router.get('/logs/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await auditService.getUserLogs(userId, limit, offset);

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        userId,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch user audit logs');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch user audit logs',
      },
    });
  }
});

/**
 * GET /api/audit/logs/:logId
 * Get specific audit log
 */
router.get('/logs/:logId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { logId } = req.params;

    const log = await auditService.getLog(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Audit log not found',
        },
      });
    }

    res.json({
      success: true,
      data: log,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch audit log');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch audit log',
      },
    });
  }
});

/**
 * GET /api/audit/statistics
 * Get audit statistics
 */
router.get('/statistics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await auditService.getStatistics(startDate, endDate);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch audit statistics');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch audit statistics',
      },
    });
  }
});

export default router;
