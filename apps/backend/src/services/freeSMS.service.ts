import nodemailer from 'nodemailer';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('free-sms-service');

// Email-to-SMS gateways for different carriers
const SMS_GATEWAYS: Record<string, string> = {
  // Pakistan
  jazz: '@sms.jazz.com.pk',
  telenor: '@sms.telenor.com.pk',
  zong: '@sms.zong.com.pk',
  ufone: '@sms.ufone.com.pk',

  // USA
  verizon: '@vtext.com',
  att: '@txt.att.net',
  tmobile: '@tmomail.net',
  sprint: '@messaging.sprintpcs.com',

  // India
  airtel: '@airtelmail.com',
  vodafone: '@vodafone.com',
  jio: '@jio.com',

  // UK
  o2: '@o2.co.uk',
  vodafone_uk: '@vodafone.net',
  three: '@three.co.uk',
};

export interface EmergencyContact {
  name: string;
  phoneNumber: string;
  carrier?: string;
  relationship: string;
}

export class FreeSMSService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      logger.warn('Gmail credentials not configured. Free SMS service will not work.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
      });

      logger.info('Free SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize free SMS service', { error });
    }
  }

  /**
   * Send SMS via email-to-SMS gateway (FREE)
   */
  async sendSMS(phoneNumber: string, carrier: string, message: string): Promise<boolean> {
    if (!this.transporter) {
      logger.error('SMS transporter not initialized');
      return false;
    }

    const gateway = SMS_GATEWAYS[carrier.toLowerCase()];
    if (!gateway) {
      logger.error('Unsupported carrier', { carrier });
      return false;
    }

    // Remove any non-numeric characters from phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const smsEmail = cleanNumber + gateway;

    try {
      await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: smsEmail,
        subject: '', // Empty subject for SMS
        text: message,
      });

      logger.info('Free SMS sent successfully', { phoneNumber: cleanNumber, carrier });
      return true;
    } catch (error) {
      logger.error('Failed to send free SMS', { error, phoneNumber: cleanNumber });
      return false;
    }
  }

  /**
   * Send emergency alert to single contact
   */
  async sendEmergencyAlert(
    contact: EmergencyContact,
    location: string,
    audioUrl: string
  ): Promise<boolean> {
    const message = `🚨 EMERGENCY ALERT!

User needs help NOW!

Location: ${location}

Voice Recording: ${audioUrl}

Time: ${new Date().toLocaleString()}

This is an automated emergency alert from SilentSiren.`;

    if (contact.carrier) {
      return await this.sendSMS(contact.phoneNumber, contact.carrier, message);
    } else {
      logger.warn('No carrier specified for contact', { contact: contact.name });
      return false;
    }
  }

  /**
   * Send emergency alerts to multiple contacts
   */
  async sendEmergencyAlerts(
    contacts: EmergencyContact[],
    location: string,
    audioUrl: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const contact of contacts) {
      const result = await this.sendEmergencyAlert(contact, location, audioUrl);
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Wait 1 second between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.info('Emergency alerts sent', { success, failed, total: contacts.length });
    return { success, failed };
  }

  /**
   * Get list of supported carriers
   */
  getSupportedCarriers(): string[] {
    return Object.keys(SMS_GATEWAYS);
  }

  /**
   * Check if carrier is supported
   */
  isCarrierSupported(carrier: string): boolean {
    return carrier.toLowerCase() in SMS_GATEWAYS;
  }
}

export const freeSMSService = new FreeSMSService();
