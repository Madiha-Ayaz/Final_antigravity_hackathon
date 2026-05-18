import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createLogger } from '@silentsiren/logger';

const router = Router();
const logger = createLogger('user-routes');

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info({ userId: req.userId }, 'Profile fetch');

    res.json({
      success: true,
      data: {
        userId: req.userId,
        phoneNumber: '+1234567890',
        trustedContacts: [],
        isVerified: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Profile fetch failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch profile',
      },
    });
  }
});

router.post('/trusted-contacts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phoneNumber, priority } = req.body;
    logger.info({ userId: req.userId, name, phoneNumber }, 'Adding trusted contact');

    res.json({
      success: true,
      data: {
        contactId: 'temp-contact-id',
        name,
        phoneNumber,
        priority,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to add trusted contact');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_CONTACT_FAILED',
        message: 'Failed to add trusted contact',
      },
    });
  }
});

export default router;
