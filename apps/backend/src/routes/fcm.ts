import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { fcmService } from '../services/fcm.service';
import { deviceTokenRepository } from '../repositories/deviceToken.repository';
import { z } from 'zod';

const router = Router();
const logger = createLogger('fcm-routes');

const saveTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  deviceType: z.enum(['web', 'android', 'ios']).optional().default('web'),
  deviceInfo: z.record(z.any()).optional(),
});

const sendTestSchema = z.object({
  title: z.string().optional().default('Test Notification'),
  body: z.string().optional().default('This is a test notification from SilentSiren AI'),
});

/**
 * POST /api/fcm/save-token
 * Save FCM device token for the authenticated user
 */
router.post('/save-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = saveTokenSchema.safeParse(req.body);

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

    const { token, deviceType, deviceInfo } = validation.data;

    logger.info({ userId: req.userId }, 'Saving FCM token');

    // Validate token with FCM (skip if FCM not configured)
    if (fcmService.isConfigured()) {
      const isValid = await fcmService.validateToken(token);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid FCM token',
          },
        });
      }
    }

    // Save to database
    const deviceToken = await deviceTokenRepository.create({
      user_id: req.userId!,
      token,
      device_type: deviceType,
      device_info: deviceInfo,
    });

    logger.info({ userId: req.userId, tokenId: deviceToken.id }, 'FCM token saved successfully');

    res.json({
      success: true,
      data: {
        tokenId: deviceToken.id,
        message: 'Device token saved successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Failed to save FCM token');
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_TOKEN_FAILED',
        message: 'Failed to save device token',
      },
    });
  }
});

/**
 * POST /api/fcm/send-test
 * Send a test notification to the authenticated user
 */
router.post('/send-test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!fcmService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'FCM_NOT_CONFIGURED',
          message: 'Firebase Cloud Messaging is not configured',
        },
      });
    }

    const validation = sendTestSchema.safeParse(req.body);
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

    const { title, body } = validation.data;

    logger.info({ userId: req.userId }, 'Sending test notification');

    // Get user's device tokens
    const tokens = await deviceTokenRepository.findActiveTokensByUserId(req.userId!);

    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_TOKENS',
          message: 'No device tokens found for this user',
        },
      });
    }

    // Send notification
    const result = await fcmService.sendMulticast(
      tokens,
      {
        title,
        body,
        icon: '/icon-192x192.png',
      },
      {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      }
    );

    logger.info(
      { userId: req.userId, successCount: result.successCount, failureCount: result.failureCount },
      'Test notification sent'
    );

    res.json({
      success: true,
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalTokens: tokens.length,
        message: 'Test notification sent',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Failed to send test notification');
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_TEST_FAILED',
        message: 'Failed to send test notification',
      },
    });
  }
});

/**
 * DELETE /api/fcm/token
 * Remove FCM device token for the authenticated user
 */
router.delete('/token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token is required',
        },
      });
    }

    logger.info({ userId: req.userId }, 'Removing FCM token');

    await deviceTokenRepository.deactivate(req.userId!, token);

    res.json({
      success: true,
      data: {
        message: 'Device token removed successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Failed to remove FCM token');
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_TOKEN_FAILED',
        message: 'Failed to remove device token',
      },
    });
  }
});

/**
 * GET /api/fcm/tokens
 * Get all device tokens for the authenticated user
 */
router.get('/tokens', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await deviceTokenRepository.findByUserId(req.userId!);

    res.json({
      success: true,
      data: {
        tokens: tokens.map((t) => ({
          id: t.id,
          deviceType: t.device_type,
          deviceInfo: t.device_info,
          isActive: t.is_active,
          lastUsedAt: t.last_used_at,
          createdAt: t.created_at,
        })),
        count: tokens.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Failed to fetch device tokens');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TOKENS_FAILED',
        message: 'Failed to fetch device tokens',
      },
    });
  }
});

export default router;
