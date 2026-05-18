import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
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
  carrier: z.string().optional(), // For free SMS
});

/**
 * POST /api/emergency-contacts/add
 * Simple endpoint to add emergency contact (no strict validation)
 */
router.post('/add', authenticate, async (req: AuthRequest, res: Response) => {
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

    const { name, phoneNumber, relationship, carrier } = validation.data;

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Add + if not present
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const db = databaseService.getPool();

    const result = await db.query(
      `INSERT INTO emergency_contacts (
        user_id,
        name,
        phone_number,
        relationship,
        carrier,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [req.userId, name, formattedPhone, relationship, carrier || null]
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
router.get('/list', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info({ userId: req.userId }, '📋 Fetching emergency contacts');

    const db = databaseService.getPool();

    const result = await db.query(
      `SELECT id, name, phone_number, relationship, carrier, created_at
       FROM emergency_contacts
       WHERE user_id = $1 AND is_active = true
       ORDER BY priority ASC, created_at DESC`,
      [req.userId]
    );

    const contacts = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      relationship: row.relationship,
      carrier: row.carrier,
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
router.delete('/:contactId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    logger.info({ userId: req.userId, contactId }, '🗑️ Deleting contact');

    const db = databaseService.getPool();

    // Verify ownership
    const checkResult = await db.query(
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
    await db.query(
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
