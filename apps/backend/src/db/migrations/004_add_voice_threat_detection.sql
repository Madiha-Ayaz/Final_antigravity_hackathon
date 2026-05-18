-- Voice Threat Detection System Migration
-- Adds tables for voice analysis sessions, threat alerts, and countdown timers

-- Voice analysis sessions
CREATE TABLE IF NOT EXISTS voice_threat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT,
  threat_detected BOOLEAN DEFAULT FALSE,
  threat_level VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  confidence_score DECIMAL(3, 2),
  emergency_type VARCHAR(50), -- 'PHYSICAL_ASSAULT', 'MEDICAL', 'FIRE', etc.
  ai_reasoning TEXT,
  detected_keywords TEXT[],
  emotional_stress_level DECIMAL(3, 2),
  voice_analysis_metadata JSONB,
  gemini_response JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency alerts with countdown
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES voice_threat_sessions(id) ON DELETE SET NULL,
  emergency_event_id UUID REFERENCES emergency_events(id) ON DELETE SET NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'VOICE_THREAT', 'MANUAL_TRIGGER', 'PANIC_BUTTON'
  threat_level VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'COUNTDOWN', -- 'COUNTDOWN', 'ACTIVE', 'CANCELLED', 'RESOLVED'

  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(6, 2),
  address TEXT,

  -- Countdown timer (2 minutes = 120 seconds)
  countdown_duration_seconds INTEGER DEFAULT 120,
  countdown_started_at TIMESTAMP WITH TIME ZONE,
  countdown_expires_at TIMESTAMP WITH TIME ZONE,

  -- User actions
  user_confirmed_safe BOOLEAN DEFAULT FALSE,
  user_confirmed_safe_at TIMESTAMP WITH TIME ZONE,
  user_cancelled BOOLEAN DEFAULT FALSE,
  user_cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Emergency response
  siren_triggered BOOLEAN DEFAULT FALSE,
  siren_triggered_at TIMESTAMP WITH TIME ZONE,
  contacts_notified BOOLEAN DEFAULT FALSE,
  contacts_notified_at TIMESTAMP WITH TIME ZONE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  ambulance_called BOOLEAN DEFAULT FALSE,
  ambulance_called_at TIMESTAMP WITH TIME ZONE,
  gps_shared BOOLEAN DEFAULT FALSE,
  gps_shared_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notification_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Alert notifications log
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES emergency_contacts(id) ON DELETE SET NULL,
  notification_type VARCHAR(20) NOT NULL, -- 'SMS', 'WHATSAPP', 'CALL', 'PUSH'
  recipient VARCHAR(255) NOT NULL,
  message_content TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User safety confirmations
CREATE TABLE IF NOT EXISTS safety_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmation_type VARCHAR(20) NOT NULL, -- 'SAFE', 'NEED_HELP', 'FALSE_ALARM'
  message TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_threat_sessions_user_id ON voice_threat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_threat_sessions_created_at ON voice_threat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_threat_sessions_threat_detected ON voice_threat_sessions(threat_detected);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_countdown_expires ON emergency_alerts(countdown_expires_at);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_session_id ON emergency_alerts(session_id);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_safety_confirmations_alert_id ON safety_confirmations(alert_id);
CREATE INDEX IF NOT EXISTS idx_safety_confirmations_user_id ON safety_confirmations(user_id);

-- Updated_at triggers
CREATE TRIGGER update_voice_threat_sessions_updated_at BEFORE UPDATE ON voice_threat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-activate alert after countdown expires
CREATE OR REPLACE FUNCTION check_expired_countdowns()
RETURNS void AS $$
BEGIN
  UPDATE emergency_alerts
  SET status = 'ACTIVE',
      updated_at = NOW()
  WHERE status = 'COUNTDOWN'
    AND countdown_expires_at <= NOW()
    AND user_confirmed_safe = FALSE
    AND user_cancelled = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE voice_threat_sessions IS 'Stores voice analysis sessions with Gemini AI threat detection results';
COMMENT ON TABLE emergency_alerts IS 'Emergency alerts with 2-minute countdown timer before auto-activation';
COMMENT ON TABLE alert_notifications IS 'Tracks all notifications sent to emergency contacts';
COMMENT ON TABLE safety_confirmations IS 'User safety confirmations (I am safe button clicks)';
