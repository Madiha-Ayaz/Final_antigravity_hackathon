import { Router, Response } from 'express';
import { optionalAuthenticate, AuthRequest } from '../middleware/optionalAuth';
import { Pool } from 'pg';
import { createLogger } from '@silentsiren/logger';

const router = Router();
const logger = createLogger('contacts-neon');

// Direct Neon DB connection
const getPool = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

/**
 * Ensure contacts table exists
 */
async function ensureTable(): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) DEFAULT 'anonymous',
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        relationship VARCHAR(100),
        priority INTEGER DEFAULT 1,
        notify_whatsapp BOOLEAN DEFAULT true,
        notify_sms BOOLEAN DEFAULT true,
        notify_call BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } finally {
    await pool.end();
  }
}

/**
 * POST /api/contacts-neon/add
 * Add emergency contact to Neon DB
 */
router.post('/add', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const pool = getPool();
  try {
    await ensureTable();

    const { name, phoneNumber, relationship, notifyWhatsapp, notifySms, notifyCall } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Name and phone number required' });
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const userId = req.userId || 'anonymous';

    const result = await pool.query(
      `INSERT INTO emergency_contacts (user_id, name, phone_number, relationship, priority, notify_whatsapp, notify_sms, notify_call)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        name,
        formattedPhone,
        relationship || 'Other',
        1,
        notifyWhatsapp !== false,
        notifySms !== false,
        notifyCall === true,
      ]
    );

    logger.info({ contactId: result.rows[0].id, name }, 'Contact saved to Neon DB');

    res.json({
      success: true,
      contact: result.rows[0],
      message: 'Contact saved successfully',
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to add contact');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
});

/**
 * GET /api/contacts-neon/list
 * Get all contacts from Neon DB
 */
router.get('/list', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const pool = getPool();
  try {
    await ensureTable();

    const userId = req.userId || 'anonymous';

    const result = await pool.query(
      'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY priority ASC, created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      contacts: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch contacts');
    res.status(500).json({ success: false, error: error.message, contacts: [] });
  } finally {
    await pool.end();
  }
});

/**
 * DELETE /api/contacts-neon/:id
 * Delete contact from Neon DB
 */
router.delete('/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const pool = getPool();
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM emergency_contacts WHERE id = $1', [id]);

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete contact');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
});

/**
 * PATCH /api/contacts-neon/:id
 * Update contact in Neon DB
 */
router.patch('/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const pool = getPool();
  try {
    const { id } = req.params;
    const { name, phoneNumber, relationship, notifyWhatsapp, notifySms, notifyCall } = req.body;

    const result = await pool.query(
      `UPDATE emergency_contacts
       SET name = COALESCE($1, name),
           phone_number = COALESCE($2, phone_number),
           relationship = COALESCE($3, relationship),
           notify_whatsapp = COALESCE($4, notify_whatsapp),
           notify_sms = COALESCE($5, notify_sms),
           notify_call = COALESCE($6, notify_call)
       WHERE id = $7
       RETURNING *`,
      [name, phoneNumber, relationship, notifyWhatsapp, notifySms, notifyCall, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, contact: result.rows[0] });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update contact');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
});

export default router;
