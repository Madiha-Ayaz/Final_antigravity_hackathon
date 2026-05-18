import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { createLogger } from '@silentsiren/logger';
import { voiceThreatDetectionService } from '../services/voiceThreatDetection.service';
import { z } from 'zod';
import multer from 'multer';

const router = Router();
const logger = createLogger('voice-threat-routes');

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

const analyzeVoiceSchema = z.object({
  contacts: z.array(z.object({
    name: z.string(),
    phoneNumber: z.string(),
    relationship: z.string(),
  })),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    address: z.string().optional(),
  }).optional(),
});

const cancelCountdownSchema = z.object({
  countdownId: z.string(),
  contacts: z.array(z.object({
    name: z.string(),
    phoneNumber: z.string(),
    relationship: z.string(),
  })),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    address: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/voice-threat/analyze
 * Analyze voice audio for threats
 */
router.post(
  '/analyze',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_AUDIO_FILE',
            message: 'Audio file is required',
          },
        });
      }

      const validation = analyzeVoiceSchema.safeParse(JSON.parse(req.body.data || '{}'));

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const { contacts, location } = validation.data;

      logger.info({ userId: req.userId, fileSize: req.file.size }, 'Analyzing voice for threats');

      // Analyze voice for threats
      const threatResult = await voiceThreatDetectionService.analyzeVoiceForThreat(
        req.file.buffer,
        req.userId!
      );

      // If threat detected, start countdown
      let countdownData = null;
      if (threatResult.isThreat && threatResult.shouldTriggerSiren) {
        countdownData = await voiceThreatDetectionService.startEmergencyCountdown(
          req.userId!,
          threatResult,
          contacts,
          location
        );
      }

      res.json({
        success: true,
        data: {
          threat: threatResult,
          countdown: countdownData,
          sirenActive: threatResult.shouldTriggerSiren,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Voice threat analysis failed');
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze voice for threats',
        },
      });
    }
  }
);

/**
 * POST /api/voice-threat/cancel
 * Cancel emergency countdown (user clicked "I'm Safe")
 */
router.post(
  '/cancel',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = cancelCountdownSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const { countdownId, contacts, location } = validation.data;

      logger.info({ userId: req.userId, countdownId }, 'Cancelling emergency countdown');

      await voiceThreatDetectionService.cancelEmergencyCountdown(
        req.userId!,
        countdownId,
        contacts,
        location
      );

      res.json({
        success: true,
        data: {
          message: 'Emergency cancelled - "I am safe" messages sent to contacts',
          countdownId,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to cancel countdown');
      res.status(500).json({
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: 'Failed to cancel emergency countdown',
        },
      });
    }
  }
);

/**
 * GET /api/voice-threat/status
 * Get current threat detection status
 */
router.get(
  '/status',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const sirenActive = voiceThreatDetectionService.isSirenActive(req.userId!);
      const activeCountdown = voiceThreatDetectionService.getActiveCountdown(req.userId!);

      res.json({
        success: true,
        data: {
          sirenActive,
          activeCountdown,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get status');
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_FAILED',
          message: 'Failed to get threat detection status',
        },
      });
    }
  }
);

/**
 * POST /api/voice-threat/stop-siren
 * Force stop siren
 */
router.post(
  '/stop-siren',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      voiceThreatDetectionService.stopSiren(req.userId!);

      res.json({
        success: true,
        data: {
          message: 'Siren stopped',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to stop siren');
      res.status(500).json({
        success: false,
        error: {
          code: 'STOP_SIREN_FAILED',
          message: 'Failed to stop siren',
        },
      });
    }
  }
);

export default router;
