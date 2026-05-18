import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { antigravityTraceLogger } from '../services/antigravity/traceLogger';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const router = Router();
const logger = createLogger('trace-routes');

/**
 * GET /api/traces/active
 * Get all active trace sessions
 */
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const activeSessions = antigravityTraceLogger.getActiveSessions();

    res.json({
      success: true,
      data: {
        sessions: activeSessions,
        count: activeSessions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch active traces');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch active traces',
      },
    });
  }
});

/**
 * GET /api/traces/:traceId
 * Get specific trace session
 */
router.get('/:traceId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { traceId } = req.params;

    // Check active sessions first
    const activeSession = antigravityTraceLogger.getSession(traceId);
    if (activeSession) {
      return res.json({
        success: true,
        data: activeSession,
        timestamp: new Date().toISOString(),
      });
    }

    // Check saved traces
    const tracesDir = join(process.cwd(), '..', '..', 'antigravity-logs', 'traces');
    const files = readdirSync(tracesDir);
    const traceFile = files.find((f) => f.includes(traceId) && f.endsWith('.json'));

    if (!traceFile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACE_NOT_FOUND',
          message: 'Trace session not found',
        },
      });
    }

    const traceData = JSON.parse(readFileSync(join(tracesDir, traceFile), 'utf-8'));

    res.json({
      success: true,
      data: traceData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch trace');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch trace',
      },
    });
  }
});

/**
 * GET /api/traces
 * Get all saved traces (paginated)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const tracesDir = join(process.cwd(), '..', '..', 'antigravity-logs', 'traces');
    const files = readdirSync(tracesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({
        filename: f,
        path: join(tracesDir, f),
        stats: statSync(join(tracesDir, f)),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    const paginatedFiles = files.slice(offset, offset + limit);

    const traces = paginatedFiles.map((file) => {
      const data = JSON.parse(readFileSync(file.path, 'utf-8'));
      return {
        traceId: data.traceId,
        sessionStart: data.sessionStart,
        sessionEnd: data.sessionEnd,
        summary: data.summary,
        filename: file.filename,
        createdAt: file.stats.mtime,
      };
    });

    res.json({
      success: true,
      data: {
        traces,
        total: files.length,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch traces');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch traces',
      },
    });
  }
});

/**
 * GET /api/traces/:traceId/events
 * Get events for a specific trace
 */
router.get('/:traceId/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { traceId } = req.params;
    const eventType = req.query.eventType as string;
    const severity = req.query.severity as string;

    // Get trace
    const activeSession = antigravityTraceLogger.getSession(traceId);
    let events = activeSession?.events || [];

    if (!activeSession) {
      // Load from file
      const tracesDir = join(process.cwd(), '..', '..', 'antigravity-logs', 'traces');
      const files = readdirSync(tracesDir);
      const traceFile = files.find((f) => f.includes(traceId) && f.endsWith('.json'));

      if (traceFile) {
        const traceData = JSON.parse(readFileSync(join(tracesDir, traceFile), 'utf-8'));
        events = traceData.events || [];
      }
    }

    // Filter events
    let filteredEvents = events;
    if (eventType) {
      filteredEvents = filteredEvents.filter((e) => e.eventType === eventType);
    }
    if (severity) {
      filteredEvents = filteredEvents.filter((e) => e.severity === severity);
    }

    res.json({
      success: true,
      data: {
        events: filteredEvents,
        count: filteredEvents.length,
        filters: { eventType, severity },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch trace events');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch trace events',
      },
    });
  }
});

/**
 * GET /api/traces/:traceId/timeline
 * Get timeline view of trace events
 */
router.get('/:traceId/timeline', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { traceId } = req.params;

    // Get trace
    const activeSession = antigravityTraceLogger.getSession(traceId);
    let session = activeSession;

    if (!activeSession) {
      const tracesDir = join(process.cwd(), '..', '..', 'antigravity-logs', 'traces');
      const files = readdirSync(tracesDir);
      const traceFile = files.find((f) => f.includes(traceId) && f.endsWith('.json'));

      if (traceFile) {
        session = JSON.parse(readFileSync(join(tracesDir, traceFile), 'utf-8'));
      }
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACE_NOT_FOUND',
          message: 'Trace session not found',
        },
      });
    }

    // Build timeline
    const timeline = [
      {
        timestamp: session.sessionStart,
        type: 'SESSION_START',
        title: 'Emergency Session Started',
        severity: 'LOW',
      },
      ...session.events.map((event) => ({
        timestamp: event.timestamp,
        type: event.eventType,
        title: getEventTitle(event.eventType),
        severity: event.severity,
        data: event.data,
      })),
      ...session.decisionChain.map((node) => ({
        timestamp: node.timestamp,
        type: 'DECISION',
        title: node.decision,
        severity: node.confidence > 0.8 ? 'LOW' : 'MEDIUM',
        confidence: node.confidence,
        reasoning: node.reasoning,
      })),
      ...session.actionHistory.map((action) => ({
        timestamp: action.timestamp,
        type: 'ACTION',
        title: action.action,
        severity: action.status === 'FAILED' ? 'HIGH' : 'LOW',
        status: action.status,
      })),
    ];

    if (session.sessionEnd) {
      timeline.push({
        timestamp: session.sessionEnd,
        type: 'SESSION_END',
        title: 'Emergency Session Ended',
        severity: 'LOW',
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({
      success: true,
      data: {
        traceId: session.traceId,
        timeline,
        summary: session.summary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch trace timeline');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch trace timeline',
      },
    });
  }
});

function getEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    AI_PROMPT: 'AI Analysis Requested',
    AI_RESPONSE: 'AI Analysis Completed',
    CRISIS_DETECTION: 'Crisis Detection',
    CONFIDENCE_SCORE: 'Confidence Score Calculated',
    SIGNAL_FUSION: 'Signal Fusion',
    EMERGENCY_CLASSIFICATION: 'Emergency Classified',
    FALLBACK_ACTION: 'Fallback Action Triggered',
    GPS_EVENT: 'Location Updated',
    ALERT_EXECUTION: 'Alert Sent',
    EMERGENCY_RESPONSE: 'Emergency Response',
  };
  return titles[eventType] || eventType;
}

/**
 * GET /api/traces/stats
 * Get trace statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tracesDir = join(process.cwd(), '..', '..', 'antigravity-logs', 'traces');
    const files = readdirSync(tracesDir).filter((f) => f.endsWith('.json'));

    let totalEvents = 0;
    let totalCriticalEvents = 0;
    let totalAlerts = 0;
    let averageConfidence = 0;
    let totalDuration = 0;

    files.forEach((file) => {
      const data = JSON.parse(readFileSync(join(tracesDir, file), 'utf-8'));
      if (data.summary) {
        totalEvents += data.summary.totalEvents;
        totalCriticalEvents += data.summary.criticalEvents;
        totalAlerts += data.summary.alertsSent;
        averageConfidence += data.summary.averageConfidence;
        totalDuration += data.summary.duration;
      }
    });

    const stats = {
      totalTraces: files.length,
      totalEvents,
      totalCriticalEvents,
      totalAlerts,
      averageConfidence: files.length > 0 ? averageConfidence / files.length : 0,
      averageDuration: files.length > 0 ? totalDuration / files.length : 0,
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch trace stats');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch trace stats',
      },
    });
  }
});

export default router;
