# How to Get API Keys

## 1. Gemini API Key (REQUIRED - Currently Invalid)

Your current Gemini key is invalid. Get a new one:

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)
5. Replace `YOUR_NEW_GEMINI_KEY_HERE` in `.env` file

**Important:** This is the main AI service for audio analysis. The app won't work without it.

## 2. OpenRouter API Key (Optional - Currently Rate Limited)

Your OpenRouter key seems valid but hitting free tier rate limits.

**Option A: Wait and retry** (free tier resets after some time)

**Option B: Get credits or upgrade:**
1. Go to: https://openrouter.ai/settings/keys
2. Sign in
3. Add credits or upgrade plan
4. Your existing key: `ysk-or-v1-1dc3c0b4432397bda2484afedbaac68cc0e815039c83a14a827db0224cb344ea`

**Note:** OpenRouter is used for advanced AI features. Basic functionality works without it.

## 3. Firebase Configuration (Optional - For Push Notifications)

Currently has placeholder values. To fix:

1. Go to: https://console.firebase.google.com/
2. Select your project: `silentsiren-b4cd2`
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract these values from the JSON:
   - `project_id` → FIREBASE_PROJECT_ID
   - `client_email` → FIREBASE_CLIENT_EMAIL
   - `private_key` → FIREBASE_PRIVATE_KEY (keep the quotes and \n characters)

## 4. Neon Database (✓ WORKING)

Your Neon database is already working perfectly! No action needed.

## Quick Test After Fixing

Run this command to test all services:
```bash
node test-services.js
```

## Priority Order

1. **HIGH PRIORITY:** Gemini API Key - App won't work without this
2. **MEDIUM:** Firebase - Needed for push notifications
3. **LOW:** OpenRouter - Only for advanced features
