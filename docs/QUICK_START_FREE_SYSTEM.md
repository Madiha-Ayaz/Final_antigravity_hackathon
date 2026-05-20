# 🚀 Free Emergency System - Quick Start Guide

## ✅ Installation Complete!

All packages installed successfully:
- ✅ nodemailer@7.0.13
- ✅ @types/nodemailer
- ✅ All other dependencies

---

## 📋 Next Steps

### Step 1: Configure Gmail Credentials

**Option A: Use Existing Gmail**
```bash
# Edit .env file
cd apps/backend
notepad .env
```

**Add these lines:**
```env
# Free SMS Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# App URL
APP_URL=http://localhost:3001
```

**Option B: Get Gmail App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification (if not enabled)
3. Generate app password for "Mail"
4. Copy the 16-character password
5. Add to .env file

---

### Step 2: Start Backend

```bash
cd apps/backend
npm run dev
```

**Expected Output:**
```
✓ Database pool initialized
✓ Antigravity Trace Logger initialized
✓ Server listening on port 3001
✓ Free SMS service initialized successfully
```

---

### Step 3: Start Frontend

**Open new terminal:**
```bash
cd apps/frontend
npm run dev
```

**Expected Output:**
```
✓ Ready in 2.5s
✓ Local: http://localhost:3000
```

---

### Step 4: Test Free Emergency System

**Open browser:**
```
http://localhost:3000/emergency/free-system
```

**Test Flow:**
1. ✅ Add emergency contact with carrier
2. ✅ Record voice
3. ✅ Wait for Gemini AI analysis
4. ✅ If threat detected, trigger emergency
5. ✅ Check SMS, WhatsApp, and phone dialer

---

## 🧪 Quick Test Commands

### Test Gmail SMTP:
```bash
node test-gmail-smtp.js
```

### Test Free Emergency System:
```bash
export TEST_TOKEN=your-jwt-token
node test-free-emergency.js
```

---

## 📱 Features Available

### Free SMS (Email-to-SMS Gateway)
- ✅ 14+ carriers supported
- ✅ Pakistan: Jazz, Telenor, Zong, Ufone
- ✅ USA: Verizon, AT&T, T-Mobile, Sprint
- ✅ India: Airtel, Vodafone, Jio
- ✅ UK: O2, Vodafone, Three

### Native Phone Features
- ✅ WhatsApp messages (wa.me links)
- ✅ Phone calls (tel: protocol)
- ✅ SMS app (sms: protocol)

### Audio Storage
- ✅ Local file storage
- ✅ Public URL generation
- ✅ Audio playback and download

---

## 🎯 API Endpoints

### Get Supported Carriers
```bash
GET /api/emergency-sms/carriers
Authorization: Bearer <token>
```

### Send Free SMS
```bash
POST /api/emergency-sms/send-sms
Authorization: Bearer <token>

Body:
{
  "phoneNumber": "+923001234567",
  "carrier": "jazz",
  "message": "Test message"
}
```

### Send Emergency Alerts
```bash
POST /api/emergency-sms/send-emergency-alerts
Authorization: Bearer <token>

Body:
{
  "contacts": [...],
  "location": "40.7128,-74.0060",
  "audioUrl": "https://example.com/audio.wav"
}
```

---

## ⚠️ Troubleshooting

### Backend Not Starting?
```bash
# Check if nodemailer is installed
npm list nodemailer

# Reinstall if needed
npm install nodemailer @types/nodemailer

# Clear cache and restart
rm -rf node_modules
npm install
npm run dev
```

### Gmail SMTP Not Working?
```bash
# Test credentials
node test-gmail-smtp.js

# Check .env file
cat .env | grep GMAIL

# Verify app password (no spaces)
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### SMS Not Delivered?
- Check carrier is correct
- Verify phone number format (+country code)
- Wait 1-5 minutes for delivery
- Check Gmail sent folder
- Try different carrier gateway

---

## 💰 Cost Summary

| Service | Cost | Limit |
|---------|------|-------|
| Gmail SMTP | FREE | 500/day |
| Audio Storage | FREE | Disk space |
| WhatsApp | FREE | Unlimited |
| Phone Calls | FREE | User's balance |
| **TOTAL** | **₹0** | **Completely FREE** |

---

## 📚 Documentation

- **FREE_EMERGENCY_SYSTEM.md** - Complete guide
- **test-free-emergency.js** - Test suite
- **VOICE_THREAT_DETECTION.md** - Voice analysis docs
- **IMPLEMENTATION_SUMMARY.md** - Technical details

---

## ✅ System Status

- ✅ Backend services created
- ✅ Frontend components created
- ✅ API routes registered
- ✅ Dependencies installed
- ✅ Test scripts ready
- ✅ Documentation complete

**Ready to use!** 🚀

---

## 🎉 What's Next?

1. Configure Gmail credentials
2. Start backend and frontend
3. Open http://localhost:3000/emergency/free-system
4. Add emergency contacts
5. Test voice recording
6. Test emergency alerts

**Total Setup Time: 5 minutes** ⏱️
