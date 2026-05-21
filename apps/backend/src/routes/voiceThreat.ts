import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
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
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * POST /api/voice-threat/analyze
 * Analyze voice audio for threats using Gemini AI
 */
router.post(
  '/analyze',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      logger.info({ userId: req.userId }, '🎤 Voice analysis request received');

      if (!req.file) {
        logger.error({ userId: req.userId }, '❌ No audio file provided');
        return res.status(400).json({
          success: false,
          error: 'Audio file is required',
        });
      }

      logger.info(
        {
          userId: req.userId,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
        '📦 Audio file received'
      );

      // Analyze voice for threats with Gemini AI
      logger.info({ userId: req.userId }, '🤖 Starting Gemini AI analysis...');

      const threatResult = await voiceThreatDetectionService.analyzeVoiceForThreat(
        req.file.buffer,
        req.userId!
      );

      logger.info(
        {
          userId: req.userId,
          isThreat: threatResult.isThreat,
          threatLevel: threatResult.threatLevel,
          confidence: threatResult.confidence,
        },
        '✅ Gemini AI analysis complete'
      );

      // Return analysis result
      res.json({
        success: true,
        sessionId: `session_${req.userId}_${Date.now()}`,
        isThreat: threatResult.isThreat,
        threatLevel: threatResult.threatLevel,
        confidence: threatResult.confidence,
        transcript: threatResult.transcript,
        reasoning: threatResult.reasoning,
        emergencyType: threatResult.emergencyType,
        emergencyCategory: threatResult.emergencyCategory,
        shouldTriggerSiren: threatResult.shouldTriggerSiren,
        shouldCallAmbulance: threatResult.shouldCallAmbulance,
        shouldCallFireBrigade: threatResult.shouldCallFireBrigade,
        audioUrl: `/api/audio/${req.userId}_${Date.now()}.wav`,
      });
    } catch (error: any) {
      logger.error({ error, userId: req.userId }, '❌ Voice analysis failed');
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze voice',
      });
    }
  }
);

/**
 * GET /api/voice-threat/test-gemini
 * Test if Gemini AI is working
 */
router.get('/test-gemini', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info({ userId: req.userId }, '🧪 Testing Gemini AI connection...');

    // Create a simple test audio buffer
    const testAudio = Buffer.from('test-audio-data');

    const result = await voiceThreatDetectionService.analyzeVoiceForThreat(testAudio, req.userId!);

    logger.info({ userId: req.userId, result }, '✅ Gemini AI test successful');

    res.json({
      success: true,
      message: 'Gemini AI is working!',
      testResult: result,
    });
  } catch (error: any) {
    logger.error({ error, userId: req.userId }, '❌ Gemini AI test failed');
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Gemini AI is not working. Check GEMINI_API_KEY in .env',
    });
  }
});

/**
 * POST /api/voice-threat/emergency/trigger
 * Trigger emergency alert with countdown
 */
