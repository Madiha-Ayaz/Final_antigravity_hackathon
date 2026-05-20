# 🎯 COMPLETE TESTING GUIDE - SilentSiren AI

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/frontend
npm install framer-motion
```

### 2. Environment Setup
Make sure your `.env` files are configured:

**Backend** (`apps/backend/.env`):
```env
# Required
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret-32-chars-minimum
ENCRYPTION_KEY=your-encryption-key-32-chars

# Optional (has free fallbacks)
OPENROUTER_API_KEY=your-openrouter-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Emergency Services (Configurable)
EMERGENCY_AMBULANCE_NUMBER=911
EMERGENCY_POLICE_NUMBER=911
EMERGENCY_AMBULANCE_LAT=31.5204
EMERGENCY_AMBULANCE_LNG=74.3587
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start the Application
```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

---

## 🧪 Testing Each Feature

### 1. 🚨 **Siren & Emergency Detection**

**URL:** `http://localhost:3000/silent-siren`

**Test Steps:**
1. Click "▶️ Start Protection"
2. Allow microphone access when prompted
3. Speak emergency words: "help", "emergency", "danger", "save me"
4. Wait 10 seconds for AI analysis
5. **Expected Results:**
   - ✅ Siren sound plays (alternating tones)
   - ✅ Message editor modal appears
   - ✅ GPS location captured
   - ✅ 3-minute countdown starts
   - ✅ Analysis log shows red "🚨 THREAT: HIGH"

**Manual Panic Test:**
1. Click "🚨 MANUAL PANIC TRIGGER" button
2. **Expected Results:**
   - ✅ Siren plays immediately
   - ✅ Message editor opens
   - ✅ GPS location attached

---

### 2. 💬 **Message Editor with 3-Minute Delay**

**When emergency detected:**

**Test Steps:**
1. Emergency detected → Modal opens
2. Edit the message text
3. See countdown timer (3:00, 2:59, 2:58...)
4. **Options:**
   - Click "Send Now to WhatsApp" - Sends immediately
   - Click "Cancel Auto-Send" - Stops countdown
   - Wait 3 minutes - Auto-sends

**Expected Results:**
- ✅ Message is editable
- ✅ GPS location shown with accuracy
- ✅ Google Maps link available
- ✅ Countdown visible
- ✅ Message sent to WhatsApp contacts

---

### 3. 📍 **GPS Location Services**

**Test Steps:**
1. Open any page with GPS functionality
2. Browser asks for location permission
3. Allow location access

**Expected Results:**
- ✅ Location captured with coordinates
- ✅ Accuracy displayed (±Xm)
- ✅ Google Maps link generated
- ✅ Location attached to emergency messages

**Check GPS:**
```javascript
// In browser console
navigator.geolocation.getCurrentPosition(
  (pos) => console.log(pos.coords),
  (err) => console.error(err)
);
```

---

### 4. 🚨 **Crisis Management Dashboard**

**URL:** `http://localhost:3000/crisis`

**Test Steps:**
1. Click "🔥 Fire Emergency" button
2. Watch AI agents orchestrate response
3. View real-time map updates
4. Check resource allocation
5. See AI trace timeline

**Expected Results:**
- ✅ Animated background effects
- ✅ Scenario simulation runs
- ✅ Map shows incident location
- ✅ Resources deployed (ambulance, police)
- ✅ AI agent logs visible
- ✅ Severity panel shows threat level
- ✅ Simulation insights displayed

**Test Other Scenarios:**
- Click "🌊 Flood Alert"
- Click "🛡️ Test False Alarm"

---

### 5. 📊 **Agent Logs & Tracing**

**URL:** `http://localhost:3000/agent-logs`

**Test Steps:**
1. Navigate to agent logs page
2. Run a crisis scenario first
3. View real-time agent activities
4. Filter by agent type
5. Check statistics

**Expected Results:**
- ✅ Live activity stream
- ✅ Auto-refresh every 5 seconds
- ✅ Color-coded agents
- ✅ Statistics dashboard
- ✅ Expandable log details
- ✅ Filter buttons work

**Agents to Look For:**
- AudioAnalysisAgent (blue)
- VerificationAgent (purple)
- DispatchAgent (red)
- SignalFusionAgent (yellow)
- CrisisVerificationAgent (indigo)

---

### 6. 👥 **Emergency Contacts**

**URL:** `http://localhost:3000/contacts`

**Test Steps:**
1. Click "Add Emergency Contact"
2. Fill in details:
   - Name: "John Doe"
   - Phone: "+923001234567"
   - Relationship: "Friend"
3. Enable WhatsApp notification
4. Click "Add Contact"

**Expected Results:**
- ✅ Contact added successfully
- ✅ Contact card displays
- ✅ WhatsApp badge visible
- ✅ Delete button works

---

### 7. 📱 **PWA Installation (Mobile App)**

