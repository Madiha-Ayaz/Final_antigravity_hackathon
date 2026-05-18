import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { createLogger } from '@silentsiren/logger';
import { freeSMSService } from '../services/freeSMS.service';
import { z } from 'zod';

const router = Router();
const logger = createLogger('emergency-sms-routes');

// Validation schemas
const sendSMSSchema = z.object({
  phoneNumber: z.string().min(10),
  carrier: z.string(),
  message: z.string().max(160),
});

const sendEmergencyAlertSchema = z.object({
  contacts: z.array(
    z.object({
      name: z.string(),
      phoneNumber: z.string(),
      carrier: z.string().optional(),
      relationship: z.string(),
    })
  ),
  location: z.string(),
  audioUrl: z.string().url(),
});

/**
 * Send single SMS via email gateway
 */
router.post(
  '/send-sms',
  authenticate,
  strictRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { phoneNumber, carrier, message } = sendSMSSchema.parse(req.body);

      const result = await freeSMSService.sendSMS(phoneNumber, carrier, message);

      if (result) {
        res.json({
          success: true,
          message: 'SMS sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send SMS',
        });
      }
    } catch (error) {
      logger.error('Error sending SMS', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Send emergency alerts to multiple contacts
 */
router.post(
  '/send-emergency-alerts',
  authenticate,
  strictRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contacts, location, audioUrl } = sendEmergencyAlertSchema.parse(req.body);

      const result = await freeSMSService.sendEmergencyAlerts(contacts, location, audioUrl);

      res.json({
        success: true,
        message: 'Emergency alerts sent',
        stats: result,
      });
    } catch (error) {
      logger.error('Error sending emergency alerts', { error, userId: req.user?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to send emergency alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get supported carriers
 */
router.get('/carriers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const carriers = freeSMSService.getSupportedCarriers();

    res.json({
      success: true,
      carriers: carriers.map((carrier) => ({
        id: carrier,
        name: carrier.charAt(0).toUpperCase() + carrier.slice(1),
      })),
    });
  } catch (error) {
    logger.error('Error getting carriers', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get carriers',
    });
  }
});

/**
 * Check if carrier is supported
 */
router.get('/carriers/:carrier', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { carrier } = req.params;
    const isSupported = freeSMSService.isCarrierSupported(carrier);

    res.json({
      success: true,
      carrier,
      supported: isSupported,
    });
  } catch (error) {
    logger.error('Error checking carrier', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to check carrier',
    });
  }
});

export default router;
