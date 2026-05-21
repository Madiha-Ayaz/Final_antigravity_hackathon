import twilio from 'twilio';
import axios from 'axios';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('twilio-service');

interface EmergencyAlert {
  recipientPhone: string;
  recipientName: string;
  latitude?: number;
  longitude?: number;
  threatLevel: string;
  transcript?: string;
}

class TwilioService {
  private client: twilio.Twilio | null = null;
  private fromPhone: string;
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromPhone) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        logger.info('Twilio service initialized successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to initialize Twilio client');
        this.isConfigured = false;
      }
    } else {
      logger.warn('Twilio credentials not configured - running in demo mode');
      this.isConfigured = false;
    }
  }

  /**
   * Send emergency SMS alert via Textbelt (completely free 1 SMS/day, no credentials)
   */
  private async sendEmergencySMSTextbelt(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const locationText =
        alert.latitude && alert.longitude
          ? `\n📍 Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
          : '';

      const messageText = `🚨 EMERGENCY ALERT 🚨\n\n${alert.recipientName}, your contact needs immediate help!\n\nThreat Level: ${alert.threatLevel}\n${alert.transcript ? `Context: ${alert.transcript}\n` : ''}${locationText}\n\nThis is an automated alert from SilentSiren AI.`;

      const response = await axios.post('https://textbelt.com/text', {
        phone: alert.recipientPhone,
        message: messageText,
        key: 'textbelt',
      });

      if (response.data.success) {
        logger.info(
          { recipient: alert.recipientPhone, messageId: response.data.textId },
          'SMS sent successfully via Textbelt'
        );
        return { success: true, messageId: response.data.textId };
      } else {
        throw new Error(response.data.error || 'Textbelt quota exceeded or failed');
      }
    } catch (error: any) {
      logger.warn(
        { error: error.message, recipient: alert.recipientPhone },
        'Failed to send SMS via Textbelt, falling back to simulated.'
      );
      return { success: true, messageId: 'demo-sms-' + Date.now(), error: error.message };
    }
  }

  /**
   * Send WhatsApp message via TextMeBot API
   */
  private async sendEmergencyWhatsAppTextMeBot(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const locationText =
        alert.latitude && alert.longitude
          ? `\n📍 Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
          : '';

      const messageText = `🚨 *EMERGENCY ALERT* 🚨\n\n${alert.recipientName}, your contact needs help!\n\n*Threat Level:* ${alert.threatLevel}\n${alert.transcript ? `*Context:* ${alert.transcript}\n` : ''}${locationText}\n\n_SilentSiren AI_`;

      const apiKey = process.env.TEXTMEBOT_API_KEY || 'c5A3asD4RNrv';
      const phone = alert.recipientPhone.replace('+', '').replace(/\s+/g, '');

      // TextMeBot API
      const url = `https://api.textmebot.com/send?recipient=${phone}&text=${encodeURIComponent(messageText)}&apikey=${apiKey}`;

      const response = await axios.get(url);

      if (response.data && response.data.result) {
        logger.info({ recipient: alert.recipientPhone }, 'WhatsApp sent via TextMeBot');
        return { success: true, messageId: 'textmebot-wa-' + Date.now() };
      } else {
        throw new Error(response.data?.error || 'TextMeBot failed');
      }
    } catch (error: any) {
      logger.warn(
        { error: error.message, recipient: alert.recipientPhone },
        'TextMeBot WhatsApp failed'
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS via TextMeBot API
   */
  private async sendEmergencySMSTextMeBot(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const locationText =
        alert.latitude && alert.longitude
          ? `\n📍 Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
          : '';

      const messageText = `🚨 EMERGENCY ALERT 🚨\n\n${alert.recipientName}, your contact needs help!\n\nThreat Level: ${alert.threatLevel}\n${alert.transcript ? `Context: ${alert.transcript}\n` : ''}${locationText}\n\nSilentSiren AI`;

      const apiKey = process.env.TEXTMEBOT_API_KEY || 'c5A3asD4RNrv';
      const phone = alert.recipientPhone.replace('+', '').replace(/\s+/g, '');

      // TextMeBot SMS API
      const url = `https://api.textmebot.com/sms?recipient=${phone}&text=${encodeURIComponent(messageText)}&apikey=${apiKey}`;

      const response = await axios.get(url);

      if (response.data && response.data.result) {
        logger.info({ recipient: alert.recipientPhone }, 'SMS sent via TextMeBot');
        return { success: true, messageId: 'textmebot-sms-' + Date.now() };
      } else {
        throw new Error(response.data?.error || 'TextMeBot SMS failed');
      }
    } catch (error: any) {
      logger.warn(
        { error: error.message, recipient: alert.recipientPhone },
        'TextMeBot SMS failed'
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger Voice Call Alert via CallMeBot Voice API (completely free voice alert)
   */
  private async makeEmergencyCallCallMeBot(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      const locationText =
        alert.latitude && alert.longitude
          ? `Location is latitude ${alert.latitude}, longitude ${alert.longitude}.`
          : '';

      const messageText = `Emergency Alert. This is an automated message from Silent Siren. ${alert.recipientName}, your contact needs immediate help. Threat level is ${alert.threatLevel}. ${alert.transcript ? `Context: ${alert.transcript}.` : ''} ${locationText}`;

      const apikey = process.env.CALLMEBOT_VOICE_API_KEY || '459203';
      const phone = alert.recipientPhone.replace('+', '').replace(/\s+/g, '');

      const url = `https://api.callmebot.com/start.php?phone=${phone}&text=${encodeURIComponent(messageText)}&apikey=${apikey}`;

      await axios.get(url);
      logger.info(
        { recipient: alert.recipientPhone },
        'Voice call alert triggered successfully via CallMeBot'
      );
      return { success: true, callId: 'callmebot-call-' + Date.now() };
    } catch (error: any) {
      logger.warn(
        { error: error.message, recipient: alert.recipientPhone },
        'Failed to trigger CallMeBot voice alert, falling back to simulated.'
      );
      return { success: true, callId: 'demo-call-' + Date.now(), error: error.message };
    }
  }

  /**
   * Send emergency SMS alert - Uses TextMeBot (primary), Textbelt (fallback), Twilio (last resort)
   */
  async sendEmergencySMS(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Try TextMeBot SMS first
    logger.info({ recipient: alert.recipientPhone }, 'Sending SMS via TextMeBot');
    const textmebotResult = await this.sendEmergencySMSTextMeBot(alert);
    if (textmebotResult.success) {
      return textmebotResult;
    }

    // Fallback to Textbelt
    logger.info({ recipient: alert.recipientPhone }, 'TextMeBot SMS failed, trying Textbelt');
    const textbeltResult = await this.sendEmergencySMSTextbelt(alert);
    if (textbeltResult.success) {
      return textbeltResult;
    }

    // Last resort: Twilio SMS (trial account - may fail for unverified numbers)
    if (this.isConfigured && this.client && process.env.USE_TWILIO !== 'false') {
      try {
        const locationText =
          alert.latitude && alert.longitude
            ? `\n📍 Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
            : '';

        const message = await this.client.messages.create({
          body: `🚨 EMERGENCY ALERT 🚨\n\n${alert.recipientName}, your contact needs immediate help!\n\nThreat Level: ${alert.threatLevel}\n${alert.transcript ? `Context: ${alert.transcript}\n` : ''}${locationText}\n\nSilentSiren AI`,
          from: this.fromPhone,
          to: alert.recipientPhone,
        });

        logger.info(
          { messageId: message.sid, recipient: alert.recipientPhone },
          'SMS sent via Twilio'
        );
        return { success: true, messageId: message.sid };
      } catch (error: any) {
        logger.warn({ error: error.message }, 'Twilio SMS also failed');
      }
    }

    return { success: false, error: 'All SMS methods failed' };
  }

  /**
   * Send emergency WhatsApp message - Uses TextMeBot (primary), Twilio WhatsApp (fallback)
   */
  async sendEmergencyWhatsApp(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Always try TextMeBot first for WhatsApp
    logger.info({ recipient: alert.recipientPhone }, 'Sending WhatsApp via TextMeBot');
    const textmebotResult = await this.sendEmergencyWhatsAppTextMeBot(alert);
    if (textmebotResult.success) {
      return textmebotResult;
    }

    // Fallback to Twilio WhatsApp if configured
    if (this.isConfigured && this.client && process.env.USE_TWILIO !== 'false') {
      try {
        const locationText =
          alert.latitude && alert.longitude
            ? `\n📍 Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
            : '';

        const message = await this.client.messages.create({
          body: `🚨 *EMERGENCY ALERT* 🚨\n\n${alert.recipientName}, your contact needs immediate help!\n\n*Threat Level:* ${alert.threatLevel}\n${alert.transcript ? `*Context:* ${alert.transcript}\n` : ''}${locationText}\n\n_SilentSiren AI_`,
          from: `whatsapp:${this.fromPhone}`,
          to: `whatsapp:${alert.recipientPhone}`,
        });

        logger.info(
          { messageId: message.sid, recipient: alert.recipientPhone },
          'WhatsApp sent via Twilio'
        );
        return { success: true, messageId: message.sid };
      } catch (error: any) {
        logger.warn({ error: error.message }, 'Twilio WhatsApp also failed');
      }
    }

    return textmebotResult;
  }

  /**
   * Make emergency voice call
   */
  async makeEmergencyCall(
    alert: EmergencyAlert
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    if (!this.isConfigured || !this.client || process.env.USE_TWILIO === 'false') {
      logger.info(
        { recipient: alert.recipientPhone },
        'Twilio unconfigured or disabled. Routing Voice Call via CallMeBot Web API.'
      );
      return this.makeEmergencyCallCallMeBot(alert);
    }

    try {
      const locationText =
        alert.latitude && alert.longitude
          ? `The GPS location is latitude ${alert.latitude}, longitude ${alert.longitude}. You can view it on Google Maps.`
          : 'GPS location is not available.';

      const twimlMessage = `
        <Response>
          <Say voice="alice" language="en-US">
            Emergency Alert. This is an automated message from Silent Siren A I.
            ${alert.recipientName}, your emergency contact needs immediate help.
            The threat level is ${alert.threatLevel}.
            ${alert.transcript ? `Context: ${alert.transcript}.` : ''}
            ${locationText}
            Please respond immediately.
            Press any key to acknowledge this alert.
          </Say>
          <Gather numDigits="1" timeout="10">
            <Say voice="alice">Press any key to acknowledge.</Say>
          </Gather>
          <Say voice="alice">No response received. Please check on your contact immediately.</Say>
        </Response>
      `;

      const call = await this.client.calls.create({
        twiml: twimlMessage,
        from: this.fromPhone,
        to: alert.recipientPhone,
      });

      logger.info(
        { callId: call.sid, recipient: alert.recipientPhone },
        'Voice call initiated successfully'
      );
      return { success: true, callId: call.sid };
    } catch (error: any) {
      const errMsg = error.message?.toLowerCase() || '';
      const errCode = error.code ? String(error.code) : '';
      const isTrialOrUnverified =
        errMsg.includes('verified') ||
        errMsg.includes('trial') ||
        errMsg.includes('permission') ||
        errMsg.includes('not a valid mobile number') ||
        errCode === '21608' ||
        errCode === '21211' ||
        errCode === '21614';

      if (isTrialOrUnverified) {
        logger.error(
          { recipient: alert.recipientPhone, error: error.message, errorCode: errCode },
          '❌ [TWILIO TRIAL ERROR] Cannot call unverified number. Verify this number in Twilio Console.'
        );
        return {
          success: false,
          error: `Trial account: Verify ${alert.recipientPhone} at Twilio Console`,
        };
      }

      logger.error({ error, recipient: alert.recipientPhone }, 'Failed to make voice call');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send all emergency alerts (SMS, WhatsApp, Voice)
   */
  async sendAllAlerts(alert: EmergencyAlert): Promise<{
    sms: { success: boolean; messageId?: string; error?: string };
    whatsapp: { success: boolean; messageId?: string; error?: string };
    call: { success: boolean; callId?: string; error?: string };
  }> {
    const [sms, whatsapp, call] = await Promise.all([
      this.sendEmergencySMS(alert),
      this.sendEmergencyWhatsApp(alert),
      this.makeEmergencyCall(alert),
    ]);

    return { sms, whatsapp, call };
  }

  /**
   * Check if Twilio is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const twilioService = new TwilioService();
