import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { createLogger } from '@silentsiren/logger';
import { emergencyEventRepository } from '../repositories/emergency.repository';
import { z } from 'zod';

const router = Router();
const logger = createLogger('emergency-routes');

const triggerEmergencySchema = z.object({
  eventType: z.enum(['VOICE_TRIGGER', 'MANUAL', 'PANIC_BUTTON']).default('MANUAL'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  audioUrl: z.string().optional(),
  transcript: z.string().optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
  aiReasoning: z.string().optional(),
  detectedPatterns: z.array(z.string()).optional(),
  emotionalStress: z.number().min(0).max(1).optional(),
  threatLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
});

router.post(
  '/trigger',
  authenticate,
  strictRateLimiter,
  async (req: AuthRequest, res: Response) => {
    let traceId: string | undefined;

    try {
      const validation = triggerEmergencySchema.safeParse(req.body);

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

      logger.info({ userId: req.userId }, 'Emergency trigger received');

      // Start Antigravity trace session
      const { antigravityTrace } = await import('../services/antigravity/antigravityTrace');
      const { confidenceScorer } = await import('../services/antigravity/confidenceScorer');
      const { antigravityTraceLogger } = await import('../services/antigravity/traceLogger');

      traceId = antigravityTrace.startEmergencyTrace({
        userId: req.userId!,
        sessionId: req.headers['x-session-id'] as string,
        eventType: data.eventType,
        location: data.latitude && data.longitude ? {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10,
          address: data.address,
        } : undefined,
        audioUrl: data.audioUrl,
        transcript: data.transcript,
      });

      // Log emergency response phase
      antigravityTrace.logEmergencyResponse(traceId, 'DETECTION', 'STARTED', {
        eventType: data.eventType,
        threatLevel: data.threatLevel,
      });

      // Create emergency event in database
      const event = await emergencyEventRepository.create({
        user_id: req.userId!,
        event_type: data.eventType,
        threat_level: data.threatLevel,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        audio_url: data.audioUrl,
        transcript: data.transcript,
        ai_confidence: data.aiConfidence,
        ai_reasoning: data.aiReasoning,
        detected_patterns: data.detectedPatterns,
        emotional_stress: data.emotionalStress,
        dispatch_recommended: data.threatLevel === 'HIGH' || data.threatLevel === 'CRITICAL',
      });

      logger.info({ userId: req.userId, eventId: event.id, traceId }, 'Emergency event created');

      // Classify emergency type
      const { emergencyClassifier } = await import('../services/antigravity/emergencyClassifier');
      const classification = emergencyClassifier.classifyEmergency(
        data.transcript || '',
        data.detectedPatterns || [],
        data.emotionalStress
      );

      // Log AI analysis with emergency type classification
      if (data.transcript && data.aiConfidence) {
        await antigravityTrace.logAIAnalysis(traceId, data.transcript, 'gemini-1.5-flash', {
          isCrisis: true,
          confidence: data.aiConfidence,
          threatLevel: data.threatLevel,
          emergencyType: classification.emergencyType,
          reasoning: `${classification.reasoning}. ${data.aiReasoning || 'Emergency detected'}`,
          detectedPatterns: data.detectedPatterns || [],
          emotionalStress: data.emotionalStress,
          recommendedActions: ['alert_contacts', 'notify_authorities'],
        });
      }

      // Calculate confidence score
      const confidenceScore = confidenceScorer.scoreAIAnalysis(
        data.aiConfidence || 0.8,
        data.detectedPatterns || [],
        data.emotionalStress,
        data.transcript?.length
      );

      // Log signal fusion
      antigravityTrace.logSignalFusion(traceId, {
        signals: [
          {
            source: 'ai_analysis',
            value: data.aiConfidence || 0.8,
            weight: 0.6,
            confidence: data.aiConfidence || 0.8,
          },
          {
            source: 'user_trigger',
            value: 1.0,
            weight: 0.3,
            confidence: 1.0,
          },
          {
            source: 'location',
            value: data.latitude && data.longitude ? 0.9 : 0.5,
            weight: 0.1,
            confidence: data.latitude && data.longitude ? 0.9 : 0.5,
          },
        ],
        fusedConfidence: confidenceScore.overallScore,
        fusedThreatLevel: data.threatLevel,
        reasoning: confidenceScore.reasoning,
      });

      antigravityTrace.logEmergencyResponse(traceId, 'DETECTION', 'COMPLETED', {
        eventId: event.id,
        confidenceScore: confidenceScore.overallScore,
        emergencyType: classification.emergencyType,
      });

      // Execute mobile actions (siren, recording, fullscreen)
      antigravityTrace.logEmergencyResponse(traceId, 'ALERT', 'STARTED', {
        phase: 'mobile_actions',
      });

      // Simulate mobile action: Trigger Siren
      const sirenActionId = antigravityTraceLogger.addAction(
        traceId,
        'Trigger Emergency Siren',
        'PENDING'
      );
      antigravityTraceLogger.updateAction(traceId, sirenActionId, 'IN_PROGRESS');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate action
      antigravityTraceLogger.updateAction(traceId, sirenActionId, 'COMPLETED', {
        volume: 'MAX',
        duration: '30s',
        pattern: 'emergency_alert',
      });

      // Simulate mobile action: Start Recording
      const recordingActionId = antigravityTraceLogger.addAction(
        traceId,
        'Start Emergency Recording',
        'PENDING'
      );
      antigravityTraceLogger.updateAction(traceId, recordingActionId, 'IN_PROGRESS');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate action
      antigravityTraceLogger.updateAction(traceId, recordingActionId, 'COMPLETED', {
        recordingType: 'audio_video',
        quality: 'high',
        storageLocation: 'secure_cloud',
      });

      // Simulate mobile action: Activate Fullscreen Alert
      const fullscreenActionId = antigravityTraceLogger.addAction(
        traceId,
        'Activate Fullscreen Emergency Mode',
        'PENDING'
      );
      antigravityTraceLogger.updateAction(traceId, fullscreenActionId, 'IN_PROGRESS');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate action
      antigravityTraceLogger.updateAction(traceId, fullscreenActionId, 'COMPLETED', {
        mode: 'emergency_lockscreen',
        features: ['sos_button', 'location_sharing', 'quick_contacts'],
        dismissible: false,
      });

      antigravityTrace.logEmergencyResponse(traceId, 'ALERT', 'COMPLETED', {
        phase: 'mobile_actions',
        actionsExecuted: 3,
      });

      // Import alert retry manager
      const { alertRetryManager } = await import('../services/antigravity/alertRetry');

      // Send alerts based on threat level with retry and fallback
      antigravityTrace.logEmergencyResponse(traceId, 'ALERT', 'STARTED', {
        phase: 'stakeholder_notifications',
        threatLevel: data.threatLevel,
        emergencyType: classification.emergencyType,
      });

      const { fcmService } = await import('../services/fcm.service');
      const { emergencyContactRepository } = await import('../repositories/emergencyContact.repository');

      // Get emergency contacts based on threat level
      const contacts = await emergencyContactRepository.getContactsForThreatLevel(
        req.userId!,
        data.threatLevel
      );

      const emergencyData = {
        eventId: event.id,
        threatLevel: data.threatLevel,
        location: data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : undefined,
        address: data.address,
      };

      // Collect FCM tokens from contacts
      const fcmTokens = Array.from(new Set([
        ...contacts.sms.map(c => c.fcm_token).filter(Boolean) as string[],
        ...contacts.whatsapp.map(c => c.fcm_token).filter(Boolean) as string[],
        ...contacts.call.map(c => c.fcm_token).filter(Boolean) as string[],
      ]));

      const fallbacks: any[] = [];

      if (contacts.sms.length > 0) {
        fallbacks.push({
          type: 'SMS',
          recipients: contacts.sms.map(c => c.phone_number),
          fn: async () => {
            const { twilioService } = await import('../services/twilio.service');
            return Promise.all(
              contacts.sms.map(c =>
                twilioService.sendEmergencySMS({
                  recipientPhone: c.phone_number,
                  recipientName: c.name || 'Emergency Contact',
                  latitude: emergencyData.location?.latitude,
                  longitude: emergencyData.location?.longitude,
                  threatLevel: emergencyData.threatLevel,
                  transcript: data.transcript,
                })
              )
            );
          }
        });
      }

      if (contacts.whatsapp.length > 0) {
        fallbacks.push({
          type: 'WHATSAPP',
          recipients: contacts.whatsapp.map(c => c.phone_number),
          fn: async () => {
            const { twilioService } = await import('../services/twilio.service');
            return Promise.all(
              contacts.whatsapp.map(c =>
                twilioService.sendEmergencyWhatsApp({
                  recipientPhone: c.phone_number,
                  recipientName: c.name || 'Emergency Contact',
                  latitude: emergencyData.location?.latitude,
                  longitude: emergencyData.location?.longitude,
                  threatLevel: emergencyData.threatLevel,
                  transcript: data.transcript,
                })
              )
            );
          }
        });
      }

      if (contacts.call.length > 0) {
        fallbacks.push({
          type: 'VOICE_CALL',
          recipients: contacts.call.map(c => c.phone_number),
          fn: async () => {
            const { twilioService } = await import('../services/twilio.service');
            return Promise.all(
              contacts.call.map(c =>
                twilioService.makeEmergencyCall({
                  recipientPhone: c.phone_number,
                  recipientName: c.name || 'Emergency Contact',
                  latitude: emergencyData.location?.latitude,
                  longitude: emergencyData.location?.longitude,
                  threatLevel: emergencyData.threatLevel,
                  transcript: data.transcript,
                })
              )
            );
          }
        });
      }

      // Determine primary channel: FCM if tokens are available, otherwise fall back to first active twilio channel
      let primaryChannel: any;
      if (fcmService.isConfigured() && fcmTokens.length > 0) {
        primaryChannel = {
          type: 'FCM_PUSH',
          recipients: fcmTokens,
          fn: async () => fcmService.sendEmergencyAlert(fcmTokens, {
             eventId: emergencyData.eventId,
             threatLevel: emergencyData.threatLevel,
             location: emergencyData.location ? `${emergencyData.location.latitude}, ${emergencyData.location.longitude}` : undefined,
             userName: 'A user'
          }),
        };
      } else if (fallbacks.length > 0) {
        primaryChannel = fallbacks.shift();
      }

      if (primaryChannel) {
        logger.info({
          primaryType: primaryChannel.type,
          fallbackCount: fallbacks.length,
          traceId
        }, 'Executing alert fallback chain');

        const fallbackChain = {
          primary: primaryChannel,
          fallbacks: fallbacks,
        };

        const result = await alertRetryManager.executeWithFallback(traceId, fallbackChain);

        logger.info({
          success: result.success,
          channelUsed: result.channelUsed,
          traceId,
        }, 'Alert execution completed');
      } else {
        logger.warn({ traceId }, 'No emergency contacts or channels found for alerts');
      }

      antigravityTrace.logEmergencyResponse(traceId, 'ALERT', 'COMPLETED', {
        phase: 'stakeholder_notifications',
        contactsNotified: fcmTokens.length + contacts.sms.length + contacts.whatsapp.length + contacts.call.length,
      });

      // Send to nearby users for community validation (HIGH/CRITICAL only)
      if ((data.threatLevel === 'HIGH' || data.threatLevel === 'CRITICAL') && data.latitude && data.longitude) {
        const { notificationService } = await import('../services/notification.service');
        notificationService.sendCommunityValidationRequest(
          event.id,
          {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
          },
          5 // 5km radius
        ).catch((err: any) => {
          logger.error('Failed to send community validation notification', { error: err, traceId });
        });
      }

      // End trace session
      antigravityTrace.endEmergencyTrace(
        traceId,
        'Emergency Processed Successfully',
        'COMPLETED'
      );

      res.json({
        success: true,
        data: {
          eventId: event.id,
          traceId: traceId,
          status: event.status,
          threatLevel: event.threat_level,
          dispatchRecommended: event.dispatch_recommended,
          message: 'Emergency event created successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error, traceId }, 'Emergency trigger failed');

      // Log error to trace if available
      if (traceId) {
        const { antigravityTrace } = await import('../services/antigravity/antigravityTrace');
        antigravityTrace.logEmergencyResponse(traceId, 'DETECTION', 'FAILED', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        antigravityTrace.endEmergencyTrace(
          traceId,
          'Emergency Processing Failed',
          'FAILED'
        );
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'EMERGENCY_TRIGGER_FAILED',
          message: 'Failed to process emergency trigger',
        },
      });
    }
  }
);

router.post('/cancel/:eventId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to user
    const event = await emergencyEventRepository.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Emergency event not found',
        },
      });
    }

    if (event.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this event',
        },
      });
    }

    // Update event status to false alarm
    await emergencyEventRepository.update(eventId, {
      status: 'FALSE_ALARM',
      user_verified: false,
    });

    logger.info({ userId: req.userId, eventId }, 'Emergency cancelled');

    res.json({
      success: true,
      data: {
        eventId,
        status: 'FALSE_ALARM',
        message: 'Emergency event cancelled successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Emergency cancellation failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCELLATION_FAILED',
        message: 'Failed to cancel emergency',
      },
    });
  }
});

router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const events = await emergencyEventRepository.findByUserId(req.userId!, 50);

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch emergency history');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch emergency history',
      },
    });
  }
});

router.get('/statistics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await emergencyEventRepository.getStatistics(req.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch statistics');
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch statistics',
      },
    });
  }
});

export default router;
