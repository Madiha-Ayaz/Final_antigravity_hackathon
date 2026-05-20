# 🔬 Antigravity Trace System

Complete emergency detection and response tracing system for SilentSiren AI.

## 📋 Overview

The Antigravity Trace System provides comprehensive logging, tracing, and debugging capabilities for the entire emergency detection pipeline. Every AI decision, signal fusion, confidence score, and alert execution is automatically logged and can be reviewed through an intuitive dashboard.

## ✨ Features

### Core Capabilities
- ✅ **AI Prompt & Response Logging** - All AI interactions are saved with timestamps
- ✅ **Crisis Detection Tracing** - Track how the system detects emergencies
- ✅ **Confidence Scoring** - Multi-factor confidence calculation with reasoning
- ✅ **Signal Fusion** - Combine multiple data sources with weighted scoring
- ✅ **Emergency Classification** - Automatic threat level determination
- ✅ **Fallback Actions** - Track when and why fallback mechanisms trigger
- ✅ **GPS Event Tracking** - Location accuracy and freshness scoring
- ✅ **Alert Execution** - Monitor SMS, Voice, and WhatsApp delivery
- ✅ **Decision Chain** - Complete reasoning path from detection to response
- ✅ **Action History** - Track all actions with status and duration

### Output Formats
- **JSON** - Machine-readable structured logs
- **Markdown** - Human-readable trace reports
- **Dashboard** - Interactive web interface with timeline view

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Emergency Event                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Antigravity Trace Logger                       │
│  - Start Session (generates unique trace ID)                │
│  - Log Events (AI, GPS, Alerts, etc.)                      │
│  - Track Decisions & Actions                                │
│  - Generate Summary                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Event Pipeline                             │
│  1. Initial Detection                                        │
│  2. AI Analysis                                              │
│  3. Signal Fusion                                            │
│  4. Classification                                           │
│  5. Alert Execution                                          │
│  6. Dispatch (if needed)                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Confidence Scorer                              │
│  - AI Analysis Scoring                                       │
│  - Signal Fusion Scoring                                     │
│  - Location Accuracy Scoring                                 │
│  - User Trigger Reliability                                  │
│  - Community Validation Scoring                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Storage & Dashboard                          │
│  - /antigravity-logs/traces/*.json                          │
│  - /antigravity-logs/traces/*.md                            │
│  - /antigravity-logs/prompts/*.json                         │
│  - Dashboard UI at /dashboard/traces                        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
antigravity-logs/
├── traces/
│   ├── trace_<uuid>_<timestamp>.json    # Structured trace data
│   └── trace_<uuid>_<timestamp>.md      # Human-readable report
└── prompts/
    └── prompt_<uuid>_<timestamp>.json   # AI prompts and metadata
```

## 🚀 Quick Start

### 1. Backend Integration

```typescript
import { antigravityTrace } from './services/antigravity/antigravityTrace';
import { executeEmergencyPipeline } from './services/antigravity/eventPipeline';

// Start emergency trace
const context = {
  userId: 'user-123',
  eventType: 'MANUAL',
  location: {
    latitude: 31.5204,
    longitude: 74.3587,
    accuracy: 10,
    address: 'Lahore, Pakistan',
  },
  transcript: 'Help! I need assistance!',
};

// Execute pipeline with automatic tracing
const { traceId, result } = await executeEmergencyPipeline(context);

console.log(`Trace ID: ${traceId}`);
console.log(`Success: ${result.success}`);
```

### 2. Manual Tracing

```typescript
import { antigravityTrace } from './services/antigravity/antigravityTrace';

// Start trace
const traceId = antigravityTrace.startEmergencyTrace(context);

// Log AI analysis
await antigravityTrace.logAIAnalysis(traceId, prompt, 'gemini-1.5-flash', {
  isCrisis: true,
  confidence: 0.85,
  threatLevel: 'HIGH',
  reasoning: 'Detected distress signals',
  detectedPatterns: ['distress_keywords', 'panic_tone'],
  emotionalStress: 0.78,
  recommendedActions: ['alert_contacts', 'notify_authorities'],
});

// Log signal fusion
antigravityTrace.logSignalFusion(traceId, {
  signals: [
    { source: 'ai_analysis', value: 0.85, weight: 0.6, confidence: 0.85 },
    { source: 'user_trigger', value: 1.0, weight: 0.3, confidence: 1.0 },
    { source: 'location', value: 0.9, weight: 0.1, confidence: 0.9 },
  ],
  fusedConfidence: 0.87,
  fusedThreatLevel: 'HIGH',
  reasoning: 'Combined AI analysis, user trigger, and location data',
});

// Log alert execution
await antigravityTrace.logAlertExecution(
  traceId,
  'SMS',
  ['+923343717260'],
  async () => {
    // Your alert sending logic
    return { sent: true, messageId: 'sms_123' };
  }
);

// End trace
antigravityTrace.endEmergencyTrace(
  traceId,
  'Emergency Processed Successfully',
  'COMPLETED'
);
```

### 3. Confidence Scoring

```typescript
import { confidenceScorer } from './services/antigravity/confidenceScorer';

// Score AI analysis
const aiScore = confidenceScorer.scoreAIAnalysis(
  0.85,                                    // AI confidence
  ['distress_keywords', 'panic_tone'],     // Detected patterns
  0.78,                                    // Emotional stress
  150                                      // Transcript length
);

console.log(`Overall Score: ${aiScore.overallScore}`);
console.log(`Reliability: ${aiScore.reliability}`);
console.log(`Recommendations:`, aiScore.recommendations);

// Score signal fusion
const fusionScore = confidenceScorer.scoreSignalFusion([
  { source: 'ai_analysis', confidence: 0.85, weight: 0.6 },
  { source: 'user_trigger', confidence: 1.0, weight: 0.3 },
  { source: 'location', confidence: 0.9, weight: 0.1 },
]);

// Get threat level
const threatLevel = confidenceScorer.getThreatLevel(fusionScore.overallScore);
console.log(`Threat Level: ${threatLevel}`);

// Should dispatch?
const shouldDispatch = confidenceScorer.shouldDispatch(fusionScore);
console.log(`Dispatch Required: ${shouldDispatch}`);
```

## 🎯 API Endpoints

### Get All Traces
```bash
GET /api/traces?limit=20&offset=0
Authorization: Bearer <token>
```

### Get Specific Trace
```bash
GET /api/traces/:traceId
Authorization: Bearer <token>
```

### Get Trace Events
```bash
GET /api/traces/:traceId/events?eventType=AI_PROMPT&severity=HIGH
Authorization: Bearer <token>
```

### Get Trace Timeline
```bash
GET /api/traces/:traceId/timeline
Authorization: Bearer <token>
```

### Get Trace Statistics
```bash
GET /api/traces/stats
Authorization: Bearer <token>
```

### Get Active Traces
```bash
GET /api/traces/active
Authorization: Bearer <token>
```

## 📊 Dashboard Features

### Traces List (`/dashboard/traces`)
- View all emergency traces
- Filter by date, severity, confidence
- Quick stats overview
- Click to view detailed trace

### Trace Detail (`/dashboard/traces/:traceId`)
- **Timeline View** - Chronological event flow with severity indicators
- **Events Tab** - All logged events with data
- **Decisions Tab** - AI decision chain with confidence scores
- **Actions Tab** - Action execution history with status

### Key Metrics
- Total Events
- Critical Events Count
- Average Confidence Score
- Alerts Sent
- Session Duration
- Emergency Classification

## 🔍 Event Types

| Event Type | Description | Severity |
|------------|-------------|----------|
| `AI_PROMPT` | AI model prompt sent | LOW |
| `AI_RESPONSE` | AI model response received | Variable |
| `CRISIS_DETECTION` | Crisis detected or not | CRITICAL/LOW |
| `CONFIDENCE_SCORE` | Confidence calculation | Variable |
| `SIGNAL_FUSION` | Multiple signals combined | MEDIUM |
| `EMERGENCY_CLASSIFICATION` | Emergency classified | Variable |
| `FALLBACK_ACTION` | Fallback triggered | HIGH |
| `GPS_EVENT` | Location updated | LOW |
| `ALERT_EXECUTION` | Alert sent | MEDIUM/HIGH |
| `EMERGENCY_RESPONSE` | Response phase update | Variable |

## 🎨 Confidence Scoring Factors

### AI Analysis
- **AI Model Confidence** (40%) - Direct AI output
- **Pattern Detection** (30%) - Number of distress patterns
- **Emotional Stress** (20%) - Voice stress analysis
- **Transcript Quality** (10%) - Length and clarity

### Signal Fusion
- Weighted average of multiple signals
- Each signal has confidence and weight
- Variance analysis for reliability

### Location Accuracy
- **GPS Accuracy** (50%) - Meters accuracy
- **Address Available** (30%) - Geocoding success
- **Location Freshness** (20%) - Time since update

### User Trigger
- **Trigger Type** (50%) - Panic button > Manual > Voice
- **User Reputation** (30%) - Historical reliability
- **False Alarm History** (20%) - Previous false alarms

### Community Validation
- **Confirmation Ratio** (50%) - % of confirmations
- **Denial Impact** (30%) - % of denials
- **Validator Proximity** (20%) - Distance from event

## 🛠️ Middleware

### Automatic Tracing
```typescript
// Applied to all API requests
app.use(traceMiddleware);

// Applied to emergency endpoints
app.use(emergencyTraceMiddleware);

// Error tracking
app.use(traceErrorMiddleware);
```

### Request Context
```typescript
// Access trace context in routes
req.traceContext = {
  traceId: 'uuid',
  startTime: 1234567890,
  userId: 'user-123',
  sessionId: 'session-456',
};
```

## 📝 Trace Output Example

### JSON Format
```json
{
  "traceId": "abc-123",
  "sessionStart": "2026-05-17T10:00:00Z",
  "sessionEnd": "2026-05-17T10:00:15Z",
  "events": [...],
  "decisionChain": [...],
  "actionHistory": [...],
  "summary": {
    "totalEvents": 25,
    "criticalEvents": 3,
    "averageConfidence": 0.87,
    "emergencyClassification": "EMERGENCY",
    "finalDecision": "Emergency Processed Successfully",
    "alertsSent": 3,
    "duration": 15000
  }
}
```

### Markdown Format
```markdown
# Antigravity Trace Report
**Trace ID:** abc-123
**Session Start:** 2026-05-17T10:00:00Z
**Session End:** 2026-05-17T10:00:15Z

## Summary
- **Total Events:** 25
- **Critical Events:** 3
- **Average Confidence:** 87.00%
- **Emergency Classification:** EMERGENCY
- **Final Decision:** Emergency Processed Successfully
- **Alerts Sent:** 3
- **Duration:** 15000ms

## Decision Chain
### 1. Emergency Detection Initiated
- **Timestamp:** 2026-05-17T10:00:00Z
- **Confidence:** 100.00%
- **Reasoning:** User triggered emergency via MANUAL

...
```

## 🧪 Testing

### Generate Test Trace
```typescript
import { executeEmergencyPipeline } from './services/antigravity/eventPipeline';

const testContext = {
  userId: 'test-user',
  eventType: 'MANUAL',
  location: {
    latitude: 31.5204,
    longitude: 74.3587,
    accuracy: 10,
    address: 'Test Location',
  },
  transcript: 'Test emergency',
};

const { traceId, result } = await executeEmergencyPipeline(testContext);
console.log(`Test trace created: ${traceId}`);
```

## 🎯 Best Practices

1. **Always start a trace session** for emergency events
2. **Log all AI interactions** with prompts and responses
3. **Track confidence scores** at each decision point
4. **Record fallback actions** when primary actions fail
5. **End trace sessions** to generate summaries
6. **Review traces regularly** to improve detection accuracy
7. **Use confidence scorer** for consistent scoring logic

## 🔒 Security

- Traces contain sensitive user data
- Access requires authentication
- Stored locally in `/antigravity-logs`
- Not exposed via public APIs
- Dashboard requires login

## 📈 Performance

- Async logging (non-blocking)
- File-based storage (no database overhead)
- Automatic session cleanup
- Configurable retention period
- Minimal impact on emergency response time

## 🚀 Production Deployment

1. Ensure `/antigravity-logs` directory has write permissions
2. Configure log rotation for long-term storage
3. Set up monitoring for trace generation
4. Review traces regularly for system improvements
5. Archive old traces to reduce disk usage

## 📚 Related Documentation

- [Emergency Detection Pipeline](./EMERGENCY_PIPELINE.md)
- [AI Integration Guide](./AI_INTEGRATION.md)
- [Confidence Scoring Algorithm](./CONFIDENCE_SCORING.md)
- [Multi-Contact Alert System](./MULTI_CONTACT_EMERGENCY_SYSTEM.md)

---

**Built for SilentSiren AI** - Production-ready emergency tracing system
