/**
 * Emergency Call Service
 * Handles free emergency calls, SMS, and WhatsApp messages
 * Uses native device capabilities (no paid APIs)
 */

export interface EmergencyContact {
  name: string;
  phoneNumber: string;
  carrier?: string;
  relationship: string;
}

export class EmergencyCallService {
  /**
   * Make emergency phone call (opens native dialer)
   * FREE - Uses user's phone
   */
  makeEmergencyCall(phoneNumber: string, audioUrl?: string): void {
    // Clean phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Open native phone dialer
    window.location.href = `tel:${cleanNumber}`;

    // If audio URL provided, show notification
    if (audioUrl) {
      this.showAudioNotification(audioUrl);
    }
  }

  /**
   * Send SMS via native SMS app (opens with pre-filled message)
   * FREE - Uses user's SMS app
   */
  sendEmergencySMS(phoneNumber: string, message: string): void {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);

    // Open native SMS app with pre-filled message
    window.location.href = `sms:${cleanNumber}?body=${encodedMessage}`;
  }

  /**
   * Send WhatsApp message (opens WhatsApp with pre-filled message)
   * FREE - Uses user's WhatsApp
   */
  sendWhatsAppMessage(phoneNumber: string, message: string): void {
    // Remove + and spaces from phone number
    const cleanNumber = phoneNumber.replace(/[+\s]/g, '');
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Trigger all emergency contacts (SMS + Call + WhatsApp)
   */
  async triggerAllEmergencyContacts(
    contacts: EmergencyContact[],
    location: string,
    audioUrl: string
  ): Promise<void> {
    const locationUrl = `https://maps.google.com/?q=${location}`;
    const message = `🚨 EMERGENCY ALERT!

User needs help NOW!

Location: ${locationUrl}

Voice Recording: ${audioUrl}

Time: ${new Date().toLocaleString()}

This is an automated emergency alert from SilentSiren.`;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      // Show progress
      this.showProgress(i + 1, contacts.length, contact.name);

      // 1. Send WhatsApp (opens in new tab)
      this.sendWhatsAppMessage(contact.phoneNumber, message);
      await this.delay(2000);

      // 2. Send SMS (opens SMS app)
      this.sendEmergencySMS(contact.phoneNumber, message);
      await this.delay(2000);

      // 3. Make call (opens dialer)
      if (i === 0) {
        // Only call first contact automatically
        this.makeEmergencyCall(contact.phoneNumber, audioUrl);
      }

      // Wait before next contact
      await this.delay(3000);
    }

    this.showCompletionNotification(contacts.length);
  }

  /**
   * Share emergency via Web Share API
   */
  async shareEmergency(location: string, audioUrl: string): Promise<boolean> {
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share({
        title: '🚨 EMERGENCY ALERT',
        text: `User needs help at ${location}`,
        url: audioUrl,
      });
      return true;
    } catch (error) {
      console.error('Error sharing emergency', error);
      return false;
    }
  }

  /**
   * Copy emergency details to clipboard
   */
  async copyEmergencyDetails(location: string, audioUrl: string): Promise<boolean> {
    const text = `🚨 EMERGENCY ALERT!

User needs help NOW!

Location: ${location}

Voice Recording: ${audioUrl}

Time: ${new Date().toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard', error);
      return false;
    }
  }

  /**
   * Show audio notification
   */
  private showAudioNotification(audioUrl: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎤 Emergency Voice Recording', {
        body: 'Click to listen to the emergency voice recording',
        icon: '/icon.svg',
        tag: 'emergency-audio',
        requireInteraction: true,
      });
    }
  }

  /**
   * Show progress notification
   */
  private showProgress(current: number, total: number, contactName: string): void {
    console.log(`[${current}/${total}] Contacting ${contactName}...`);
  }

  /**
   * Show completion notification
   */
  private showCompletionNotification(totalContacts: number): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('✅ Emergency Alerts Sent', {
        body: `Successfully contacted ${totalContacts} emergency contacts`,
        icon: '/icon.svg',
        tag: 'emergency-complete',
      });
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Check if device supports phone calls
   */
  supportsPhoneCalls(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports SMS
   */
  supportsSMS(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * Check if Web Share API is supported
   */
  supportsWebShare(): boolean {
    return 'share' in navigator;
  }
}

export const emergencyCallService = new EmergencyCallService();