router.post('/emergency/trigger', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, location } = req.body;

    logger.info({ userId: req.userId, sessionId }, '🚨 Emergency alert triggered');

    res.json({
      success: true,
      alertId: `alert_${req.userId}_${Date.now()}`,
      countdownStarted: true,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      sirenTriggered: true,
    });
  } catch (error: any) {
    logger.error({ error, userId: req.userId }, '❌ Failed to trigger emergency');
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice-threat/emergency/send-alerts
 * Send emergency alerts to all contacts (SMS, WhatsApp, Calls)
 */
router.post(
  '/emergency/send-alerts',
  optionalAuthenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { alertId, location } = req.body;

      logger.info({ userId: req.userId, alertId, location }, '📱 Sending emergency alerts');

      // Get user info
      const { databaseService } = await import('../services/database.service');

      let user = { full_name: 'Someone', phone_number: null };
      try {
        const userResult = await databaseService.query(
          'SELECT full_name, phone_number FROM users WHERE id = $1',
          [req.userId]
        );
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        }
      } catch (uErr) {
        logger.warn({ error: uErr }, 'Could not fetch user info');
      }

      // Get all emergency contacts - try user-specific first, fall back to all
      let contactsResult;
      try {
        contactsResult = await databaseService.query(
          `SELECT id, name, phone_number, relationship
           FROM emergency_contacts
           WHERE user_id = $1 AND is_active = true
           ORDER BY priority ASC`,
          [req.userId]
        );
      } catch (qErr) {
        logger.warn({ error: qErr }, 'User-specific query failed, fetching all contacts');
      }

      if (!contactsResult || contactsResult.rows.length === 0) {
        contactsResult = await databaseService.query(
          `SELECT id, name, phone_number, relationship
           FROM emergency_contacts
           WHERE is_active = true
           ORDER BY priority ASC`
        );
      }

      const contacts = contactsResult.rows;

      if (contacts.length === 0) {
        logger.warn({ userId: req.userId }, '⚠️ No emergency contacts found');
        return res.json({
          success: true,
          message: 'No emergency contacts to notify',
          alertsSent: 0,
        });
      }

      logger.info(
        { userId: req.userId, contactCount: contacts.length },
        '📋 Found emergency contacts'
      );

      // Create emergency message
      const locationUrl =
        location?.latitude && location?.longitude
          ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
          : 'Location unavailable';

      const message = `🚨 EMERGENCY ALERT 🚨\n\n${user.full_name || 'Your contact'} needs help!\n\nLocation: ${locationUrl}\n\nThis is an automated emergency alert from Silent Siren.`;

      // Send alerts to each contact using Twilio service
      const { twilioService } = await import('../services/twilio.service');
      const results = [];

      for (const contact of contacts) {
        try {
          logger.info(
            { contactId: contact.id, name: contact.name, phone: contact.phone_number },
            '📱 Sending Twilio alerts to contact'
          );

          const alertPayload = {
            recipientPhone: contact.phone_number,
            recipientName: contact.name,
            latitude: location?.latitude,
            longitude: location?.longitude,
            threatLevel: 'CRITICAL',
            transcript: `Emergency triggered by ${user.full_name || 'user'}. Immediate help needed.`,
          };

          const alertResults = await twilioService.sendAllAlerts(alertPayload);

          results.push({
            contactId: contact.id,
            name: contact.name,
            phone: contact.phone_number,
            sms: alertResults.sms,
            whatsapp: alertResults.whatsapp,
            call: alertResults.call,
          });

          logger.info(
            {
              contactId: contact.id,
              name: contact.name,
              sms: alertResults.sms.success,
              whatsapp: alertResults.whatsapp.success,
              call: alertResults.call.success,
            },
            '✅ Twilio alerts sent to contact'
          );
        } catch (error: any) {
          logger.error({ error, contactId: contact.id }, '❌ Failed to send alert to contact');
          results.push({
            contactId: contact.id,
            name: contact.name,
            phone: contact.phone_number,
            sms: { success: false, error: error.message },
            whatsapp: { success: false, error: error.message },
            call: { success: false, error: error.message },
          });
        }
      }

      logger.info(
        { userId: req.userId, totalContacts: contacts.length },
        '✅ Emergency alerts sent via Twilio'
      );

      res.json({
        success: true,
        message: 'Emergency alerts sent to all contacts via SMS, WhatsApp, and Voice Call',
        contactsNotified: contacts.length,
        results,
        locationUrl,
      });
    } catch (error: any) {
      logger.error({ error, userId: req.userId }, '❌ Failed to send emergency alerts');
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send emergency alerts',
      });
    }
  }
);

/**
 * POST /api/voice-threat/emergency/save-me
 * Immediate "Save Me" alert - sends SMS, WhatsApp, and Voice Call to all contacts
 */
