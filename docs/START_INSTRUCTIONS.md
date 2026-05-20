# 🚀 SilentSiren - Complete Startup Instructions

## Current Status

✅ **Database**: Neon PostgreSQL - Connected and ready
✅ **Dependencies**: All packages installed
❌ **Gemini API**: Invalid key - MUST FIX BEFORE STARTING
⚠️ **OpenRouter**: Rate limited (optional)
⚠️ **Firebase**: Needs configuration (optional)

---

## Step 1: Fix Gemini API Key (REQUIRED)

### Get Your Key:
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

### Update .env file:
Open `.env` file and replace:
```
GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY_HERE
```
with your actual key:
```
GEMINI_API_KEY=AIzaSy...your_actual_key
```

---

## Step 2: Test All Services

Run this to verify everything works:
```bash
node test-services.js
```

Expected output:
- ✓ Database connected
- ✓ Gemini API working
- ⚠️ OpenRouter (may be rate limited - OK)

---

## Step 3: Start the Application

### Option A: Start Both Servers (Recommended)
```bash
# Windows
start-servers.bat

# Or manually:
npm run dev
```

### Option B: Start Individually

**Backend (Terminal 1):**
```bash
cd apps/backend
npm run dev
```
Backend will run on: http://localhost:3001

**Frontend (Terminal 2):**
```bash
cd apps/frontend
npm run dev
```
Frontend will run on: http://localhost:3000

---

## Step 4: Verify It's Working

1. Open browser: http://localhost:3000
2. Check backend health: http://localhost:3001/health
3. Check logs in terminal for any errors

---

## Troubleshooting

### Backend won't start?
- Check if Gemini API key is valid
- Verify DATABASE_URL is correct
- Check if port 3001 is available

### Frontend won't start?
- Check if port 3000 is available
- Verify NEXT_PUBLIC_API_URL in .env

### Database errors?
- Run migration: `cd apps/backend && npm run migrate`
- Check Neon dashboard for connection issues

### API errors?
- Test services: `node test-services.js`
- Check API key validity
- Look at backend logs for details

---

## Optional: Configure Firebase (For Push Notifications)

1. Go to: https://console.firebase.google.com/
2. Select project: `silentsiren-b4cd2`
3. Project Settings → Service Accounts
4. Generate New Private Key
5. Update .env with values from downloaded JSON

---

## Quick Commands Reference

```bash
# Test all services
node test-services.js

# Start everything
npm run dev

# Backend only
cd apps/backend && npm run dev

# Frontend only  
cd apps/frontend && npm run dev

# Run database migration
cd apps/backend && npm run migrate

# Check logs
# Backend logs appear in terminal
# Frontend logs in browser console
```

---

## What's Next?

Once servers are running:
1. Create a user account
2. Test emergency detection
3. Configure emergency contacts
4. Test push notifications (if Firebase configured)

---

## Need Help?

- Check logs in terminal
- Run `node test-services.js` to diagnose
- Review error messages carefully
- Ensure all API keys are valid
