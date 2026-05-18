import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { whatsAppService } from '../services/whatsapp.service';
import { emergencyContactRepository } from '../repositories/emergencyContact.repository';
import { auditService } from '../services/audit.service';
import { z } from 'zod';

const router = Router();
const logger = createLogger('whatsapp-routes');

const sendMessageSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  message: z.string().min(1).max(4096),
});

const sendVoiceSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  audioUrl: z.string().url(),
  caption: z.string().optional(),
});

const sendEmergencyAlertSchema = z.object({
  threatLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  transcript: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  audioUrl: z.string().url().optional(),
});

const contactFormSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1).max(2000),
  recipientNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
});

/**
 * POST /api/whatsapp/send
 * Send WhatsApp text message
 */
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = sendMessageSchema.safeParse(req.body);

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

    const { to, message } = validation.data;

    const result = await whatsAppService.sendMessage({ to, message });

    // Log to audit
    await auditService.log({
      action: 'emergency.dispatch',
      userId: req.userId,
      status: result.success ? 'success' : 'failure',
      metadata: {
        channel: 'whatsapp',
        recipient: to,
        messageId: result.messageId,
      },
      errorMessage: result.error,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: result.error || 'Failed to send WhatsApp message',
        },
      });
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: to,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send WhatsApp message');
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_FAILED',
        message: 'Failed to send WhatsApp message',
      },
    });
  }
});

/**
 * POST /api/whatsapp/send-voice
 * Send WhatsApp voice message
 */
router.post('/send-voice', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = sendVoiceSchema.safeParse(req.body);

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

    const { to, audioUrl, caption } = validation.data;

    const result = await whatsAppService.sendVoiceMessage({ to, audioUrl, caption });

    // Log to audit
    await auditService.log({
      action: 'emergency.dispatch',
      userId: req.userId,
      status: result.success ? 'success' : 'failure',
      metadata: {
        channel: 'whatsapp_voice',
        recipient: to,
        audioUrl,
        messageId: result.messageId,
      },
      errorMessage: result.error,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: result.error || 'Failed to send WhatsApp voice message',
        },
      });
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: to,
        audioUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send WhatsApp voice message');
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_FAILED',
        message: 'Failed to send WhatsApp voice message',
      },
    });
  }
});

/**
 * POST /api/whatsapp/emergency-alert
 * Send emergency alert to all WhatsApp-enabled contacts
 */
router.post('/emergency-alert', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = sendEmergencyAlertSchema.safeParse(req.body);

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

    const alertData = validation.data;

    // Get user's emergency contacts with WhatsApp enabled
    const contactsData = await emergencyContactRepository.getContactsForThreatLevel(
      req.userId!,
      alertData.threatLevel
    );

    const whatsappContacts = contactsData.whatsapp.map(c => ({
      phoneNumber: c.phone_number,
      name: c.name,
    }));

    if (whatsappContacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_CONTACTS',
          message: 'No WhatsApp-enabled emergency contacts found',
        },
      });
    }

    const result = await whatsAppService.sendEmergencyAlert(whatsappContacts, alertData);

    // Log to audit
    await auditService.log({
      action: 'emergency.dispatch',
      userId: req.userId,
      status: result.sent > 0 ? 'success' : 'failure',
      metadata: {
        channel: 'whatsapp_emergency',
        threatLevel: alertData.threatLevel,
        contactsCount: whatsappContacts.length,
        sent: result.sent,
        failed: result.failed,
        hasAudio: !!alertData.audioUrl,
      },
    });

    res.json({
      success: true,
      data: {
        sent: result.sent,
        failed: result.failed,
        totalContacts: whatsappContacts.length,
        results: result.results,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send emergency alerts');
    res.status(500).json({
      success: false,
      error: {
        code: 'ALERT_FAILED',
        message: 'Failed to send emergency alerts',
      },
    });
  }
});

/**
 * POST /api/whatsapp/contact-form
 * Send contact form submission via WhatsApp
 */
router.post('/contact-form', async (req, res: Response) => {
  try {
    const validation = contactFormSchema.safeParse(req.body);

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

    const { recipientNumber, ...formData } = validation.data;

    const result = await whatsAppService.sendContactFormMessage(recipientNumber, formData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: result.error || 'Failed to send contact form message',
        },
      });
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: recipientNumber,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send contact form message');
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_FAILED',
        message: 'Failed to send contact form message',
      },
    });
  }
});

/**
 * GET /api/whatsapp/status
 * Check WhatsApp service status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isConfigured = whatsAppService.isConfigured();

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        service: 'TextMeBot',
        features: {
          textMessages: isConfigured,
          voiceMessages: isConfigured,
          emergencyAlerts: isConfigured,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to check WhatsApp status');
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Failed to check WhatsApp status',
      },
    });
  }
});

export default router;
