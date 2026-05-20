-- 🗄️ EMERGENCY CONTACTS TABLE - COMPLETE SCHEMA
-- Run this in Neon SQL Editor

-- Drop old table if exists (CAREFUL: This deletes data!)
-- DROP TABLE IF EXISTS emergency_contacts;

-- Create emergency_contacts table with all fields
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  carrier VARCHAR(50),
  notify_whatsapp BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT true,
  notify_call BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id
ON emergency_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active
ON emergency_contacts(user_id, is_active);

-- Verify table created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emergency_contacts'
ORDER BY ordinal_position;

-- Test insert
INSERT INTO emergency_contacts (
  user_id,
  name,
  phone_number,
  relationship,
  carrier,
  notify_whatsapp,
  notify_sms,
  notify_call
) VALUES (
  'test-user-001',
  'Test Contact',
  '+923001234567',
  'Friend',
  'jazz',
  true,
  true,
  false
);

-- Verify insert
SELECT * FROM emergency_contacts WHERE user_id = 'test-user-001';
