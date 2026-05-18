# Firebase Cloud Messaging - Complete Setup & Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions to set up and test Firebase Cloud Messaging (FCM) for SilentSiren AI.

---

## Part 1: Firebase Console Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: **"SilentSiren AI"**
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Add Web App

1. In Firebase Console, click the **Web icon** (</>)
2. App nickname: **"SilentSiren Web"**
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. **Copy the Firebase config** - you'll need this!

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Step 3: Generate VAPID Key

1. Go to **Project Settings** > **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"**
3. Click **"Generate key pair"**
4. **Copy the VAPID key** (starts with `B...`)

### Step 4: Generate Service Account Key

1. Go to **Project Settings** > **Service Accounts** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the dialog
4. **Download the JSON file** (e.g., `silentsiren-firebase-adminsdk.json`)
5. **IMPORTANT:** Keep this file secure! Never commit to Git!

---

## Part 2: Environment Configuration

### Backend (.env)

Add these to your `apps/backend/.env` or root `.env`:

```env
# Firebase Cloud Messaging (Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**How to get these values from the JSON file:**
```json
{
  "project_id": "your-project-id",  // → FIREBASE_PROJECT_ID
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",  // → FIREBASE_CLIENT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n..."  // → FIREBASE_PRIVATE_KEY
}
```

**IMPORTANT:** For `FIREBASE_PRIVATE_KEY`, keep the `\n` characters as-is in the .env file.

### Frontend (.env.local)

Create `apps/frontend/.env.local`:

```env
# Firebase Cloud Messaging (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BYour-VAPID-Key-Here
```

### Update Service Worker

Edit `apps/frontend/public/firebase-messaging-sw.js` and replace the placeholder values with your actual Firebase config:

```javascript
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',  // Replace with actual values
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

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

## Part 4: Database Migration

Run the FCM migration to create the necessary tables:

```bash
# Connect to your Neon database
psql "YOUR_NEON_CONNECTION_STRING"

# Run the migration
\i apps/backend/src/db/migrations/002_add_fcm_tables.sql

# Verify tables were created
\dt device_tokens
\dt notification_logs
```

Or if your backend auto-runs migrations on startup, just restart the server.

---

## Part 5: Start Your Servers

### Terminal 1: Backend

```bash
cd apps/backend
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Redis connected successfully
✅ Firebase Admin SDK initialized successfully
✅ Server running on port 3001
```

### Terminal 2: Frontend

```bash
cd apps/frontend
npm run dev
```

Frontend should start on http://localhost:3000

---

## Part 6: Testing (Step-by-Step)

### Test 1: Generate FCM Token

1. Open http://localhost:3000 in your browser
2. Open **DevTools Console** (F12)
3. You should see a notification permission prompt
4. Click **"Allow"**
5. Check the console for:
   ```
   FCM Token generated: eXXXXXXXXXXXXXXXXXX...
   Service Worker registered
   ```
6. **Copy the token** - you'll need it for testing!

**Troubleshooting:**
- If no prompt appears, check browser settings > Notifications
- Ensure you're on localhost or HTTPS
- Check console for errors

### Test 2: Register User & Login

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923343717260",
    "fullName": "Test User",
    "email": "test@example.com"
  }'
```

**Copy the JWT token from the response!**

```bash
# Or login if user exists
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923343717260"
  }'
```

### Test 3: Save FCM Token to Database

```bash
curl -X POST http://localhost:3001/api/fcm/save-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE",
    "deviceType": "web"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "tokenId": "uuid-here",
    "message": "Device token saved successfully"
  }
}
```

### Test 4: Send Test Notification

```bash
curl -X POST http://localhost:3001/api/fcm/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Test Alert",
    "body": "This is a test notification from SilentSiren!"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "successCount": 1,
    "failureCount": 0,
    "totalTokens": 1,
    "message": "Test notification sent"
  }
}
```

**You should see a notification appear in your browser!** 🎉

### Test 5: Trigger Emergency with Notification

```bash
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "HIGH",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address": "Lahore, Pakistan"
  }'
```

This should:
1. Create an emergency event in the database
2. Send a push notification to all registered devices
3. Return the event details

### Test 6: Verify in Database

```bash
# Connect to your database
psql "YOUR_NEON_CONNECTION_STRING"

