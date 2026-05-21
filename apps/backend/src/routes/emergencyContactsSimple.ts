import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { optionalAuthenticate } from '../middleware/optionalAuth';
import { createLogger } from '@silentsiren/logger';
import { databaseService } from '../services/database.service';
import { z } from 'zod';

const router = Router();
const logger = createLogger('emergency-contact-simple-routes');

// Simpler schema - no strict E.164 validation
const createContactSimpleSchema = z.object({
  name: z.string().min(1).max(255),
  phoneNumber: z.string().min(10).max(20), // Just basic length check
  relationship: z.string().min(1).max(100),
  notifyWhatsapp: z.boolean().optional().default(true),
  notifySms: z.boolean().optional().default(true),
  notifyCall: z.boolean().optional().default(false),
});

/**
 * POST /api/emergency-contacts/add
 * Simple endpoint to add emergency contact (no strict validation)
 */
router.post('/add', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info({ userId: req.userId, body: req.body }, '📝 Adding emergency contact');

    const validation = createContactSimpleSchema.safeParse(req.body);

    if (!validation.success) {
      logger.error({ errors: validation.error.errors }, '❌ Validation failed');
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: validation.error.errors,
      });
    }

    const { name, phoneNumber, relationship, notifyWhatsapp, notifySms, notifyCall } =
      validation.data;

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Add + if not present
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // Ensure user exists in users table (for foreign key constraint)
    let userId = req.userId;
    try {
      const userCheck = await databaseService.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        // Create a placeholder user for demo/testing
        const newUser = await databaseService.query(
          `INSERT INTO users (id, phone_number, full_name, is_verified, is_active)
           VALUES ($1, $2, $3, true, true)
           ON CONFLICT (id) DO NOTHING
           RETURNING id`,
          [userId, '+0000000000', 'Test User']
        );
        if (newUser.rows.length > 0) {
          logger.info({ userId }, '✅ Created placeholder user for contacts');
        }
      }
    } catch (userErr: any) {
      logger.warn(
        { error: userErr.message, userId },
        '⚠️ Could not verify/create user, trying UUID conversion'
      );
      // If userId is not a valid UUID, generate a deterministic UUID from it
      try {
        // Try to find or create a user with a proper UUID
        const existingUser = await databaseService.query('SELECT id FROM users LIMIT 1');
        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          logger.info({ userId }, 'Using existing user for contacts');
        }
      } catch (fallbackErr) {
        logger.error({ error: fallbackErr }, '❌ Could not find any user');
      }
    }

    // Insert contact (without carrier column)
    const result = await databaseService.query(
      `INSERT INTO emergency_contacts (
        user_id,
        name,
        phone_number,
        relationship,
        notify_whatsapp,
        notify_sms,
        notify_call,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [userId, name, formattedPhone, relationship, notifyWhatsapp, notifySms, notifyCall]
    );

    const contact = result.rows[0];

    logger.info({ userId: req.userId, contactId: contact.id }, '✅ Contact added successfully');

    res.status(201).json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phone_number,
        relationship: contact.relationship,
        carrier: contact.carrier,
        notifyWhatsapp: contact.notify_whatsapp,
        notifySms: contact.notify_sms,
        notifyCall: contact.notify_call,
      },
      message: 'Emergency contact added successfully',
    });
  } catch (error: any) {
    logger.error({ error, userId: req.userId }, '❌ Failed to add contact');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add emergency contact',
    });
  }
});

/**
 * GET /api/emergency-contacts/list
 * Get all emergency contacts for user
 */
router.get('/list', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info({ userId: req.userId }, '📋 Fetching emergency contacts');

    let userId = req.userId;

    // Try to find a valid user ID
    try {
      const userCheck = await databaseService.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        // Try to find any existing user
        const existingUser = await databaseService.query('SELECT id FROM users LIMIT 1');
        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
        }
      }
    } catch (userErr) {
      logger.warn({ error: userErr }, '⚠️ Could not verify user for list');
    }

    // Select contacts - try with userId first, fall back to all contacts
    let result;
    try {
      result = await databaseService.query(
        `SELECT id, name, phone_number, relationship,
                notify_whatsapp, notify_sms, notify_call, priority, created_at
         FROM emergency_contacts
         WHERE user_id = $1 AND is_active = true
         ORDER BY priority ASC, created_at DESC`,
        [userId]
      );
    } catch (queryErr) {
      // Invalid UUID or other query error - fall back to all contacts
      logger.warn({ error: queryErr, userId }, 'Query with userId failed, fetching all contacts');
      result = await databaseService.query(
        `SELECT id, name, phone_number, relationship,
                notify_whatsapp, notify_sms, notify_call, priority, created_at
         FROM emergency_contacts
         WHERE is_active = true
         ORDER BY priority ASC, created_at DESC`
      );
    }

    // If no contacts found with this userId, get all active contacts (for demo/hackathon)
    if (result.rows.length === 0) {
      logger.info({ userId }, 'No contacts for user, fetching all active contacts');
      result = await databaseService.query(
        `SELECT id, name, phone_number, relationship,
                notify_whatsapp, notify_sms, notify_call, priority, created_at
         FROM emergency_contacts
         WHERE is_active = true
         ORDER BY priority ASC, created_at DESC`
      );
    }

    const contacts = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone_number: row.phone_number,
      relationship: row.relationship,
      notify_whatsapp: row.notify_whatsapp || false,
      notify_sms: row.notify_sms || false,
      notify_call: row.notify_call || false,
      priority: row.priority || 1,
      createdAt: row.created_at,
    }));

    logger.info({ userId: req.userId, count: contacts.length }, '✅ Contacts fetched');

    res.json({
      success: true,
      contacts,
      count: contacts.length,
    });
  } catch (error: any) {
    logger.error({ error, userId: req.userId }, '❌ Failed to fetch contacts');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contacts',
    });
  }
});

/**
 * DELETE /api/emergency-contacts/:contactId
 * Delete emergency contact
 */
router.delete('/:contactId', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    logger.info({ userId: req.userId, contactId }, '🗑️ Deleting contact');

    // Verify ownership
    const checkResult = await databaseService.query(
      'SELECT user_id FROM emergency_contacts WHERE id = $1',
      [contactId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      });
    }

    if (checkResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this contact',
      });
    }

    // Soft delete
    await databaseService.query(
      'UPDATE emergency_contacts SET is_active = false, updated_at = NOW() WHERE id = $1',
      [contactId]
    );

    logger.info({ userId: req.userId, contactId }, '✅ Contact deleted');

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    logger.error({ error, userId: req.userId }, '❌ Failed to delete contact');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete contact',
    });
  }
});

export default router;