**On Mobile:**
1. Open app in Chrome/Safari
2. Look for "Add to Home Screen" prompt
3. Click "Install" or "Add"
4. App icon appears on home screen
5. Open app - works like native app

**On Desktop:**
1. Look for install icon in address bar
2. Click "Install SilentSiren"
3. App opens in standalone window

**Expected Results:**
- ✅ App installs successfully
- ✅ Works offline (cached resources)
- ✅ Push notifications enabled
- ✅ Standalone display mode

---

### 8. 🎨 **Responsive Design**

**Test on Different Devices:**

**Mobile (375px):**
- ✅ Siren page: Single column layout
- ✅ Crisis page: Stacked sections
- ✅ Buttons: Full width
- ✅ Text: Readable sizes

**Tablet (768px):**
- ✅ Two-column layouts
- ✅ Larger buttons
- ✅ Better spacing

**Desktop (1920px):**
- ✅ Multi-column grids
- ✅ Sidebar layouts
- ✅ Full-width maps

**Test Method:**
```
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select different devices
4. Check all pages
```

---

### 9. 🤖 **OpenRouter AI Analysis**

**Test Steps:**
1. Start siren monitoring
2. Speak into microphone
3. Wait for analysis
4. Check console logs

**Expected Console Output:**
```
Sending audio segment to Gemini API...
Gemini Analysis Result: {
  transcript: "help me please",
  emergencyDetected: true,
  confidence: 0.95,
  threatLevel: "HIGH",
  reasoning: "Emergency keywords detected"
}
```

**Fallback Test:**
- If Gemini fails → OpenRouter tries
- If OpenRouter fails → Uses safety fallback

---

### 10. 📞 **Twilio Integration**

**Test SMS:**
```bash
# Test endpoint
curl -X POST http://localhost:3001/api/emergency-sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923001234567",
    "message": "Test emergency alert"
  }'
```

**Expected Results:**
- ✅ SMS sent via Twilio (if configured)
- ✅ Falls back to Textbelt (free)
- ✅ Success response returned

---

## 🐛 Troubleshooting

### Siren Not Playing?
**Check:**
1. Browser allows audio autoplay
2. Volume is not muted
3. Console shows no errors
4. Emergency actually detected (check logs)

**Fix:**
```javascript
// In browser console
const audio = new Audio();
audio.play(); // Should work after user interaction
```

### GPS Not Working?
**Check:**
1. HTTPS or localhost (required for GPS)
2. Location permission granted
3. GPS enabled on device

**Fix:**
```
Chrome: Settings → Privacy → Location → Allow
```

### Message Editor Not Showing?
**Check:**
1. Emergency actually detected
2. Console for errors
3. Modal z-index (should be 50)

**Debug:**
```javascript
// In browser console
console.log('Emergency detected:', data.analysis.emergencyDetected);
```

### API Errors?
**Check:**
1. Backend is running (port 3001)
2. CORS configured correctly
3. Environment variables set
4. Database connected

**Test Backend:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy"}
```

---

## 📊 Expected Behavior Summary

| Feature | Status | Action |
|---------|--------|--------|
| Siren Sound | ✅ | Plays on emergency |
| Message Editor | ✅ | Opens with 3-min delay |
| GPS Location | ✅ | Auto-captured |
| WhatsApp Alerts | ✅ | Sent to contacts |
| Crisis Dashboard | ✅ | Responsive & animated |
| Agent Logs | ✅ | Real-time monitoring |
| PWA Install | ✅ | Works on all devices |
| Responsive Design | ✅ | Mobile-first |
| OpenRouter API | ✅ | Multi-model fallback |
| Emergency Config | ✅ | No hard-coding |

---

## 🎉 Success Indicators

**You'll know it's working when:**

1. **Siren Page:**
   - 🔊 Hear siren sound when emergency detected
   - 📱 Message editor pops up
   - 📍 GPS coordinates shown
   - ⏱️ Countdown timer visible

2. **Crisis Page:**
   - 🎨 Smooth animations
   - 🗺️ Map updates in real-time
   - 🤖 Agent logs populate
   - 📊 Statistics update

3. **Agent Logs:**
   - 🔄 Auto-refreshes every 5 seconds
   - 🎨 Color-coded agents
   - 📈 Statistics dashboard
   - 🔍 Filterable logs

4. **Mobile App:**
   - 📲 Install prompt appears
   - 🏠 Icon on home screen
   - 📴 Works offline
   - 🔔 Push notifications

---

## 🚀 Next Steps

1. **Test all features** using this guide
2. **Add emergency contacts** in `/contacts`
3. **Configure environment variables** for your region
4. **Install as mobile app** for best experience
5. **Test emergency scenarios** to verify alerts

---

## 📞 Support

If something doesn't work:
1. Check console for errors (F12)
2. Verify environment variables
3. Ensure backend is running
4. Check browser permissions
5. Review the troubleshooting section

**Everything is now fully functional!** 🎉
