import { Router, Request, Response } from 'express';
import { redisService } from '../services/redis.service';
import { databaseService } from '../services/database.service';
import { logger } from '@silentsiren/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    redis: ServiceHealth;
    database?: ServiceHealth;
    twilio?: ServiceHealth;
    gemini?: ServiceHealth;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

/**
 * GET /health
 * Basic health check - returns 200 if service is running
 */
router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /health/detailed
 * Comprehensive health check with all service statuses
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Check Database
    const databaseHealth = await checkDatabase();

    // Check Redis
    const redisHealth = await checkRedis();

    // Check system resources
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (databaseHealth.status === 'down') {
      overallStatus = 'unhealthy';
    }

    if (redisHealth.status === 'down') {
      overallStatus = 'degraded';
    }

    if (memoryPercentage > 90) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealth,
        redis: redisHealth,
      },
      system: {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage),
        },
        cpu: {
          usage: Math.round(process.cpuUsage().user / 1000000), // Convert to ms
        },
      },
    };

    const responseTime = Date.now() - startTime;

    logger.info('Health check completed', {
      status: overallStatus,
      responseTime,
    });

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check critical dependencies
    const databaseHealth = await checkDatabase();
    const redisHealth = await checkRedis();

    if (databaseHealth.status === 'down') {
      res.status(503).json({
        ready: false,
        reason: 'Database is not available',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (redisHealth.status === 'down') {
      res.status(503).json({
        ready: false,
        reason: 'Redis is not available',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      reason: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - checks if service is alive (for Kubernetes)
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Check Database health
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const health = await databaseService.healthCheck();

    return {
      status: health.status,
      responseTime: health.responseTime,
      message: health.message,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'down',
      responseTime,
      message,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    await redisService.getClient().ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'up',
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'down',
      responseTime,
      message,
      lastChecked: new Date().toISOString(),
    };
  }
}

export default router;
