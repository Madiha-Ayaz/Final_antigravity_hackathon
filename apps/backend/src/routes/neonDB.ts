import { Router, Response } from 'express';
import { optionalAuthenticate, AuthRequest } from '../middleware/optionalAuth';
import { neonDBService } from '../services/neonDB.service';
import { createLogger } from '@silentsiren/logger';

const router = Router();
const logger = createLogger('neon-db-routes');

/**
 * GET /api/neon/audit-logs
 * Get audit logs from Neon DB
 */
router.get('/audit-logs', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.query.userId as string;

    const logs = await neonDBService.getAuditLogs(limit, offset, userId);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch audit logs');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/neon/audit-logs
 * Create audit log entry
 */
router.post('/audit-logs', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { action, targetUserId, resourceId, resourceType, metadata, errorMessage } = req.body;

    const id = await neonDBService.logAudit({
      action,
      userId: req.userId,
      targetUserId,
      resourceId,
      resourceType,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: errorMessage ? 'failure' : 'success',
      metadata,
      errorMessage,
    });

    res.json({ success: true, id });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create audit log');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/neon/dispatch-logs
 * Get dispatch logs from Neon DB
 */
router.get('/dispatch-logs', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await neonDBService.getDispatchLogs(limit, offset);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch dispatch logs');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/neon/dispatch-logs
 * Create dispatch log entry
 */
router.post('/dispatch-logs', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, dispatchType, recipientPhone, recipientName, message, threatLevel, latitude, longitude, status, provider, providerMessageId, errorMessage } = req.body;

    const id = await neonDBService.logDispatch({
      eventId,
      userId: req.userId,
      dispatchType,
      recipientPhone,
      recipientName,
      message,
      threatLevel,
      latitude,
      longitude,
      status,
      provider,
      providerMessageId,
      errorMessage,
    });

    res.json({ success: true, id });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create dispatch log');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/neon/community-validations
 * Get community validations from Neon DB
 */
router.get('/community-validations', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const alertId = req.query.alertId ? parseInt(req.query.alertId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const validations = await neonDBService.getValidations(alertId, limit);

    res.json({
      success: true,
      data: validations,
      total: validations.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch validations');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/neon/community-validations
 * Add community validation
 */
router.post('/community-validations', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { alertId, validatorId, validationType, isValid, confidence, comment, latitude, longitude } = req.body;

    const id = await neonDBService.addValidation({
      alertId,
      userId: req.userId || 'anonymous',
      validatorId,
      validationType,
      isValid,
      confidence,
      comment,
      latitude,
      longitude,
    });

    res.json({ success: true, id });
  } catch (error: any) {
    logger.error({ error }, 'Failed to add validation');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/neon/emergency-events
 * Get emergency events from Neon DB
 */
router.get('/emergency-events', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await neonDBService.getEmergencyEvents(limit, offset, req.userId);

    res.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch emergency events');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/neon/emergency-events
 * Create emergency event in Neon DB
 */
router.post('/emergency-events', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, threatLevel, confidence, transcript, reasoning, category, latitude, longitude, address, audioUrl, contactsNotified, whatsappSent, smsSent, callMade } = req.body;

    const id = await neonDBService.createEmergencyEvent({
      userId: req.userId,
      eventType,
      threatLevel,
      confidence,
      transcript,
      reasoning,
      category,
      latitude,
      longitude,
      address,
      audioUrl,
      contactsNotified,
      whatsappSent,
      smsSent,
      callMade,
    });

    res.json({ success: true, id });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create emergency event');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/neon/emergency-events/:id
 * Update emergency event status
 */
router.patch('/emergency-events/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await neonDBService.updateEventStatus(parseInt(id), status);

    res.json({ success: true, message: 'Event status updated' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update event');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/neon/statistics
 * Get overall statistics from Neon DB
 */
router.get('/statistics', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await neonDBService.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch statistics');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