# Check device tokens
SELECT user_id, device_type, is_active, created_at FROM device_tokens;

# Check notification logs
SELECT user_id, notification_type, title, status, sent_at FROM notification_logs ORDER BY sent_at DESC LIMIT 10;
```

---

## Part 7: Frontend Integration

### Add NotificationSetup Component

In your main layout or dashboard page:

```tsx
// apps/frontend/src/app/page.tsx or layout.tsx
import { NotificationSetup } from '@/components/NotificationSetup';

export default function Dashboard() {
  const authToken = 'your-jwt-token'; // Get from auth context/state

  return (
    <div>
      <NotificationSetup
        authToken={authToken}
        onTokenGenerated={(token) => {
          console.log('FCM Token:', token);
        }}
      />

      {/* Rest of your app */}
    </div>
  );
}
```

### Use the FCM Hook

```tsx
// In any component
import { useFCM } from '@/hooks/useFCM';

function MyComponent() {
  const { token, permission, requestPermission } = useFCM({
    authToken: 'your-jwt-token',
    autoRequest: false,
  });

  return (
    <div>
      {permission === 'default' && (
        <button onClick={requestPermission}>
          Enable Notifications
        </button>
      )}
      {token && <p>Notifications enabled!</p>}
    </div>
  );
}
```

---

## Part 8: Verify Everything Works

### Checklist

- [ ] Firebase project created
- [ ] VAPID key generated
- [ ] Service account key downloaded
- [ ] Environment variables configured (backend & frontend)
- [ ] Dependencies installed
- [ ] Database migration run
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Service worker registers successfully
- [ ] FCM token generated in browser
- [ ] Token saved to database
- [ ] Test notification received
- [ ] Emergency notification received

---

## Part 9: Common Issues & Solutions

### Issue: "Service worker registration failed"

**Solution:**
- Ensure `firebase-messaging-sw.js` is in `/public` directory
- Check that Firebase config in service worker is correct
- Clear browser cache and reload

### Issue: "No FCM token generated"

**Solution:**
- Check notification permission is granted
- Verify VAPID key is correct
- Check browser console for errors
- Ensure service worker is registered

### Issue: "Notification not received"

**Solution:**
- Verify token is saved in database
- Check backend logs for FCM errors
- Ensure Firebase service account key is valid
- Test with `/api/fcm/send-test` endpoint first

### Issue: "Invalid service account"

**Solution:**
- Verify `FIREBASE_PRIVATE_KEY` has `\n` characters
- Check `FIREBASE_CLIENT_EMAIL` is correct
- Ensure service account has "Firebase Cloud Messaging Admin" role

### Issue: "CORS error"

**Solution:**
- Ensure backend CORS is configured for your frontend URL
- Check `NEXT_PUBLIC_APP_URL` in backend .env

---

## Part 10: Production Deployment

### Security Checklist

- [ ] Never commit service account JSON to Git
- [ ] Use environment variables for all secrets
- [ ] Add `.env` to `.gitignore`
- [ ] Rotate keys if accidentally exposed
- [ ] Enable Firebase App Check (optional)
- [ ] Rate limit notification endpoints

### Performance Tips

- Cache Firebase Admin SDK instance (already done in service)
- Batch notifications when sending to multiple users
- Clean up expired tokens regularly
- Use database indexes (already created)

### Monitoring

- Log all notification sends
- Track delivery success/failure rates
- Monitor FCM quota (unlimited on free tier)
- Set up alerts for high failure rates

---

## Part 11: Free Tier Limits

Firebase Cloud Messaging is **100% FREE** with:
- ✅ Unlimited messages
- ✅ Unlimited devices
- ✅ Unlimited topics
- ✅ No credit card required

**No hidden costs!**

---

## 🎉 Success!

If you've completed all tests successfully, your FCM integration is working! Users will now receive:

- 🚨 Emergency alerts
- 🔔 Community validation requests
- 📢 System updates

---

## Need Help?

- Firebase Docs: https://firebase.google.com/docs/cloud-messaging
- FCM Troubleshooting: https://firebase.google.com/docs/cloud-messaging/troubleshoot
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## Next Steps

1. Integrate notifications into emergency flow
2. Add notification preferences UI
3. Implement notification history
4. Add sound/vibration customization
5. Test on mobile devices
