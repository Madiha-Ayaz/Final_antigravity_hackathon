# 🚀 QUICK START GUIDE - WhatsApp + Voice + Audit System

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Dependencies
```bash
# If you have disk space:
cd apps/backend
npm install axios
cd ../..

# If disk space issue, axios is already added to package.json
# Just run: npm install (when space is available)
```

### Step 2: Setup NEON Database
```bash
# Option A: Using psql command
psql "postgresql://neondb_owner:npg_bdflQ1gx7qYz@ep-dry-smoke-aqh2syx4-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database/neon_schema.sql

# Option B: Copy SQL from database/neon_schema.sql and run in NEON console
```

### Step 3: Build Backend
```bash
cd apps/backend
npm run build
cd ../..
```

### Step 4: Start Servers
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 🧪 Test Everything

### Test 1: WhatsApp Service
```bash
node test-whatsapp-service.js
```
This will send 3 test messages to verify WhatsApp is working.

### Test 2: Voice Alert System
1. Open: http://localhost:3000/whatsapp-test
2. Click "Voice Alert System" tab
3. Click "Start Recording"
4. Say "Help me!" or "Emergency!"
5. Click "Stop Recording"
6. Click "Analyze & Send WhatsApp Alert"
7. Check WhatsApp for alerts

### Test 3: Contact Form
1. Open: http://localhost:3000/whatsapp-test
2. Click "Contact Form" tab
3. Fill in the form
4. Click "Send via WhatsApp"
5. Check recipient's WhatsApp

### Test 4: Admin Dashboard
1. Open: http://localhost:3000/admin
2. View audit logs
3. Check abuse metrics
4. Monitor community activity

## 📱 Available Pages

| Page | URL | Description |
|------|-----|-------------|
| WhatsApp Test | http://localhost:3000/whatsapp-test | Test voice alerts and contact form |
| Admin Dashboard | http://localhost:3000/admin | View audit logs and abuse reports |
| Voice Test | http://localhost:3000/test-voice | Original voice monitoring page |
| Emergency Test | http://localhost:3000/emergency-test | Test emergency detection |

## 🔧 API Endpoints

### WhatsApp APIs
```bash
# Send text message
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"+923343717260","message":"Test"}'

# Send emergency alert
curl -X POST http://localhost:3001/api/whatsapp/emergency-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "threatLevel":"HIGH",
    "transcript":"Help me!",
    "reasoning":"Emergency detected",
    "confidence":0.95
  }'

# Check service status
curl http://localhost:3001/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Audit APIs
```bash
# Get audit logs
curl http://localhost:3001/api/audit/logs?limit=50 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get audit statistics
curl http://localhost:3001/api/audit/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Abuse APIs
```bash
# Get abuse metrics
curl http://localhost:3001/api/abuse/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get abuse summary
curl http://localhost:3001/api/abuse/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 How It Works

### Voice Alert Flow
```
User clicks "Start Recording"
    ↓
Browser records audio (MediaRecorder API)
    ↓
User clicks "Stop Recording"
    ↓
User clicks "Analyze & Send"
    ↓
Audio sent to Gemini AI for analysis
    ↓
If emergency detected:
    ├─ Get user's emergency contacts
    ├─ Send WhatsApp text alert to all
    ├─ Send voice recording as attachment
    ├─ Log to audit system
    └─ Update abuse analytics
```

### Contact Form Flow
```
User fills contact form
    ↓
Form submitted to backend
    ↓
Backend formats message
    ↓
Sends via TextMeBot API
    ↓
Logs to database
    ↓
Returns success/failure
```

## 🗄️ Database Tables

- `audit_logs` - All system actions
- `abuse_reports` - User-submitted reports
- `abuse_analytics` - Automated analysis
- `community_validations` - Peer validation
- `user_reputation` - Reputation scores
- `whatsapp_message_logs` - WhatsApp messages
- `community_alerts` - System alerts

## ⚠️ Troubleshooting

### WhatsApp messages not sending?
1. Check API key in .env: `NEXT_PUBLIC_TEXTMEBOT_API_KEY=c5A3asD4RNrv`
2. Test with: `node test-whatsapp-service.js`
3. Check backend logs for errors

### Voice recording not working?
1. Allow microphone permission in browser
2. Use HTTPS or localhost (required for MediaRecorder)
3. Check browser console for errors

### Database errors?
1. Verify NEON connection string in .env
2. Run database schema: `database/neon_schema.sql`
3. Check if tables exist in NEON console

### Axios not installed?
1. Free up disk space
2. Run: `cd apps/backend && npm install axios`
3. Or manually add to package.json (already done)

## 📚 Full Documentation

See `WHATSAPP_VOICE_AUDIT_COMPLETE.md` for complete documentation.

## ✅ Checklist

- [ ] Install axios
- [ ] Run database schema
- [ ] Build backend
- [ ] Start servers
- [ ] Test WhatsApp service
- [ ] Test voice alerts
- [ ] Test contact form
- [ ] Check admin dashboard
- [ ] Verify audit logs
- [ ] Check abuse metrics

## 🎉 You're Ready!

Your app now has:
✅ WhatsApp messaging (text + voice)
✅ Voice recording + AI analysis
✅ Contact form integration
✅ Complete audit logging
✅ Abuse detection system
✅ Community validation

Start testing and enjoy! 🚀
