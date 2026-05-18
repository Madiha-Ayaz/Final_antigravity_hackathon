# 🚀 Quick Start - SilentSiren AI

## Sabse Aasan Tarika (Easiest Way)

### Option 1: Batch Script (Recommended)
```bash
# Double-click this file:
start-servers.bat
```

Yeh automatically dono servers start kar dega!

---

## Manual Start (If batch script doesn't work)

### Terminal 1 - Backend
```bash
cd apps\backend
npm run dev
```

**Wait for:** `Server running on port 3001`

### Terminal 2 - Frontend
```bash
cd apps\frontend
npm run dev
```

**Wait for:** `Ready in 5s - Local: http://localhost:3000`

---

## 🧪 Testing Steps

### 1. Open Monitor Page
```
http://localhost:3000/monitor
```

### 2. Grant Permissions
- ✅ Allow Microphone
- ✅ Allow Location

### 3. System Auto-Starts
- Audio visualizer shows bars
- GPS coordinates appear
- Status shows "ACTIVE"

### 4. Trigger Emergency
**Say any wake phrase:**
- "help me"
- "emergency"
- "call police"

### 5. Watch the Flow
1. 🎤 Wake phrase detected → Toast notification
2. 🤖 AI analyzes → Threat level shown
3. ⏱️ Countdown → 10 seconds
4. 📱 Alerts → Browser notifications
5. 🚨 Emergency mode → Full screen

---

## 🎯 Test Crisis Page

### Open Crisis Dashboard
```
http://localhost:3000/crisis
```

### Click Scenarios
- **Fire Scenario** → AI agents analyze fire
- **Flood Scenario** → AI agents analyze flood
- **False Alarm** → AI detects false alarm

### See Results
- Agent workflow trace
- Severity level
- Resource allocation
- Dispatch decision

---

## ✅ What's Fixed

1. ✅ **No Authentication** - Direct access
2. ✅ **No Twilio** - Browser notifications instead
3. ✅ **Auto-start** - Monitoring begins automatically
4. ✅ **AI Analysis** - Works without login
5. ✅ **Crisis Page** - All scenarios working

---

## 🔍 Check if Working

### Backend Check
```bash
curl http://localhost:3001/api/health
```

**Should return:** `{"status":"ok"}`

### Frontend Check
Open browser: `http://localhost:3000`

**Should show:** Landing page

---

## 📞 Emergency Contact

Agar koi problem ho to:
1. Check backend terminal for errors
2. Check frontend terminal for errors
3. Open browser console (F12)
4. Check network tab for failed requests

---

## 🎉 Ab Bas Start Karo!

```bash
# Run this:
start-servers.bat

# Or manually:
# Terminal 1: cd apps\backend && npm run dev
# Terminal 2: cd apps\frontend && npm run dev
```

**Phir browser me jao:** `http://localhost:3000/monitor`

**Sab automatic hai - bas microphone permission do aur "help me" bolo!** 🎤🚨
