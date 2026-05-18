import { Router } from 'express';
import emergencyRoutes from './emergency';
import authRoutes from './auth';
import userRoutes from './user';
import aiRoutes from './ai';
import dispatchRoutes from './dispatch';
import validatorRoutes from './validator';
import healthRoutes from './health';
import workflowRoutes from './workflow';
import crisisRoutes from './crisis';
import fcmRoutes from './fcm';
import emergencyContactsRoutes from './emergencyContacts';
import tracesRoutes from './traces';
import locationRoutes from './location';
import whatsappRoutes from './whatsapp';
import auditRoutes from './audit';
import abuseRoutes from './abuse';
import voiceThreatRoutes from './voiceThreat';
import emergencySMSRoutes from './emergencySMS';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/contacts/emergency', emergencyContactsRoutes);
router.use('/traces', tracesRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);
router.use('/dispatch', dispatchRoutes);
router.use('/validator', validatorRoutes);
router.use('/workflow', workflowRoutes);
router.use('/crisis', crisisRoutes);
router.use('/fcm', fcmRoutes);
router.use('/location', locationRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/audit', auditRoutes);
router.use('/abuse', abuseRoutes);
router.use('/voice-threat', voiceThreatRoutes);
router.use('/emergency-sms', emergencySMSRoutes);


export default router;
