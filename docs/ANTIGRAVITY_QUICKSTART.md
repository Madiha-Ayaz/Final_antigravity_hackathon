# 🚀 Antigravity Trace System - Quick Start

## ✅ Installation Complete + NEW FEATURES

Your SilentSiren AI project now has a **complete Antigravity Trace System** with ALL hackathon deliverable requirements implemented!

## 🆕 What's New (100% Complete)

### Emergency Type Classification
- 🔫 ROBBERY - Theft, armed threats, break-ins
- 🏥 MEDICAL - Injuries, medical emergencies
- 🚗 ACCIDENT - Vehicle collisions, crashes
- 👤 HARASSMENT - Stalking, threatening behavior
- 👊 ASSAULT - Physical violence, attacks
- 🔥 FIRE - Fires, smoke, explosions
- 🌪️ NATURAL_DISASTER - Earthquakes, severe weather
- ❌ FALSE_ALARM - Accidental triggers

### Alert Retry & Fallback
- ✅ 3 retry attempts with exponential backoff
- ✅ Automatic fallback: SMS → WhatsApp → Voice
- ✅ Complete trace logging of all attempts

### Mobile Actions
- ✅ Trigger emergency siren
- ✅ Start audio/video recording
- ✅ Activate fullscreen emergency mode

## 📁 What Was Created

### Backend Services (`apps/backend/src/services/antigravity/`)
- ✅ `traceLogger.ts` - Core logging engine
- ✅ `antigravityTrace.ts` - Trace orchestrator
- ✅ `eventPipeline.ts` - Emergency event pipeline
- ✅ `confidenceScorer.ts` - Multi-factor confidence scoring
- ✅ `emergencyClassifier.ts` - **NEW** Emergency type classification
- ✅ `alertRetry.ts` - **NEW** Retry and fallback logic
- ✅ `index.ts` - Exports for easy imports

### Backend Middleware (`apps/backend/src/middleware/`)
- ✅ `traceMiddleware.ts` - Automatic API request tracing

### Backend Routes (`apps/backend/src/routes/`)
- ✅ `traces.ts` - Trace API endpoints
- ✅ Updated `emergency.ts` - Integrated with tracing
- ✅ Updated `index.ts` - Registered trace routes

### Frontend Dashboard (`apps/frontend/src/app/dashboard/traces/`)
- ✅ `page.tsx` - Traces list view
- ✅ `[traceId]/page.tsx` - Trace detail view

### Storage (`antigravity-logs/`)
- ✅ `traces/` - JSON and Markdown trace files
- ✅ `prompts/` - AI prompt logs
- ✅ `.gitignore` - Protect sensitive data

### Documentation
- ✅ `ANTIGRAVITY_TRACE_SYSTEM.md` - Complete documentation

## 🧪 Test It Now

### 1. Start Backend
```bash
cd apps/backend
npm run dev
```

### 2. Trigger Emergency (Creates Trace with Classification)
```bash
# Register/Login first
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+923001234567", "fullName": "Test User"}'

# Save the token from response

# Trigger ROBBERY emergency (this creates a trace with emergency type classification)
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "CRITICAL",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address": "Lahore, Pakistan",
    "transcript": "Help! Someone is trying to rob me with a gun!",
    "aiConfidence": 0.92,
    "detectedPatterns": ["distress_keywords", "panic_tone", "armed_threat"],
    "emotionalStress": 0.85
  }'

# Try MEDICAL emergency
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "CRITICAL",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "transcript": "Emergency! Someone is having a heart attack and unconscious!",
    "aiConfidence": 0.88,
    "detectedPatterns": ["medical_distress", "health_emergency"],
    "emotionalStress": 0.90
  }'
```

### 3. View Traces
```bash
# Get all traces
curl http://localhost:3001/api/traces \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific trace
curl http://localhost:3001/api/traces/TRACE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get trace timeline
curl http://localhost:3001/api/traces/TRACE_ID/timeline \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get statistics
curl http://localhost:3001/api/traces/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. View Dashboard
```bash
# Start frontend
cd apps/frontend
npm run dev

# Open browser
http://localhost:3000/dashboard/traces
```

## 📊 What Gets Logged

Every emergency trigger automatically logs:

1. **Session Start** - Unique trace ID generated
2. **Emergency Type Classification** - ROBBERY, MEDICAL, ACCIDENT, etc.
3. **GPS Event** - Location with accuracy
4. **AI Analysis** - Prompt, response, confidence
5. **Crisis Detection** - Detected/not detected with reasoning
6. **Confidence Score** - Multi-factor scoring
7. **Signal Fusion** - Combined signals with weights
8. **Emergency Classification** - Threat level determination
9. **Mobile Actions** - Siren, Recording, Fullscreen activation
10. **Alert Execution** - SMS, Voice, WhatsApp delivery with retry/fallback
11. **Decision Chain** - Complete reasoning path
12. **Action History** - All actions with status and retry attempts
13. **Session End** - Summary with metrics

## 📁 Output Files

After triggering an emergency, check:

```
antigravity-logs/
├── traces/
│   ├── trace_abc123_2026-05-17T10-00-00.json  ← Structured data
│   └── trace_abc123_2026-05-17T10-00-00.md    ← Human-readable
└── prompts/
    └── prompt_xyz789_1234567890.json           ← AI prompts
