import { createLogger } from '@silentsiren/logger';
import axios from 'axios';

const logger = createLogger('whatsapp-service');

const TEXTMEBOT_API_KEY = process.env.NEXT_PUBLIC_TEXTMEBOT_API_KEY || '';
const TEXTMEBOT_API_URL = 'https://api.textmebot.com/send.php';

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string; // For voice/image messages
}

export interface WhatsAppVoiceMessage {
  to: string;
  audioUrl: string;
  caption?: string;
}

class WhatsAppService {
  /**
   * Send text message via WhatsApp
   */
  async sendMessage(data: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!TEXTMEBOT_API_KEY) {
        logger.error('TextMeBot API key not configured');
        return { success: false, error: 'WhatsApp service not configured' };
      }

      logger.info({ to: data.to }, 'Sending WhatsApp message');

      const response = await axios.post(TEXTMEBOT_API_URL, null, {
        params: {
          recipient: data.to,
          apikey: TEXTMEBOT_API_KEY,
          text: data.message,
        },
      });

      if (response.data && response.data.includes('Success')) {
        logger.info({ to: data.to }, 'WhatsApp message sent successfully');
        return {
          success: true,
          messageId: `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };
      }

      logger.error({ response: response.data }, 'Failed to send WhatsApp message');
      return { success: false, error: 'Failed to send message' };
    } catch (error) {
      logger.error({ error }, 'WhatsApp service error');
      return { success: false, error: 'Service error' };
    }
  }

  /**
   * Send voice message via WhatsApp
   */
  async sendVoiceMessage(data: WhatsAppVoiceMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!TEXTMEBOT_API_KEY) {
        logger.error('TextMeBot API key not configured');
        return { success: false, error: 'WhatsApp service not configured' };
      }

      logger.info({ to: data.to, audioUrl: data.audioUrl }, 'Sending WhatsApp voice message');

      // Send voice message with media URL
      const response = await axios.post(TEXTMEBOT_API_URL, null, {
        params: {
          recipient: data.to,
          apikey: TEXTMEBOT_API_KEY,
          text: data.caption || '🎤 Voice Alert from SilentSiren AI',
          media: data.audioUrl,
        },
      });

      if (response.data && response.data.includes('Success')) {
        logger.info({ to: data.to }, 'WhatsApp voice message sent successfully');
        return {
          success: true,
          messageId: `wa_voice_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };
      }

      logger.error({ response: response.data }, 'Failed to send WhatsApp voice message');
      return { success: false, error: 'Failed to send voice message' };
    } catch (error) {
      logger.error({ error }, 'WhatsApp voice service error');
      return { success: false, error: 'Service error' };
    }
  }

  /**
   * Send emergency alert to multiple contacts
   */
  async sendEmergencyAlert(
    contacts: Array<{ phoneNumber: string; name: string }>,
    alertData: {
      threatLevel: string;
      transcript: string;
      reasoning: string;
      confidence: number;
      location?: { latitude: number; longitude: number };
      audioUrl?: string;
    }
  ): Promise<{ sent: number; failed: number; results: Array<{ contact: string; success: boolean }> }> {
    const results: Array<{ contact: string; success: boolean }> = [];
    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      const message = this.formatEmergencyMessage(contact.name, alertData);

      const result = await this.sendMessage({
        to: contact.phoneNumber,
        message,
      });

      if (result.success) {
        sent++;
        results.push({ contact: contact.phoneNumber, success: true });

        // If audio URL is provided, send voice message too
        if (alertData.audioUrl) {
          await this.sendVoiceMessage({
            to: contact.phoneNumber,
            audioUrl: alertData.audioUrl,
            caption: '🎤 Recorded audio from emergency',
          });
        }
      } else {
        failed++;
        results.push({ contact: contact.phoneNumber, success: false });
      }

      // Small delay between messages to avoid rate limiting
      await this.delay(1000);
    }

    logger.info({ sent, failed }, 'Emergency alerts sent');
    return { sent, failed, results };
  }

  /**
   * Format emergency message
   */
  private formatEmergencyMessage(
    contactName: string,
    alertData: {
      threatLevel: string;
      transcript: string;
      reasoning: string;
      confidence: number;
      location?: { latitude: number; longitude: number };
    }
  ): string {
    let message = `🚨 *SILENT SIREN AI ALERT* 🚨\n\n`;
    message += `Hi ${contactName},\n\n`;
    message += `*Emergency Detected!*\n\n`;
    message += `*Threat Level:* ${alertData.threatLevel}\n`;
    message += `*Transcript:* "${alertData.transcript}"\n`;
    message += `*Reasoning:* ${alertData.reasoning}\n`;
    message += `*Confidence:* ${(alertData.confidence * 100).toFixed(0)}%\n\n`;

    if (alertData.location) {
      message += `📍 *Location:*\n`;
      message += `Lat: ${alertData.location.latitude.toFixed(6)}\n`;
      message += `Lng: ${alertData.location.longitude.toFixed(6)}\n`;
      message += `https://maps.google.com/?q=${alertData.location.latitude},${alertData.location.longitude}\n\n`;
    }

    message += `⚠️ This is an automated alert from SilentSiren AI.\n`;
    message += `Please check on the person immediately.`;

    return message;
  }

  /**
   * Send contact form message
   */
  async sendContactFormMessage(
    to: string,
    formData: {
      name: string;
      email: string;
      message: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `📝 *New Contact Form Submission*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Email:* ${formData.email}\n` +
      `${formData.phone ? `*Phone:* ${formData.phone}\n` : ''}` +
      `\n*Message:*\n${formData.message}\n\n` +
      `_Sent via SilentSiren AI Contact Form_`;

    return this.sendMessage({ to, message });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!TEXTMEBOT_API_KEY;
  }
}

export const whatsAppService = new WhatsAppService();
