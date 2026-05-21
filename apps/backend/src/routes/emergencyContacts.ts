import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { emergencyContactRepository } from '../repositories/emergencyContact.repository';
import { z } from 'zod';

const router = Router();
const logger = createLogger('emergency-contact-routes');

const createContactSchema = z.object({
  name: z.string().min(1).max(255),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
  relationship: z.string().min(1).max(100),
  priority: z.number().int().min(1).optional(),
  notifySms: z.boolean().optional(),
  notifyCall: z.boolean().optional(),
  notifyWhatsapp: z.boolean().optional(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .optional(),
  relationship: z.string().min(1).max(100).optional(),
  priority: z.number().int().min(1).optional(),
  notifySms: z.boolean().optional(),
  notifyCall: z.boolean().optional(),
  notifyWhatsapp: z.boolean().optional(),
});

/**
 * POST /api/contacts/emergency
 * Create new emergency contact
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createContactSchema.safeParse(req.body);

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

    const data = validation.data;

    const contact = await emergencyContactRepository.create({
      user_id: req.userId!,
      name: data.name,
      phone_number: data.phoneNumber,
      relationship: data.relationship,
      priority: data.priority,
      notify_sms: data.notifySms,
      notify_call: data.notifyCall,
      notify_whatsapp: data.notifyWhatsapp,
    });

    logger.info({ userId: req.userId, contactId: contact.id }, 'Emergency contact created');

    res.status(201).json({
      success: true,
      data: contact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create emergency contact');
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create emergency contact',
      },
    });
  }
});

/**
 * GET /api/contacts/emergency
 * Get all emergency contacts for user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await emergencyContactRepository.findByUserId(req.userId!);

    res.json({
      success: true,
      data: {
        contacts,
        count: contacts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch emergency contacts');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch emergency contacts',
      },
    });
  }
});

/**
 * GET /api/contacts/emergency/:contactId
 * Get specific emergency contact
 */
router.get('/:contactId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    const contact = await emergencyContactRepository.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Emergency contact not found',
        },
      });
    }

    // Verify ownership
    if (contact.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this contact',
        },
      });
    }

    res.json({
      success: true,
      data: contact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch emergency contact');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch emergency contact',
      },
    });
  }
});

/**
 * PUT /api/contacts/emergency/:contactId
 * Update emergency contact
 */
router.put('/:contactId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    const validation = updateContactSchema.safeParse(req.body);

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

    // Verify contact exists and belongs to user
    const existingContact = await emergencyContactRepository.findById(contactId);

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Emergency contact not found',
        },
      });
    }

    if (existingContact.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this contact',
        },
      });
    }

    const data = validation.data;

    const updatedContact = await emergencyContactRepository.update(contactId, {
      name: data.name,
      phone_number: data.phoneNumber,
      relationship: data.relationship,
      priority: data.priority,
      notify_sms: data.notifySms,
      notify_call: data.notifyCall,
      notify_whatsapp: data.notifyWhatsapp,
    });

    logger.info({ userId: req.userId, contactId }, 'Emergency contact updated');

    res.json({
      success: true,
      data: updatedContact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update emergency contact');
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update emergency contact',
      },
    });
  }
});

/**
 * DELETE /api/contacts/emergency/:contactId
 * Delete (deactivate) emergency contact
 */
router.delete('/:contactId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;

    // Verify contact exists and belongs to user
    const existingContact = await emergencyContactRepository.findById(contactId);

    if (!existingContact) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Emergency contact not found',
        },
      });
    }

    if (existingContact.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this contact',
        },
      });
    }

    await emergencyContactRepository.delete(contactId);

    logger.info({ userId: req.userId, contactId }, 'Emergency contact deleted');

    res.json({
      success: true,
      data: {
        contactId,
        message: 'Emergency contact deleted successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to delete emergency contact');
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete emergency contact',
      },
    });
  }
});

export default router;
