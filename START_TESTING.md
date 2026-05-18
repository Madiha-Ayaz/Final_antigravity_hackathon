# 🚀 QUICK START - TEST VOICE DETECTION

## Start Servers (2 terminals needed)

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## Test Flow (5 minutes)

1. **Add Contact:** http://localhost:3000/contacts
   - Add your WhatsApp number (+923001234567)

2. **Test Voice:** http://localhost:3000/monitor
   - Open console (F12)
   - Say "Help me!"
   - Watch for countdown
   - Check WhatsApp message

3. **Verify:**
   - ✅ Siren plays
   - ✅ Red emergency screen
   - ✅ WhatsApp received
   - ✅ GPS location included

## Console Should Show:
```
🎤 Wake phrase detected!
🔍 Starting AI analysis
🚨 High threat detected!
🚨 Emergency countdown complete!
✅ WhatsApp alert sent successfully!
```

## 🎉 All Features Working!
