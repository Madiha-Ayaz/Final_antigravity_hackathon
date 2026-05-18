import { createLogger } from '@silentsiren/logger';
import { geminiService } from './gemini.service';
import { whatsAppService } from './whatsapp.service';
import { emergencyClassifier } from './antigravity/emergencyClassifier';
import { audioStorageService } from './audioStorage.service';
import { freeSMSService } from './freeSMS.service';
import type { AIAnalysisResult } from '@silentsiren/shared-types';

const logger = createLogger('voice-threat-detection');

export interface ThreatDetectionResult {
  isThreat: boolean;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  transcript: string;
  reasoning: string;
  emergencyType?: string;
  shouldTriggerSiren: boolean;
  shouldCallAmbulance: boolean;
}

export interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

class VoiceThreatDetectionService {
  private activeCountdowns: Map<string, NodeJS.Timeout> = new Map();
  private sirenActive: Map<string, boolean> = new Map();

  /**
   * Analyze voice audio for threats using Gemini AI
   */
  async analyzeVoiceForThreat(audioBuffer: Buffer, userId: string): Promise<ThreatDetectionResult> {
    try {
      logger.info({ userId }, 'Analyzing voice for threats');

      // Use Gemini to analyze audio
      const analysis: AIAnalysisResult = await geminiService.analyzeWithRetry(audioBuffer, 3, 1000);

      // Classify emergency type
      const classification = emergencyClassifier.classifyEmergency(
        analysis.reasoning,
        analysis.detectedPatterns,
        analysis.emotionalStress
      );

      // Determine if this is a real threat
      const isThreat = this.determineThreatStatus(analysis);
      const shouldTriggerSiren = isThreat && (analysis.threatLevel === 'HIGH' || analysis.threatLevel === 'CRITICAL');
      const shouldCallAmbulance = classification.emergencyType === 'MEDICAL' ||
                                   classification.emergencyType === 'ACCIDENT' ||
                                   analysis.threatLevel === 'CRITICAL';

      const result: ThreatDetectionResult = {
        isThreat,
        threatLevel: analysis.threatLevel,
        confidence: analysis.confidence,
        transcript: analysis.reasoning,
        reasoning: classification.reasoning,
        emergencyType: classification.emergencyType,
        shouldTriggerSiren,
        shouldCallAmbulance,
      };

      logger.info({ userId, result }, 'Voice threat analysis complete');

      return result;
    } catch (error) {
      logger.error({ error, userId }, 'Voice threat analysis failed');
      throw error;
    }
  }

  /**
   * Determine if analysis indicates a real threat
   */
  private determineThreatStatus(analysis: AIAnalysisResult): boolean {
    // High confidence and high/critical threat level
    if (analysis.confidence >= 0.7 && (analysis.threatLevel === 'HIGH' || analysis.threatLevel === 'CRITICAL')) {
      return true;
    }

    // Dispatch recommended by AI
    if (analysis.dispatchRecommended && analysis.confidence >= 0.6) {
      return true;
    }

    // Strong emotional stress with panic indicators
    if (analysis.emotionalStress >= 0.8 && (analysis.audioFeatures.hasPanic || analysis.audioFeatures.hasScream)) {
      return true;
    }

    return false;
  }

  /**
   * Start emergency countdown (2 minutes before sending alerts)
   */
  async startEmergencyCountdown(
    userId: string,
    threatData: ThreatDetectionResult,
    contacts: EmergencyContact[],
    location?: LocationData
  ): Promise<{ countdownId: string; expiresAt: Date }> {
    const countdownId = `countdown_${userId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    logger.info({ userId, countdownId, expiresAt }, 'Starting emergency countdown');

    // Set countdown timer
    const timeout = setTimeout(async () => {
      logger.info({ userId, countdownId }, 'Countdown expired - sending emergency alerts');

      try {
        await this.sendEmergencyAlerts(userId, threatData, contacts, location);

        // Call ambulance if needed
        if (threatData.shouldCallAmbulance) {
          await this.callAmbulance(userId, location);
        }
      } catch (error) {
        logger.error({ error, userId, countdownId }, 'Failed to send emergency alerts after countdown');
      } finally {
        this.activeCountdowns.delete(countdownId);
        this.sirenActive.delete(userId);
      }
    }, 2 * 60 * 1000); // 2 minutes

    this.activeCountdowns.set(countdownId, timeout);
    this.sirenActive.set(userId, true);

    return { countdownId, expiresAt };
  }

  /**
   * Cancel emergency countdown (user clicked "I'm Safe")
   */
  async cancelEmergencyCountdown(
    userId: string,
    countdownId: string,
    contacts: EmergencyContact[],
    location?: LocationData
  ): Promise<void> {
    logger.info({ userId, countdownId }, 'Cancelling emergency countdown - user is safe');

    // Clear the countdown timer
    const timeout = this.activeCountdowns.get(countdownId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeCountdowns.delete(countdownId);
    }

    // Stop siren
    this.sirenActive.delete(userId);

    // Send "I'm Safe" message to all contacts
    await this.sendSafeMessage(userId, contacts, location);
  }

  /**
   * Send "I'm Safe" message to all emergency contacts
   */
  private async sendSafeMessage(
    userId: string,
    contacts: EmergencyContact[],
    location?: LocationData
  ): Promise<void> {
    logger.info({ userId, contactCount: contacts.length }, 'Sending "I am safe" messages');

    const safeMessage = this.formatSafeMessage(location);

    const results = await Promise.allSettled(
      contacts.map(contact =>
        whatsAppService.sendMessage({
          to: contact.phoneNumber,
          message: safeMessage.replace('{name}', contact.name),
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info({ userId, successful, total: contacts.length }, '"I am safe" messages sent');
  }

  /**
   * Format "I'm Safe" message
   */
  private formatSafeMessage(location?: LocationData): string {
    let message = `✅ *I AM SAFE* ✅\n\n`;
    message += `Hi {name},\n\n`;
    message += `This is an automated message from SilentSiren AI.\n\n`;
    message += `The emergency alert was cancelled by the user.\n`;
    message += `*Status:* User confirmed they are safe.\n\n`;

    if (location) {
      message += `📍 *Current Location:*\n`;
      message += `Lat: ${location.latitude.toFixed(6)}\n`;
      message += `Lng: ${location.longitude.toFixed(6)}\n`;
      if (location.address) {
        message += `Address: ${location.address}\n`;
      }
      message += `https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    }

