import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';
import { z } from 'zod';
import * as admin from 'firebase-admin';

const router = Router();
const logger = createLogger('location-routes');

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  eventId: z.string().optional(),
});

router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = locationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid location data',
        },
      });
    }

    const { latitude, longitude, accuracy, heading, speed, eventId } = validation.data;

    if (admin.apps.length > 0) {
      const db = admin.firestore();

      await db.collection('location_history').add({
        userId: req.userId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        heading: heading || null,
        speed: speed || null,
        eventId: eventId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.debug({ userId: req.userId, latitude, longitude }, 'Location synced to Firestore');
    } else {
      logger.warn('Firebase Admin not initialized, skipping location sync');
    }

    res.json({
      success: true,
      message: 'Location synced',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to sync location');
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync location',
      },
    });
  }
});

export default router;
