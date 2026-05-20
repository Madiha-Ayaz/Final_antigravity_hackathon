import { Router, Request, Response } from 'express';
import { createLogger } from '@silentsiren/logger';

const router = Router();
const logger = createLogger('agent-logs');

interface AgentLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  reasoning: string;
  result: any;
  userId?: string;
  sessionId?: string;
}

// In-memory storage for demo (use Redis or database in production)
const agentLogs: AgentLog[] = [];
const MAX_LOGS = 1000;

// Store agent log
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { agent, action, reasoning, result, userId, sessionId } = req.body;

    const log: AgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      agent,
      action,
      reasoning,
      result,
      userId,
      sessionId,
    };

    agentLogs.unshift(log);

    // Keep only last MAX_LOGS entries
    if (agentLogs.length > MAX_LOGS) {
      agentLogs.pop();
    }

    logger.info({ log }, 'Agent log stored');

    res.json({ success: true, logId: log.id });
  } catch (error: any) {
    logger.error({ error }, 'Failed to store agent log');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { agent, userId, sessionId, limit = 100, offset = 0 } = req.query;

    let filteredLogs = [...agentLogs];

    if (agent) {
      filteredLogs = filteredLogs.filter(log => log.agent === agent);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (sessionId) {
      filteredLogs = filteredLogs.filter(log => log.sessionId === sessionId);
    }

    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    const paginatedLogs = filteredLogs.slice(start, end);

    res.json({
      success: true,
      logs: paginatedLogs,
      total: filteredLogs.length,
      offset: start,
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to retrieve agent logs');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get logs by session
router.get('/logs/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionLogs = agentLogs.filter(log => log.sessionId === sessionId);

    res.json({
      success: true,
      logs: sessionLogs,
      total: sessionLogs.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to retrieve session logs');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const agentCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    agentLogs.forEach(log => {
      agentCounts[log.agent] = (agentCounts[log.agent] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalLogs: agentLogs.length,
        agentCounts,
        actionCounts,
        oldestLog: agentLogs[agentLogs.length - 1]?.timestamp,
        newestLog: agentLogs[0]?.timestamp,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to retrieve agent stats');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear logs (admin only)
router.delete('/logs', async (req: Request, res: Response) => {
  try {
    const clearedCount = agentLogs.length;
    agentLogs.length = 0;

    logger.info({ clearedCount }, 'Agent logs cleared');

    res.json({ success: true, clearedCount });
  } catch (error: any) {
    logger.error({ error }, 'Failed to clear agent logs');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