    message += `⏰ Time: ${new Date().toLocaleString()}\n\n`;
    message += `_Sent via SilentSiren AI Safety System_`;

    return message;
  }

  /**
   * Send emergency alerts to all contacts via WhatsApp
   */
  private async sendEmergencyAlerts(
    userId: string,
    threatData: ThreatDetectionResult,
    contacts: EmergencyContact[],
    location?: LocationData
  ): Promise<void> {
    logger.info({ userId, contactCount: contacts.length }, 'Sending emergency alerts');

    const alertMessage = this.formatEmergencyAlert(threatData, location);

    const results = await Promise.allSettled(
      contacts.map(contact =>
        whatsAppService.sendMessage({
          to: contact.phoneNumber,
          message: alertMessage.replace('{name}', contact.name),
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info({ userId, successful, total: contacts.length }, 'Emergency alerts sent');
  }

  /**
   * Format emergency alert message
   */
  private formatEmergencyAlert(threatData: ThreatDetectionResult, location?: LocationData): string {
    let message = `🚨 *EMERGENCY ALERT* 🚨\n\n`;
    message += `Hi {name},\n\n`;
    message += `*URGENT: Emergency Detected!*\n\n`;
    message += `*Threat Level:* ${threatData.threatLevel}\n`;
    message += `*Emergency Type:* ${threatData.emergencyType || 'UNKNOWN'}\n`;
    message += `*Confidence:* ${(threatData.confidence * 100).toFixed(0)}%\n`;
    message += `*Analysis:* ${threatData.reasoning}\n\n`;

    if (location) {
      message += `📍 *LOCATION:*\n`;
      message += `Lat: ${location.latitude.toFixed(6)}\n`;
      message += `Lng: ${location.longitude.toFixed(6)}\n`;
      if (location.address) {
        message += `Address: ${location.address}\n`;
      }
      message += `https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    }

    message += `⏰ Time: ${new Date().toLocaleString()}\n\n`;
    message += `⚠️ *ACTION REQUIRED:*\n`;
    message += `Please check on this person IMMEDIATELY!\n`;

    if (threatData.shouldCallAmbulance) {
      message += `🚑 Ambulance has been automatically contacted.\n`;
    }

    message += `\n_Automated alert from SilentSiren AI_`;

    return message;
  }

  /**
   * Call ambulance/emergency services
   */
  private async callAmbulance(userId: string, location?: LocationData): Promise<void> {
    logger.info({ userId, location }, 'Calling ambulance/emergency services');

    const emergencyNumber = process.env.EMERGENCY_CONTACT_NUMBER || '+923452508043';

    try {
      // Send WhatsApp message to emergency services
      let message = `🚑 *EMERGENCY - AMBULANCE NEEDED* 🚑\n\n`;
      message += `*Automated Emergency Call from SilentSiren AI*\n\n`;
      message += `*User ID:* ${userId}\n`;
      message += `*Time:* ${new Date().toLocaleString()}\n\n`;

      if (location) {
        message += `📍 *LOCATION:*\n`;
        message += `Latitude: ${location.latitude.toFixed(6)}\n`;
        message += `Longitude: ${location.longitude.toFixed(6)}\n`;
        if (location.address) {
          message += `Address: ${location.address}\n`;
        }
        message += `Google Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
      }

      message += `⚠️ *IMMEDIATE MEDICAL ASSISTANCE REQUIRED*\n`;
      message += `Please dispatch ambulance to the location above.`;

      await whatsAppService.sendMessage({
        to: emergencyNumber,
        message,
      });

      logger.info({ userId }, 'Ambulance call message sent successfully');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to call ambulance');
      throw error;
    }
  }

  /**
   * Check if siren is active for user
   */
  isSirenActive(userId: string): boolean {
    return this.sirenActive.get(userId) || false;
  }

  /**
   * Get active countdown for user
   */
  getActiveCountdown(userId: string): string | null {
    for (const [countdownId, _] of this.activeCountdowns.entries()) {
      if (countdownId.includes(userId)) {
        return countdownId;
      }
    }
    return null;
  }

  /**
   * Force stop siren
   */
  stopSiren(userId: string): void {
    this.sirenActive.delete(userId);
    logger.info({ userId }, 'Siren stopped');
  }
}

export const voiceThreatDetectionService = new VoiceThreatDetectionService();
