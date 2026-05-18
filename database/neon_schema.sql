-- =====================================================
-- NEON DATABASE SCHEMA FOR SILENTSIREN AI
-- Audit Logs, Abuse Reports, Community Features
-- =====================================================

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  resource_id VARCHAR(255),
  resource_type VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  device_id VARCHAR(255),
  session_id VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('success', 'failure', 'pending')),
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- 2. ABUSE REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  incident_id UUID,
  report_type VARCHAR(50) CHECK (report_type IN (
    'false_alarm', 'spam', 'harassment', 'inappropriate_content',
    'system_abuse', 'coordinated_attack', 'other'
  )),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB,
  status VARCHAR(20) CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for abuse reports
CREATE INDEX idx_abuse_reports_reporter ON abuse_reports(reporter_user_id);
CREATE INDEX idx_abuse_reports_reported ON abuse_reports(reported_user_id);
CREATE INDEX idx_abuse_reports_status ON abuse_reports(status);
CREATE INDEX idx_abuse_reports_severity ON abuse_reports(severity);
CREATE INDEX idx_abuse_reports_created ON abuse_reports(created_at DESC);

-- =====================================================
-- 3. COMMUNITY VALIDATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS community_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL,
  validator_user_id UUID REFERENCES users(id),
  validation_type VARCHAR(50) CHECK (validation_type IN ('confirm', 'deny', 'uncertain')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  location_verified BOOLEAN DEFAULT FALSE,
  audio_verified BOOLEAN DEFAULT FALSE,
  comments TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for community validations
CREATE INDEX idx_community_validations_incident ON community_validations(incident_id);
CREATE INDEX idx_community_validations_validator ON community_validations(validator_user_id);
CREATE INDEX idx_community_validations_type ON community_validations(validation_type);

-- =====================================================
-- 4. USER REPUTATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  reputation_score INTEGER DEFAULT 100,
  total_incidents INTEGER DEFAULT 0,
  validated_incidents INTEGER DEFAULT 0,
  false_alarms INTEGER DEFAULT 0,
  community_validations INTEGER DEFAULT 0,
  helpful_validations INTEGER DEFAULT 0,
  abuse_reports_received INTEGER DEFAULT 0,
  abuse_reports_filed INTEGER DEFAULT 0,
  last_incident_at TIMESTAMP WITH TIME ZONE,
  account_status VARCHAR(20) CHECK (account_status IN ('active', 'warned', 'suspended', 'banned')) DEFAULT 'active',
  suspension_reason TEXT,
  suspended_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for reputation
CREATE INDEX idx_user_reputation_score ON user_reputation(reputation_score DESC);
CREATE INDEX idx_user_reputation_status ON user_reputation(account_status);

-- =====================================================
-- 5. ABUSE ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS abuse_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  device_id VARCHAR(255),
  incident_count INTEGER DEFAULT 0,
  false_alarm_count INTEGER DEFAULT 0,
  false_alarm_rate DECIMAL(5,2),
  average_confidence DECIMAL(3,2),
  suspicious_patterns JSONB,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for abuse analytics
CREATE INDEX idx_abuse_analytics_user ON abuse_analytics(user_id);
CREATE INDEX idx_abuse_analytics_risk ON abuse_analytics(risk_score DESC);
CREATE INDEX idx_abuse_analytics_device ON abuse_analytics(device_id);

-- =====================================================
-- 6. WHATSAPP MESSAGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  recipient_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) CHECK (message_type IN ('text', 'voice', 'emergency_alert', 'contact_form')),
  message_content TEXT,
  audio_url TEXT,
  emergency_data JSONB,
  status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'failed', 'pending')) DEFAULT 'pending',
  message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for WhatsApp logs
CREATE INDEX idx_whatsapp_logs_user ON whatsapp_message_logs(user_id);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_message_logs(status);
CREATE INDEX idx_whatsapp_logs_sent ON whatsapp_message_logs(sent_at DESC);
CREATE INDEX idx_whatsapp_logs_type ON whatsapp_message_logs(message_type);

-- =====================================================
-- 7. COMMUNITY ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS community_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) CHECK (alert_type IN (
    'high_false_alarm_rate', 'rapid_incidents', 'suspicious_device',
    'coordinated_attack', 'system_anomaly'
  )),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES users(id),
  device_id VARCHAR(255),
  description TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(20) CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')) DEFAULT 'active',
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for community alerts
CREATE INDEX idx_community_alerts_type ON community_alerts(alert_type);
CREATE INDEX idx_community_alerts_severity ON community_alerts(severity);
CREATE INDEX idx_community_alerts_status ON community_alerts(status);
CREATE INDEX idx_community_alerts_created ON community_alerts(created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_abuse_reports_updated_at
  BEFORE UPDATE ON abuse_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reputation_updated_at
  BEFORE UPDATE ON user_reputation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abuse_analytics_updated_at
  BEFORE UPDATE ON abuse_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_alerts_updated_at
  BEFORE UPDATE ON community_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for abuse statistics
CREATE OR REPLACE VIEW abuse_statistics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  report_type,
  severity,
  COUNT(*) as report_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM abuse_reports
GROUP BY DATE_TRUNC('day', created_at), report_type, severity
ORDER BY date DESC;

-- View for user reputation summary
CREATE OR REPLACE VIEW user_reputation_summary AS
SELECT
  ur.user_id,
  u.email,
  ur.reputation_score,
  ur.total_incidents,
  ur.false_alarms,
  CASE
    WHEN ur.total_incidents > 0
    THEN ROUND((ur.false_alarms::DECIMAL / ur.total_incidents) * 100, 2)
    ELSE 0
  END as false_alarm_percentage,
  ur.account_status,
  ur.last_incident_at
FROM user_reputation ur
JOIN users u ON ur.user_id = u.id
ORDER BY ur.reputation_score DESC;

-- View for WhatsApp message statistics
CREATE OR REPLACE VIEW whatsapp_statistics AS
SELECT
  DATE_TRUNC('day', sent_at) as date,
  message_type,
  status,
  COUNT(*) as message_count
FROM whatsapp_message_logs
GROUP BY DATE_TRUNC('day', sent_at), message_type, status
ORDER BY date DESC;

-- =====================================================
-- GRANT PERMISSIONS (adjust as needed)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
