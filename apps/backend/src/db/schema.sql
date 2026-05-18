-- SilentSiren Database Schema for Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  device_fingerprint TEXT,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  reputation_score INTEGER DEFAULT 100,
  trust_level VARCHAR(20) DEFAULT 'NEW',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  priority INTEGER DEFAULT 1,
  notify_sms BOOLEAN DEFAULT TRUE,
  notify_call BOOLEAN DEFAULT TRUE,
  notify_whatsapp BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency events
CREATE TABLE IF NOT EXISTS emergency_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'VOICE_TRIGGER', 'MANUAL', 'PANIC_BUTTON'
  threat_level VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'FALSE_ALARM', 'DISPATCHED', 'RESOLVED'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  audio_url TEXT,
  transcript TEXT,
  ai_confidence DECIMAL(3, 2),
  ai_reasoning TEXT,
  detected_patterns TEXT[],
  emotional_stress DECIMAL(3, 2),
  dispatch_recommended BOOLEAN DEFAULT FALSE,
  dispatch_sent BOOLEAN DEFAULT FALSE,
  dispatch_sent_at TIMESTAMP WITH TIME ZONE,
  user_verified BOOLEAN,
  user_verified_at TIMESTAMP WITH TIME ZONE,
  community_validated BOOLEAN DEFAULT FALSE,
  validation_count INTEGER DEFAULT 0,
  false_alarm_reported BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community validation
CREATE TABLE IF NOT EXISTS community_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_event_id UUID NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
  validator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  validation_type VARCHAR(20) NOT NULL, -- 'CONFIRM', 'DENY', 'UNCERTAIN'
  distance_meters INTEGER,
  validator_location_lat DECIMAL(10, 8),
  validator_location_lng DECIMAL(11, 8),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(emergency_event_id, validator_user_id)
);

-- Dispatch logs
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_event_id UUID NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
  dispatch_type VARCHAR(20) NOT NULL, -- 'SMS', 'CALL', 'EMAIL', 'PUSH'
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
  provider VARCHAR(50), -- 'TWILIO', 'SENDGRID', etc.
  provider_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abuse reports
CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emergency_event_id UUID REFERENCES emergency_events(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'FALSE_ALARM', 'SPAM', 'ABUSE', 'OTHER'
  description TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_events_user_id ON emergency_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON emergency_events(status);
CREATE INDEX IF NOT EXISTS idx_emergency_events_created_at ON emergency_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_events_location ON emergency_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_community_validations_event ON community_validations(emergency_event_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_event ON dispatch_logs(emergency_event_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_events_updated_at BEFORE UPDATE ON emergency_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
