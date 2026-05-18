import { Router, Request, Response } from 'express';
import { communityValidatorService } from '../services/communityValidator.service';
import { reputationService } from '../services/reputation.service';
import { logger } from '@silentsiren/logger';
import { EmergencyIncident } from '@silentsiren/shared-types';
import { z } from 'zod';

const router = Router();

// Validation schemas
const submitIncidentSchema = z.object({
  userId: z.string().min(1),
  deviceId: z.string().min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
  }),
  aiAnalysis: z.object({
    confidence: z.number().min(0).max(1),
    threatLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    reasoning: z.string(),
    audioPatterns: z.array(z.string()).optional(),
  }),
  audioClipUrl: z.string().optional(),
});

const getValidationSchema = z.object({
  incidentId: z.string().min(1),
});

const updateReputationSchema = z.object({
  userId: z.string().min(1),
  wasValidated: z.boolean(),
  wasFalseAlarm: z.boolean(),
});

/**
 * POST /api/validator/submit
 * Submit a new emergency incident for community validation
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = submitIncidentSchema.parse(req.body);

    const { userId, deviceId, location, aiAnalysis, audioClipUrl } = validatedData;

    // Check if user is allowed to submit
    const abuseCheck = await reputationService.checkUserAllowed(userId, deviceId);

    if (!abuseCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: abuseCheck.reason || 'Too many requests',
          details: {
            reputation: abuseCheck.reputation,
          },
        },
        timestamp: new Date(),
      });
    }

    // Create incident object
    const incident: EmergencyIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      deviceId,
      timestamp: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      aiAnalysis: {
        confidence: aiAnalysis.confidence,
        threatLevel: aiAnalysis.threatLevel,
        reasoning: aiAnalysis.reasoning,
        audioPatterns: aiAnalysis.audioPatterns,
      },
      audioClipUrl,
      status: 'pending',
    };

    // Submit for validation
    const validationResult = await communityValidatorService.submitIncident(incident);

    // Increment rate limit
    await reputationService.incrementRateLimit(userId);

    logger.info('Incident submitted for validation', {
      incidentId: incident.id,
      userId,
      validationScore: validationResult.validationScore,
    });

    return res.status(200).json({
      success: true,
      data: {
        incident: {
          id: incident.id,
          status: incident.status,
          timestamp: incident.timestamp,
        },
        validation: validationResult,
        reputation: abuseCheck.reputation,
        remainingQuota: abuseCheck.remainingQuota,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        timestamp: new Date(),
      });
    }

    logger.error('Failed to submit incident:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit incident',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/validator/status/:incidentId
 * Get validation status for an incident
 */
router.get('/status/:incidentId', async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;

    if (!incidentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Incident ID is required',
        },
        timestamp: new Date(),
      });
    }

    // Get incident
    const incident = await communityValidatorService.getIncident(incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Incident not found',
        },
        timestamp: new Date(),
      });
    }

    // Get validation status
    const validationResult = await communityValidatorService.getValidationStatus(incidentId);

    return res.status(200).json({
      success: true,
      data: {
        incident: {
          id: incident.id,
          status: incident.status,
          timestamp: incident.timestamp,
          validationScore: incident.validationScore,
        },
        validation: validationResult,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get validation status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get validation status',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/validator/incident/:incidentId
 * Get incident details
 */
router.get('/incident/:incidentId', async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;

    if (!incidentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Incident ID is required',
        },
        timestamp: new Date(),
      });
    }

    const incident = await communityValidatorService.getIncident(incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Incident not found',
        },
        timestamp: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      data: { incident },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get incident:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get incident',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/validator/reputation/update
 * Update user reputation after incident resolution
 */
router.post('/reputation/update', async (req: Request, res: Response) => {
  try {
    const validatedData = updateReputationSchema.parse(req.body);
    const { userId, wasValidated, wasFalseAlarm } = validatedData;

    await reputationService.updateReputationAfterIncident(userId, wasValidated, wasFalseAlarm);

    const reputation = await reputationService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: { reputation },
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        timestamp: new Date(),
      });
    }

    logger.error('Failed to update reputation:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update reputation',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/validator/reputation/:userId
 * Get user reputation and statistics
 */
router.get('/reputation/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'User ID is required',
        },
        timestamp: new Date(),
      });
    }

    const reputation = await reputationService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: { reputation },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get user reputation:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user reputation',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/validator/ban
 * Ban a user (admin only - add auth middleware in production)
 */
router.post('/ban', async (req: Request, res: Response) => {
  try {
    const { userId, reason, durationSeconds } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'User ID and reason are required',
        },
        timestamp: new Date(),
      });
    }

    const duration = durationSeconds || 86400; // Default 24 hours

    await reputationService.banUser(userId, reason, duration);

    return res.status(200).json({
      success: true,
      data: {
        message: 'User banned successfully',
        userId,
        duration,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to ban user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to ban user',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/validator/unban
 * Unban a user (admin only - add auth middleware in production)
 */
router.post('/unban', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'User ID is required',
        },
        timestamp: new Date(),
      });
    }

    await reputationService.unbanUser(userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'User unbanned successfully',
        userId,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to unban user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unban user',
      },
      timestamp: new Date(),
    });
  }
});

export default router;
