# Voice Threat Detection System

## Overview

The Voice Threat Detection System uses Google Gemini AI to analyze voice recordings in real-time, detect potential threats, and automatically trigger emergency responses with a 2-minute countdown timer.

## Features

### 🎤 Voice Analysis
- Real-time voice recording and analysis using Gemini AI
- Threat detection with confidence scoring
- Emergency type classification (assault, medical, fire, etc.)
- Emotional stress level detection
- Keyword and pattern recognition

### 🚨 Emergency Response Flow

1. **Voice Analysis** → Gemini AI analyzes audio for threats
2. **Threat Detection** → If threat detected, trigger emergency alert
3. **Siren Activation** → Loud siren plays immediately
4. **2-Minute Countdown** → User has 2 minutes to cancel
5. **Safety Confirmation** → User can click "I am safe" to cancel
6. **Auto-Activation** → After 2 minutes, if not cancelled:
   - WhatsApp messages sent to all emergency contacts
   - GPS location shared automatically
   - Ambulance call initiated (if configured)
   - Emergency event logged

### 📱 User Actions

- **"I am safe" button** → Cancels alert, sends "I am safe" message to contacts
- **Cancel button** → Stops countdown before activation
- **Manual trigger** → User can manually trigger emergency alert

## API Endpoints

### Voice Analysis
```
POST /api/voice-threat/analyze
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- audio: File (audio recording)
- location: { latitude, longitude, accuracy } (optional)

Response:
{
  "sessionId": "uuid",
  "isThreat": true,
  "threatLevel": "HIGH",
  "confidence": 0.92,
  "emergencyType": "PHYSICAL_ASSAULT",
  "reasoning": "Detected distress signals...",
  "transcript": "Help me please...",
  "shouldTriggerEmergency": true
}
```

### Trigger Emergency
```
POST /api/voice-threat/emergency/trigger
Authorization: Bearer <token>

Body:
{
  "sessionId": "uuid",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  }
}

Response:
{
  "alertId": "uuid",
  "countdownStarted": true,
  "expiresAt": "2024-01-01T12:02:00Z",
  "sirenTriggered": true
}
```

### Confirm Safety
```
POST /api/voice-threat/emergency/confirm-safe
Authorization: Bearer <token>

Body:
{
  "alertId": "uuid"
}

Response:
{
  "cancelled": true,
  "notificationsSent": true,
  "message": "Emergency cancelled - user confirmed safe"
}
```

### Check Status
```
GET /api/voice-threat/emergency/status/:alertId
Authorization: Bearer <token>

Response:
{
  "alertId": "uuid",
  "status": "COUNTDOWN",
  "timeRemaining": 87,
  "expiresAt": "2024-01-01T12:02:00Z",
  "userConfirmedSafe": false,
  "contactsNotified": false
}
```

### Manage Emergency Contacts
```
GET /api/voice-threat/emergency/contacts
POST /api/voice-threat/emergency/contacts
PUT /api/voice-threat/emergency/contacts/:id
DELETE /api/voice-threat/emergency/contacts/:id
Authorization: Bearer <token>
```

## Frontend Components

### EmergencyAlert Component
```tsx
import { EmergencyAlert } from '@/components/EmergencyAlert';

<EmergencyAlert
  threatLevel="HIGH"
  emergencyType="PHYSICAL_ASSAULT"
  confidence={0.92}
  reasoning="Detected distress signals..."
  expiresAt={new Date()}
  onConfirmSafe={() => handleSafe()}
  onCancel={() => handleCancel()}
/>
```

### useVoiceThreatDetection Hook
```tsx
import { useVoiceThreatDetection } from '@/hooks/useVoiceThreatDetection';

const {
  isRecording,
  isAnalyzing,
  threatDetected,
  alertActive,
  timeRemaining,
  startRecording,
  stopRecording,
  confirmSafe,
  cancelAlert,
  triggerManualEmergency
} = useVoiceThreatDetection();
```

## Database Schema

### voice_threat_sessions
Stores voice analysis results from Gemini AI.

### emergency_alerts
Tracks emergency alerts with countdown timers.

### alert_notifications
Logs all notifications sent to emergency contacts.

### safety_confirmations
Records user safety confirmations.

## Configuration

### Environment Variables
```env
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Twilio (for WhatsApp and calls)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Emergency Services
EMERGENCY_AMBULANCE_NUMBER=911
EMERGENCY_POLICE_NUMBER=911
```

### Gemini AI Configuration
The system uses Gemini 1.5 Pro with the following settings:
- Temperature: 0.3 (for consistent threat detection)
- Max tokens: 2000
- Safety settings: Block only high-risk content

## Testing

Run the test suite:
```bash
# Set your test token
export TEST_TOKEN=your-jwt-token

# Run tests
node test-voice-threat-system.js
```

Test scenarios:
1. Voice threat analysis
2. Emergency trigger with countdown
3. Safety confirmation
4. Status checking
5. Emergency contacts management
6. Complete emergency flow (2-minute countdown)

## Security Considerations

1. **Authentication Required** - All endpoints require valid JWT token
2. **Rate Limiting** - Strict rate limits on analysis endpoints
3. **Audio Validation** - File size and format validation
4. **Location Privacy** - GPS coordinates encrypted in transit
5. **Contact Privacy** - Emergency contacts stored securely
6. **Audit Logging** - All emergency events logged for review

## Emergency Response Timeline

```
0:00 - Threat detected by Gemini AI
0:01 - Siren starts playing
0:02 - Emergency alert UI shown
0:05 - User can click "I am safe"
2:00 - If not cancelled, auto-activate:
       ├─ WhatsApp messages sent
       ├─ GPS location shared
       ├─ Ambulance called
       └─ Emergency event created
```

## Notification Messages

### WhatsApp Emergency Alert
```
🚨 EMERGENCY ALERT 🚨

[User Name] needs help!

Threat Level: HIGH
Type: Physical Assault
Time: 2024-01-01 12:00:00

📍 Location:
https://maps.google.com/?q=40.7128,-74.0060

This is an automated emergency alert from SilentSiren.
```

### Safety Confirmation Message
```
✅ SAFETY CONFIRMED

[User Name] has confirmed they are safe.

The emergency alert has been cancelled.

Time: 2024-01-01 12:01:30
```

## Troubleshooting

### Gemini API Errors
- Check API key is valid
- Verify API quota not exceeded
- Check audio format is supported

### WhatsApp Not Sending
- Verify Twilio credentials
- Check WhatsApp sandbox approval
- Verify phone numbers are E.164 format

### GPS Not Working
- Check browser location permissions
- Verify HTTPS connection
- Check location services enabled

## Future Enhancements

- [ ] Multi-language support for voice analysis
- [ ] Live audio streaming analysis
- [ ] Integration with local emergency services
- [ ] Community alert system
- [ ] False alarm prevention with ML
- [ ] Voice biometric verification
- [ ] Offline mode with local processing

## Support

For issues or questions:
- GitHub Issues: [repository-url]
- Email: support@silentsiren.com
- Documentation: [docs-url]
