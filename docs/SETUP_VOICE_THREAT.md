# Voice Threat Detection System - Setup Guide

## Quick Setup (5 minutes)

### 1. Database Migration

Run the migration to create necessary tables:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i apps/backend/src/db/migrations/004_add_voice_threat_detection.sql

# Verify tables created
\dt voice_threat_sessions
\dt emergency_alerts
\dt alert_notifications
\dt safety_confirmations
```

### 2. Environment Configuration

Update your `.env` file with these new variables:

```env
# Gemini AI (Required)
GEMINI_API_KEY=your-gemini-api-key-here

# Twilio WhatsApp (Required for notifications)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Emergency Services (Optional)
EMERGENCY_AMBULANCE_NUMBER=911
EMERGENCY_POLICE_NUMBER=911
EMERGENCY_COUNTDOWN_SECONDS=120
```

### 3. Get API Keys

#### Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env`

#### Twilio WhatsApp (if not already configured)
1. Go to https://console.twilio.com/
2. Get your Account SID and Auth Token
3. Set up WhatsApp sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
4. Copy the WhatsApp number (usually `whatsapp:+14155238886`)

### 4. Start the System

```bash
# Backend
cd apps/backend
npm run dev

# Frontend (in another terminal)
cd apps/frontend
npm run dev
```

### 5. Test the System

```bash
# Set your JWT token
export TEST_TOKEN=your-jwt-token-here

# Run tests
node test-voice-threat-system.js
```

## Usage

### Frontend Integration

Navigate to: `http://localhost:3000/emergency/voice-threat`

Or integrate into your app:

```tsx
import { useVoiceThreatDetection } from '@/hooks/useVoiceThreatDetection';
import { EmergencyAlert } from '@/components/EmergencyAlert';

function MyComponent() {
  const {
    isRecording,
    threatDetected,
    alertActive,
    startRecording,
    stopRecording,
    confirmSafe,
  } = useVoiceThreatDetection();

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Record'}
      </button>

      {alertActive && (
        <EmergencyAlert
          threatLevel="HIGH"
          emergencyType="PHYSICAL_ASSAULT"
          confidence={0.92}
          reasoning="Detected distress signals"
          expiresAt={new Date(Date.now() + 120000)}
          onConfirmSafe={confirmSafe}
        />
      )}
    </div>
  );
}
```

### API Usage

```javascript
// 1. Analyze voice for threats
const formData = new FormData();
formData.append('audio', audioBlob);

const response = await fetch('/api/voice-threat/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { sessionId, isThreat, threatLevel } = await response.json();

// 2. If threat detected, trigger emergency
if (isThreat) {
  const alertResponse = await fetch('/api/voice-threat/emergency/trigger', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
    })
  });

  const { alertId, countdownStarted } = await alertResponse.json();
}

// 3. User confirms safety
await fetch('/api/voice-threat/emergency/confirm-safe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ alertId })
});
```

## Emergency Flow

```
User speaks → Record audio → Send to Gemini AI
                                    ↓
                            Threat detected?
                                    ↓
                                  YES
                                    ↓
                    🚨 Siren plays immediately
                                    ↓
                    ⏱️ 2-minute countdown starts
                                    ↓
                    User can click "I am safe"
                                    ↓
                            Clicked? → YES → Cancel alert
                                ↓              Send "I am safe" message
                               NO
                                ↓
                    After 2 minutes, auto-activate:
                    ├─ 📱 WhatsApp to all contacts
                    ├─ 📍 GPS location shared
                    ├─ 🚑 Ambulance called
                    └─ 📝 Emergency event logged
```

## Troubleshooting

### "Gemini API key not configured"
- Check `.env` file has `GEMINI_API_KEY`
- Restart backend server after adding key
- Verify key is valid at https://makersuite.google.com/

### "WhatsApp messages not sending"
- Verify Twilio credentials in `.env`
- Check WhatsApp sandbox is approved
- Test with Twilio console first
- Ensure phone numbers are in E.164 format (+1234567890)

### "Database tables not found"
- Run migration: `psql $DATABASE_URL -f apps/backend/src/db/migrations/004_add_voice_threat_detection.sql`
- Check connection: `psql $DATABASE_URL -c "\dt"`
- Verify DATABASE_URL is correct

### "Audio recording not working"
- Check browser permissions (microphone access)
- Use HTTPS (required for getUserMedia)
- Test in Chrome/Firefox (best support)

### "GPS location not available"
- Enable location services in browser
- Grant location permission when prompted
- Use HTTPS connection
- Check device has GPS enabled

## Testing Scenarios

### 1. Test Voice Analysis
```bash
curl -X POST http://localhost:3001/api/voice-threat/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@test-audio.wav"
```

### 2. Test Emergency Trigger
```bash
curl -X POST http://localhost:3001/api/voice-threat/emergency/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "uuid-here",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10
    }
  }'
```

### 3. Test Safety Confirmation
```bash
curl -X POST http://localhost:3001/api/voice-threat/emergency/confirm-safe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"alertId": "uuid-here"}'
```

## Security Notes

1. **Authentication Required**: All endpoints require valid JWT token
2. **Rate Limiting**: 10 requests per minute per user
3. **Audio Validation**: Max 10MB, supported formats: wav, mp3, ogg
4. **Location Privacy**: GPS coordinates encrypted in transit
5. **Audit Logging**: All emergency events logged for review

## Production Checklist

- [ ] Set strong `JWT_SECRET` in production
- [ ] Configure real Twilio WhatsApp number (not sandbox)
- [ ] Set up proper emergency service numbers
- [ ] Enable HTTPS for frontend
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and alerts
- [ ] Test emergency flow end-to-end
- [ ] Train users on "I am safe" button
- [ ] Set up backup notification methods
- [ ] Configure database backups

## Support

For issues:
1. Check logs: `tail -f apps/backend/logs/app.log`
2. Test API: `node test-voice-threat-system.js`
3. Review documentation: `VOICE_THREAT_DETECTION.md`
4. Check database: `psql $DATABASE_URL`

## Next Steps

1. ✅ Complete setup above
2. 🧪 Run test suite
3. 🎤 Test voice recording
4. 📱 Add emergency contacts
5. 🚨 Test emergency flow
6. 🚀 Deploy to production