```

## 🎯 Key Features

### Automatic Tracing
- ✅ Every emergency trigger creates a trace
- ✅ All API calls logged automatically
- ✅ AI prompts saved to disk
- ✅ Complete decision chain tracked

### Confidence Scoring
```typescript
import { confidenceScorer } from './services/antigravity/confidenceScorer';

const score = confidenceScorer.scoreAIAnalysis(
  0.85,                                    // AI confidence
  ['distress_keywords', 'panic_tone'],     // Patterns
  0.78,                                    // Emotional stress
  150                                      // Transcript length
);

console.log(score.overallScore);         // 0.87
console.log(score.reliability);          // 'HIGH'
console.log(score.recommendations);      // ['High confidence - proceed...']
```

### Event Pipeline
```typescript
import { executeEmergencyPipeline } from './services/antigravity/eventPipeline';

const { traceId, result } = await executeEmergencyPipeline({
  userId: 'user-123',
  eventType: 'MANUAL',
  location: { latitude: 31.5204, longitude: 74.3587, accuracy: 10 },
  transcript: 'Emergency!',
});

console.log(`Trace: ${traceId}`);
console.log(`Success: ${result.success}`);
```

### Dashboard Views
- **Timeline** - Chronological event flow
- **Events** - All logged events with data
- **Decisions** - AI decision chain
- **Actions** - Action execution history

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/traces` | GET | List all traces |
| `/api/traces/:traceId` | GET | Get specific trace |
| `/api/traces/:traceId/events` | GET | Get trace events |
| `/api/traces/:traceId/timeline` | GET | Get timeline view |
| `/api/traces/stats` | GET | Get statistics |
| `/api/traces/active` | GET | Get active sessions |

## 💡 Usage Examples

### Manual Trace Session
```typescript
import { antigravityTrace } from './services/antigravity/antigravityTrace';

// Start
const traceId = antigravityTrace.startEmergencyTrace({
  userId: 'user-123',
  eventType: 'MANUAL',
});

// Log AI analysis
await antigravityTrace.logAIAnalysis(traceId, prompt, 'gemini', result);

// Log signal fusion
antigravityTrace.logSignalFusion(traceId, fusionResult);

// Log alert
await antigravityTrace.logAlertExecution(
  traceId,
  'SMS',
  ['+923343717260'],
  async () => sendSMS()
);

// End
antigravityTrace.endEmergencyTrace(traceId, 'Success', 'COMPLETED');
```

### Confidence Scoring
```typescript
import { confidenceScorer } from './services/antigravity/confidenceScorer';

// Score user trigger
const triggerScore = confidenceScorer.scoreUserTrigger(
  'PANIC_BUTTON',  // Trigger type
  95,              // User reputation (0-100)
  0                // Previous false alarms
);

// Score location
const locationScore = confidenceScorer.scoreLocationAccuracy(
  10,              // Accuracy in meters
  true,            // Has address
  new Date()       // Timestamp
);

// Combine scores
const combined = confidenceScorer.combineScores([
  triggerScore,
  locationScore,
]);

// Get threat level
const threat = confidenceScorer.getThreatLevel(combined.overallScore);
```

## 🎨 Dashboard Features

### Traces List
- Total traces count
- Total events
- Critical events
- Average confidence
- Click to view details

### Trace Detail
- Summary cards (events, confidence, alerts, duration)
- Timeline view with severity colors
- Events tab with full data
- Decisions tab with reasoning
- Actions tab with status

## 🔒 Security

- Traces contain sensitive data
- Authentication required for all endpoints
- Files stored locally (not in database)
- .gitignore protects trace files
- Dashboard requires login

## 📈 Next Steps

1. ✅ **Test the system** - Trigger an emergency
2. ✅ **View traces** - Check dashboard
3. ✅ **Review logs** - Check antigravity-logs folder
4. ✅ **Customize** - Adjust confidence weights
5. ✅ **Monitor** - Review traces regularly

## 🆘 Troubleshooting

### Traces not appearing?
- Check backend is running
- Verify authentication token
- Check antigravity-logs directory permissions

### Dashboard not loading?
- Ensure frontend is running
- Check API URL in frontend code
- Verify authentication

### No trace files created?
- Check directory exists: `antigravity-logs/traces/`
- Verify write permissions
- Check backend logs for errors

## 📚 Documentation

Full documentation: `ANTIGRAVITY_TRACE_SYSTEM.md`

## 🎉 You're Ready!

Your Antigravity Trace System is fully operational. Every emergency trigger now creates a complete trace with:
- AI analysis logging
- Confidence scoring
- Signal fusion
- Alert tracking
- Decision chain
- Action history

**Start testing now!** 🚀
