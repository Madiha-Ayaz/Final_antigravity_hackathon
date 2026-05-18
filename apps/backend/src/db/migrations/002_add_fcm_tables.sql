-- Add device_tokens table for FCM integration

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type VARCHAR(20) DEFAULT 'web', -- 'web', 'android', 'ios'
  device_info JSONB, -- browser, OS, etc.
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_tokens_last_used ON device_tokens(last_used_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add notification_preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"emergency": true, "community": true, "updates": false}'::jsonb;

-- Add notification_logs table for tracking
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emergency_event_id UUID REFERENCES emergency_events(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'EMERGENCY', 'COMMUNITY_VALIDATION', 'UPDATE'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  device_token_id UUID REFERENCES device_tokens(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'FAILED', 'CLICKED'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_id ON notification_logs(emergency_event_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

COMMENT ON TABLE device_tokens IS 'Stores FCM device tokens for push notifications';
COMMENT ON TABLE notification_logs IS 'Tracks all push notifications sent to users';