router.post('/emergency/save-me', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { location } = req.body;
    const uid = req.userId || 'test-user-001';

    logger.info({ userId: uid, location }, '🆘 SAVE ME button pressed - sending all alerts');

    // Get user info
    const { databaseService } = await import('../services/database.service');

    let user = { full_name: 'Someone', phone_number: null };
    try {
      const userResult = await databaseService.query(
        'SELECT full_name, phone_number FROM users WHERE id = $1',
        [uid]
      );
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    } catch (uErr) {
      logger.warn({ error: uErr }, 'Could not fetch user info');
    }

    // Get all emergency contacts - try user-specific first, fall back to all
    let contactsResult;
    try {
      contactsResult = await databaseService.query(
        `SELECT id, name, phone_number, relationship
           FROM emergency_contacts
           WHERE user_id = $1 AND is_active = true
           ORDER BY priority ASC`,
        [uid]
      );
    } catch (qErr) {
      logger.warn({ error: qErr }, 'User-specific query failed, fetching all contacts');
    }

    if (!contactsResult || contactsResult.rows.length === 0) {
      contactsResult = await databaseService.query(
        `SELECT id, name, phone_number, relationship
           FROM emergency_contacts
           WHERE is_active = true
           ORDER BY priority ASC`
      );
    }

    const contacts = contactsResult.rows;

    if (contacts.length === 0) {
      logger.warn({ userId: uid }, '⚠️ No emergency contacts found for Save Me');
      return res.json({
        success: false,
        message: 'No emergency contacts configured. Please add contacts first.',
        contactsNotified: 0,
      });
    }

    logger.info(
      { userId: uid, contactCount: contacts.length },
      '📋 Found contacts for Save Me alert'
    );

    // Send alerts using Twilio service
    const { twilioService } = await import('../services/twilio.service');
    const results = [];

    for (const contact of contacts) {
      try {
        const alertPayload = {
          recipientPhone: contact.phone_number,
          recipientName: contact.name,
          latitude: location?.latitude,
          longitude: location?.longitude,
          threatLevel: 'CRITICAL',
          transcript: `🆘 SAVE ME! ${user.full_name || 'Someone'} needs immediate help! This is an urgent emergency alert.`,
        };

        const alertResults = await twilioService.sendAllAlerts(alertPayload);

        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone_number,
          sms: alertResults.sms,
          whatsapp: alertResults.whatsapp,
          call: alertResults.call,
        });

        logger.info(
          { contactId: contact.id, name: contact.name },
          '✅ Save Me alerts sent to contact'
        );
      } catch (error: any) {
        logger.error({ error, contactId: contact.id }, '❌ Failed to send Save Me alert');
        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone_number,
          sms: { success: false, error: error.message },
          whatsapp: { success: false, error: error.message },
          call: { success: false, error: error.message },
        });
      }
    }

    logger.info({ userId: uid, totalContacts: contacts.length }, '✅ Save Me alerts completed');

    res.json({
      success: true,
      message: 'Save Me alerts sent to all contacts via SMS, WhatsApp, and Voice Call',
      contactsNotified: contacts.length,
      results,
    });
  } catch (error: any) {
    logger.error({ error }, '❌ Save Me alert failed');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send Save Me alerts',
    });
  }
});

/**
 * POST /api/voice-threat/emergency/confirm-safe
 * User confirms they are safe
 */
