import { databaseService } from '../services/database.service';
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('emergency-contact-repository');

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string;
  priority: number; // 1 = primary, 2 = secondary, etc.
  notify_sms: boolean;
  notify_call: boolean;
  notify_whatsapp: boolean;
  is_active: boolean;
  fcm_token?: string;
  created_at: Date;
  updated_at: Date;
}

class EmergencyContactRepository {
  /**
   * Create emergency contact
   */
  async create(data: {
    user_id: string;
    name: string;
    phone_number: string;
    relationship: string;
    priority?: number;
    notify_sms?: boolean;
    notify_call?: boolean;
    notify_whatsapp?: boolean;
    fcm_token?: string;
  }): Promise<EmergencyContact> {
    const query = `
      INSERT INTO emergency_contacts (
        user_id, name, phone_number, relationship, priority,
        notify_sms, notify_call, notify_whatsapp, fcm_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await databaseService.query(query, [
      data.user_id,
      data.name,
      data.phone_number,
      data.relationship,
      data.priority || 1,
      data.notify_sms !== false,
      data.notify_call !== false,
      data.notify_whatsapp !== false,
      data.fcm_token || null,
    ]);

    logger.info({ contactId: result.rows[0].id }, 'Emergency contact created');
    return result.rows[0];
  }

  /**
   * Get all active contacts for a user
   */
  async findByUserId(userId: string): Promise<EmergencyContact[]> {
    const query = `
      SELECT * FROM emergency_contacts
      WHERE user_id = $1 AND is_active = true
      ORDER BY priority ASC, created_at ASC
    `;

    const result = await databaseService.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get contact by ID
   */
  async findById(contactId: string): Promise<EmergencyContact | null> {
    const query = `
      SELECT * FROM emergency_contacts
      WHERE id = $1
    `;

    const result = await databaseService.query(query, [contactId]);
    return result.rows[0] || null;
  }

  /**
   * Update emergency contact
   */
  async update(
    contactId: string,
    data: Partial<Omit<EmergencyContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<EmergencyContact> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push(`updated_at = NOW()`);
    values.push(contactId);

    const query = `
      UPDATE emergency_contacts
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await databaseService.query(query, values);
    logger.info({ contactId }, 'Emergency contact updated');
    return result.rows[0];
  }

  /**
   * Delete (deactivate) emergency contact
   */
  async delete(contactId: string): Promise<void> {
    const query = `
      UPDATE emergency_contacts
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;

    await databaseService.query(query, [contactId]);
    logger.info({ contactId }, 'Emergency contact deleted');
  }

  /**
   * Get contacts by threat level and notification preferences
   */
  async getContactsForThreatLevel(
    userId: string,
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<{
    sms: EmergencyContact[];
    call: EmergencyContact[];
    whatsapp: EmergencyContact[];
  }> {
    const contacts = await this.findByUserId(userId);

    // Threat level logic:
    // LOW/MEDIUM: Only SMS to primary contacts
    // HIGH: SMS + WhatsApp to all contacts
    // CRITICAL: SMS + WhatsApp + Voice Call to all contacts

    if (threatLevel === 'LOW' || threatLevel === 'MEDIUM') {
      const primaryContacts = contacts.filter((c) => c.priority === 1);
      return {
        sms: primaryContacts.filter((c) => c.notify_sms),
        call: [],
        whatsapp: [],
      };
    }

    if (threatLevel === 'HIGH') {
      return {
        sms: contacts.filter((c) => c.notify_sms),
        call: [],
        whatsapp: contacts.filter((c) => c.notify_whatsapp),
      };
    }

    // CRITICAL: All channels
    return {
      sms: contacts.filter((c) => c.notify_sms),
      call: contacts.filter((c) => c.notify_call),
      whatsapp: contacts.filter((c) => c.notify_whatsapp),
    };
  }
}

export const emergencyContactRepository = new EmergencyContactRepository();
