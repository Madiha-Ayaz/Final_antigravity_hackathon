-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(100) NOT NULL, -- e.g., 'Mother', 'Father', 'Friend', 'Spouse'
  priority INTEGER NOT NULL DEFAULT 1, -- 1 = primary, 2 = secondary, etc.
  notify_sms BOOLEAN NOT NULL DEFAULT true,
  notify_call BOOLEAN NOT NULL DEFAULT true,
  notify_whatsapp BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(user_id, priority) WHERE is_active = true;

-- Comments
COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for users';
COMMENT ON COLUMN emergency_contacts.priority IS '1 = primary contact, 2 = secondary, etc. Lower number = higher priority';
COMMENT ON COLUMN emergency_contacts.notify_sms IS 'Send SMS alerts to this contact';
COMMENT ON COLUMN emergency_contacts.notify_call IS 'Make voice calls to this contact';
COMMENT ON COLUMN emergency_contacts.notify_whatsapp IS 'Send WhatsApp messages to this contact';
