import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { abuseAnalyticsService } from '../services/abuseAnalytics.service';
import { z } from 'zod';

const router = Router();
const logger = createLogger('abuse-routes');

/**
 * GET /api/abuse/metrics
 * Get abuse metrics for time period
 */
router.get('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const metrics = await abuseAnalyticsService.getMetrics(startDate, endDate);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch abuse metrics');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch abuse metrics',
      },
    });
  }
});

/**
 * GET /api/abuse/user/:userId
 * Analyze user behavior patterns
 */
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const pattern = await abuseAnalyticsService.analyzeUserBehavior(userId);

    res.json({
      success: true,
      data: pattern,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to analyze user behavior');
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze user behavior',
      },
    });
  }
});

/**
 * GET /api/abuse/alerts
 * Get recent abuse alerts
 */
router.get('/alerts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const alerts = await abuseAnalyticsService.getAlerts(limit);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch abuse alerts');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch abuse alerts',
      },
    });
  }
});

/**
 * GET /api/abuse/summary
 * Get abuse statistics summary
 */
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await abuseAnalyticsService.getSummary();

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch abuse summary');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch abuse summary',
      },
    });
  }
});

/**
 * POST /api/abuse/detect-attacks
 * Detect coordinated attacks
 */
router.post('/detect-attacks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await abuseAnalyticsService.detectCoordinatedAttacks();

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to detect coordinated attacks');
    res.status(500).json({
      success: false,
      error: {
        code: 'DETECTION_FAILED',
        message: 'Failed to detect coordinated attacks',
      },
    });
  }
});

export default router;
