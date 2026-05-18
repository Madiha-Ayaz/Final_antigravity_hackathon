-- Add missing columns to emergency_contacts table
ALTER TABLE emergency_contacts
ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_call BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update relationship column to NOT NULL if it exists
ALTER TABLE emergency_contacts
ALTER COLUMN relationship SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(user_id, priority) WHERE is_active = true;
