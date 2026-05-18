-- Add firebase_uid column to users table for Firebase Auth integration

-- Add firebase_uid column
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Add carrier column to emergency_contacts for free SMS
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS carrier VARCHAR(50);

-- Update users table to make phone_number optional (since Firebase users might not have phone)
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Authentication UID for syncing with Firebase Auth';
COMMENT ON COLUMN emergency_contacts.carrier IS 'Mobile carrier for free SMS (jazz, telenor, zong, etc.)';