router.post(
  '/emergency/confirm-safe',
  optionalAuthenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { alertId } = req.body;

      logger.info({ userId: req.userId, alertId }, '✅ User confirmed safe');

      // Get user info
      const { databaseService } = await import('../services/database.service');

      let user = { full_name: 'Someone' };
      try {
        const userResult = await databaseService.query(
          'SELECT full_name FROM users WHERE id = $1',
          [req.userId]
        );
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        }
      } catch (uErr) {
        logger.warn({ error: uErr }, 'Could not fetch user info');
      }

      // Get all emergency contacts - try user-specific first, fall back to all
      let contactsResult;
      try {
        contactsResult = await databaseService.query(
          `SELECT name, phone_number
           FROM emergency_contacts
           WHERE user_id = $1 AND is_active = true`,
          [req.userId]
        );
      } catch (qErr) {
        logger.warn({ error: qErr }, 'User-specific query failed, fetching all contacts');
      }

      if (!contactsResult || contactsResult.rows.length === 0) {
        contactsResult = await databaseService.query(
          `SELECT name, phone_number
           FROM emergency_contacts
           WHERE is_active = true`
        );
      }

      // Send "I am safe" message to all contacts via Twilio SMS
      const { twilioService } = await import('../services/twilio.service');
      const safeMessage = `✅ ${user?.full_name || 'Your contact'} is SAFE.\n\nThe emergency alert has been cancelled. No assistance needed.`;

      for (const contact of contactsResult.rows) {
        try {
          await twilioService.sendEmergencySMS(contact.phone_number, safeMessage, contact.name);
          logger.info({ contactName: contact.name }, '✅ Safe message sent');
        } catch (error) {
          logger.error({ error, contactName: contact.name }, '❌ Failed to send safe message');
        }
      }

      res.json({
        success: true,
        cancelled: true,
        notificationsSent: true,
        message: 'Emergency cancelled - user confirmed safe',
      });
    } catch (error: any) {
      logger.error({ error, userId: req.userId }, '❌ Failed to confirm safety');
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/voice-threat/twilio-status
 * Check Twilio configuration status (no secrets exposed)
 */
router.get('/twilio-status', async (_req: AuthRequest, res: Response) => {
  const { twilioService } = await import('../services/twilio.service');

  const hasSid =
    !!process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid';
  const hasToken =
    !!process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token';
  const hasPhone =
    !!process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== '+1234567890';
  const useTwilio = process.env.USE_TWILIO !== 'false';

  res.json({
    configured: twilioService.isReady(),
    useTwilio,
    credentials: {
      accountSid: hasSid ? 'SET' : 'MISSING',
      authToken: hasToken ? 'SET' : 'MISSING',
      phoneNumber: hasPhone ? 'SET' : 'MISSING',
    },
    mode: twilioService.isReady() && useTwilio ? 'TWILIO' : 'FALLBACK (Textbelt/CallMeBot)',
    fixInstructions:
      !hasSid || !hasToken || !hasPhone
        ? 'Add real Twilio credentials to apps/backend/.env file'
        : !useTwilio
          ? 'Set USE_TWILIO=true in apps/backend/.env'
          : null,
  });
});

/**
 * POST /api/voice-threat/test-sms
 * Send a test SMS to verify Twilio connection
 */
router.post('/test-sms', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }

    const { twilioService } = await import('../services/twilio.service');

    logger.info({ phone }, '🧪 Sending test SMS');

    const result = await twilioService.sendEmergencySMS({
      recipientPhone: phone,
      recipientName: 'Test User',
      threatLevel: 'TEST',
      transcript: 'This is a test message from SilentSiren.',
    });

    res.json({
      success: result.success,
      mode: twilioService.isReady() && process.env.USE_TWILIO !== 'false' ? 'TWILIO' : 'FALLBACK',
      messageId: result.messageId,
      error: result.error || null,
    });
  } catch (error: any) {
    logger.error({ error }, '❌ Test SMS failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/voice-threat/store-alert
 * Store alert in Neon DB for history tracking
 */
router.post('/store-alert', async (req: AuthRequest, res: Response) => {
  try {
    const { transcript, threatLevel, confidence, category, reasoning, whatsappSent, location } =
      req.body;

    // Store in Neon DB using raw SQL
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const query = `
      INSERT INTO voice_alerts (user_id, transcript, threat_level, confidence, category, reasoning, whatsapp_sent, latitude, longitude, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    const values = [
      req.userId || 'anonymous',
      transcript || 'No transcript',
      threatLevel || 'LOW',
      confidence || 0,
      category || 'general',
      reasoning || '',
      whatsappSent || false,
      location?.lat || null,
      location?.lng || null,
    ];

    try {
      const result = await pool.query(query, values);
      logger.info({ alertId: result.rows[0]?.id }, 'Alert stored in Neon DB');

      res.json({
        success: true,
        alertId: result.rows[0]?.id,
        message: 'Alert stored in database',
      });
    } catch (dbError: any) {
      // If table doesn't exist, create it
      if (dbError.code === '42P01') {
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS voice_alerts (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            transcript TEXT,
            threat_level VARCHAR(50),
            confidence DECIMAL(5,4),
            category VARCHAR(50),
            reasoning TEXT,
            whatsapp_sent BOOLEAN DEFAULT FALSE,
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await pool.query(createTableQuery);

        // Retry insert
        const result = await pool.query(query, values);
        logger.info({ alertId: result.rows[0]?.id }, 'Alert stored in Neon DB (table created)');

        res.json({
          success: true,
          alertId: result.rows[0]?.id,
          message: 'Alert stored in database',
        });
      } else {
        throw dbError;
      }
    }

    await pool.end();
  } catch (error: any) {
    logger.error({ error }, 'Failed to store alert in DB');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to store alert',
    });
  }
});

/**
 * GET /api/voice-threat/history
 * Get alert history from Neon DB
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const query = `
      SELECT * FROM voice_alerts
      ORDER BY created_at DESC
      LIMIT 50
    `;

    try {
      const result = await pool.query(query);
      res.json({
        success: true,
        alerts: result.rows,
      });
    } catch (dbError: any) {
      if (dbError.code === '42P01') {
        // Table doesn't exist yet
        res.json({
          success: true,
          alerts: [],
          message: 'No alerts yet',
        });
      } else {
        throw dbError;
      }
    }

    await pool.end();
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch alert history');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch history',
    });
  }
});

export default router;
