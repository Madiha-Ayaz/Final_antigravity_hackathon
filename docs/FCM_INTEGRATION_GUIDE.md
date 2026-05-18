# Firebase Cloud Messaging (FCM) Integration Guide

## Overview
This guide will help you integrate Firebase Cloud Messaging into SilentSiren AI for real-time emergency push notifications.

## Prerequisites
- Firebase account (free tier)
- Existing SilentSiren backend running
- Neon PostgreSQL database connected

---

## Part 1: Firebase Setup

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it **"SilentSiren AI"**
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on **"Cloud Messaging"** tab
3. You'll see your **Sender ID** and **Server Key** (we'll use v1 API instead)

### Step 3: Generate Service Account Key

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (e.g., `silentsiren-firebase-adminsdk.json`)
4. **IMPORTANT:** Keep this file secure, never commit to Git!

### Step 4: Get Web Push Certificate

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Scroll to **"Web Push certificates"**
3. Click **"Generate key pair"**
4. Copy the **VAPID key** (starts with `B...`)

### Step 5: Register Web App

1. In Firebase Console, click **"Add app"** > **Web** (</> icon)
2. Name it **"SilentSiren Web"**
3. Check **"Also set up Firebase Hosting"** (optional)
4. Copy the Firebase config object

---

## Part 2: Environment Variables

Add these to your `.env` file:

```env
# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_VAPID_KEY=BYour-VAPID-Key-Here

# Frontend (add to .env.local in frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BYour-VAPID-Key-Here
```

**Note:** For `FIREBASE_PRIVATE_KEY`, replace actual newlines with `\n` in the .env file.

---

## Part 3: Install Dependencies

### Backend
```bash
cd apps/backend
npm install firebase-admin
```

### Frontend
```bash
cd apps/frontend
npm install firebase
```

---

## Part 4: Testing

### Test 1: Generate Device Token
1. Open your web app in browser
2. Open DevTools Console
3. Click "Allow" when prompted for notifications
4. Check console for token (starts with `e...` or `f...`)

### Test 2: Save Token to Database
```bash
curl -X POST http://localhost:3001/api/fcm/save-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE"
  }'
```

### Test 3: Send Test Notification
```bash
curl -X POST http://localhost:3001/api/fcm/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 4: Trigger Emergency Alert
```bash
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "HIGH",
    "latitude": 31.5204,
    "longitude": 74.3587
  }'
```

You should receive a push notification!

---

## Part 5: Verify Notifications

### In Browser (Chrome/Edge)
1. Notification should appear in top-right corner
2. Click notification to open app
3. Check DevTools > Application > Service Workers

### In Browser (Firefox)
1. Notification appears in system notification area
2. Check about:serviceworkers for status

### Troubleshooting

**"Notification permission denied"**
- Clear site data and reload
- Check browser settings > Notifications
- Ensure HTTPS (or localhost)

**"Service worker registration failed"**
- Check console for errors
- Ensure firebase-messaging-sw.js is in /public
- Verify VAPID key is correct

**"Token not generated"**
- Check Firebase config is correct
- Ensure notification permission granted
- Check browser supports notifications

**"Notification not received"**
- Verify token is saved in database
- Check backend logs for errors
- Ensure Firebase service account key is valid
- Check FCM quota (free tier: unlimited)

---

## Part 6: Production Deployment

### Security Checklist
- ✅ Never commit service account JSON to Git
- ✅ Use environment variables for all secrets
- ✅ Validate tokens before saving
- ✅ Rate limit notification endpoints
- ✅ Implement token refresh logic
- ✅ Handle expired/invalid tokens

### Performance Tips
- Cache Firebase Admin SDK instance
- Batch notifications when possible
- Clean up expired tokens regularly
- Use database indexes on user_id

### Monitoring
- Log all notification sends
- Track delivery success/failure
- Monitor FCM quota usage
- Alert on high failure rates

---

## Free Tier Limits

Firebase Cloud Messaging (FCM) is **completely free** with no limits on:
- Number of messages
- Number of devices
- Number of topics

**No credit card required!**

---

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Add environment variables
3. ✅ Install dependencies
4. ✅ Run database migration
5. ✅ Start backend server
6. ✅ Test token generation
7. ✅ Test notifications
8. ✅ Integrate with emergency flow

---

## Support

- Firebase Docs: https://firebase.google.com/docs/cloud-messaging
- FCM HTTP v1 API: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
