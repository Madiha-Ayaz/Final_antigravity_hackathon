╔════════════════════════════════════════════════════════════════╗
║        🧪 COMPLETE TESTING GUIDE - STEP BY STEP               ║
╚════════════════════════════════════════════════════════════════╝

## 📋 TESTING CHECKLIST

Follow these steps in order to test all features:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 1: START BACKEND SERVER ✅

### Terminal 1 - Backend
```bash
cd apps/backend
npm run dev
```

**Expected Output:**
```
[INFO] Database pool initialized
[INFO] Database connected successfully
[INFO] Redis connected successfully
[INFO] Server running on port 3001 in development mode
```

**Ignore These Warnings:**
- SSL mode warning (normal for NEON)
- Firebase Admin SDK error (optional feature)
- Deprecation warnings

**Test Backend Health:**
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 2: START FRONTEND SERVER ✅

### Terminal 2 - Frontend
```bash
npm run dev:frontend
```

**Expected Output:**
```
> next dev
ready - started server on 0.0.0.0:3000
```

**Test Frontend:**
Open: http://localhost:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 3: TEST WHATSAPP SERVICE ✅

### Test 1: Direct API Test
```bash
node test-whatsapp-service.js
```

**What This Does:**
- Sends 3 test messages to +923343717260
- Tests: text message, emergency alert, contact form

**Expected Output:**
```
✅ Text message sent successfully!
✅ Emergency alert sent successfully!
✅ Contact form message sent successfully!
```

**Check WhatsApp:**
Open WhatsApp on +923343717260 and verify 3 messages received.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 4: TEST VOICE ALERT SYSTEM ✅

### Open Test Page:
http://localhost:3000/whatsapp-test

### Steps:
1. Click "Voice Alert System" tab
2. Click "🎤 Start Recording" button
3. Say clearly: "Help me!" or "Emergency!"
4. Click "⏹️ Stop Recording" button
5. Click "🔍 Analyze & Send WhatsApp Alert"

**What Happens:**
1. Audio is recorded (you'll see audio player)
2. Gemini AI analyzes the audio
3. If emergency detected:
   - Shows transcript
   - Shows analysis reasoning
   - Sends WhatsApp alerts to emergency contacts
   - Shows success message

**Expected Result:**
```
✅ WhatsApp alerts sent to X contacts
```

**Check:**
- Transcript appears on screen
- Analysis shows emergency detected
- WhatsApp messages received

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 5: TEST CONTACT FORM ✅

### Open Test Page:
http://localhost:3000/whatsapp-test

### Steps:
1. Click "Contact Form" tab
2. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Phone: +92 300 1234567 (optional)
   - Message: Test message
3. Click "📤 Send via WhatsApp"

**Expected Result:**
```
✅ Message sent successfully via WhatsApp!
```

**Check WhatsApp:**
Recipient (+923452508043) should receive formatted message:
```
📝 *New Contact Form Submission*

*Name:* Your Name
*Email:* your@email.com
*Phone:* +92 300 1234567

*Message:*
Test message

_Sent via SilentSiren AI Contact Form_
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 6: TEST ADMIN DASHBOARD ✅

### Open Admin Page:
http://localhost:3000/admin

**Note:** You need to be logged in. If not logged in:
1. Go to: http://localhost:3000/login
2. Login with your credentials
3. Then open admin page

### Test Audit Logs Tab:
1. Click "📋 Audit Logs" tab
2. Should see recent actions
3. Click "🔄 Refresh" to reload

**Expected:**
- Table showing recent audit logs
- Columns: Timestamp, Action, User ID, Status
- Color-coded status badges

### Test Abuse Reports Tab:
1. Click "🚨 Abuse Reports" tab
2. Should see abuse metrics
3. Click "🔄 Refresh" to reload

**Expected:**
- Cards showing:
  - Total Incidents
  - False Alarms
  - Validated Incidents
  - False Alarm Rate
  - Average Confidence
  - Suspicious Users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 7: TEST API ENDPOINTS ✅

### Get Auth Token First:
```bash
# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Save the token from response.

### Test WhatsApp API:
```bash
# Send text message
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"+923343717260","message":"API test message"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "wa_...",
    "recipient": "+923343717260"
  }
}
```

### Test Audit API:
```bash
curl http://localhost:3001/api/audit/logs?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 10
  }
}
```

### Test Abuse API:
```bash
curl http://localhost:3001/api/abuse/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalIncidents": 0,
    "falseAlarms": 0,
    ...
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 8: TEST EMERGENCY CONTACTS ✅

### Add Emergency Contact:
```bash
curl -X POST http://localhost:3001/api/contacts/emergency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Emergency Contact",
    "phoneNumber": "+923343717260",
    "relationship": "Friend",
    "priority": 1,
    "notifyWhatsapp": true
  }'
```

### Get Emergency Contacts:
```bash
curl http://localhost:3001/api/contacts/emergency \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Emergency Alert to All Contacts:
```bash
curl -X POST http://localhost:3001/api/whatsapp/emergency-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "threatLevel": "HIGH",
    "transcript": "Help me please!",
    "reasoning": "Emergency keywords detected",
    "confidence": 0.95,
    "location": {
      "latitude": 31.5204,
      "longitude": 74.3587
    }
  }'
```

**Expected:**
All emergency contacts with WhatsApp enabled receive alert.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🐛 TROUBLESHOOTING

### Backend Won't Start:
```bash
# Kill port 3001
kill-port-3001.bat

# Or use clean start script
start-backend-clean.bat
```

### WhatsApp Messages Not Sending:
1. Check API key in .env: `NEXT_PUBLIC_TEXTMEBOT_API_KEY=c5A3asD4RNrv`
2. Test directly: `node test-whatsapp-service.js`
3. Check backend logs for errors

### Voice Recording Not Working:
1. Allow microphone permission in browser
2. Use HTTPS or localhost (required)
3. Check browser console for errors
4. Try different browser (Chrome recommended)

### Database Errors:
1. Verify NEON connection in .env
2. Run schema: `database/neon_schema.sql`
3. Check NEON console for tables

### Authentication Errors:
1. Register new user first
2. Login to get token
3. Use token in Authorization header

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ SUCCESS CRITERIA

All tests passed if:
- ✅ Backend starts without errors
- ✅ Frontend loads successfully
- ✅ WhatsApp test script sends 3 messages
- ✅ Voice recording works and analyzes
- ✅ Contact form sends to WhatsApp
- ✅ Admin dashboard shows data
- ✅ API endpoints return success
- ✅ Emergency alerts reach contacts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📱 MOBILE TESTING

### Test on Phone:
1. Find your computer's IP: `ipconfig` (look for IPv4)
2. Open on phone: `http://YOUR_IP:3000/whatsapp-test`
3. Test voice recording
4. Test contact form
5. Verify responsive design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 **TESTING COMPLETE!**

Sab features working hain to aapki app ready hai! 🚀
