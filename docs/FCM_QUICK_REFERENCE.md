# 🚀 FCM Integration - Quick Reference Card

## 📋 Setup Checklist (15 minutes)

### 1. Firebase Console (5 min)
- [ ] Create project at https://console.firebase.google.com/
- [ ] Add web app
- [ ] Generate VAPID key (Cloud Messaging > Web Push certificates)
- [ ] Download service account JSON (Settings > Service Accounts)

### 2. Backend Config (2 min)
```env
# Add to .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Frontend Config (2 min)
```env
# Create apps/frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BYour-VAPID-Key...
```

### 4. Update Service Worker (1 min)
Edit `apps/frontend/public/firebase-messaging-sw.js` with your Firebase config

### 5. Install Dependencies (2 min)
```bash
cd apps/backend && npm install firebase-admin
cd apps/frontend && npm install firebase
```

### 6. Database Migration (1 min)
```bash
psql "YOUR_NEON_URL" -f apps/backend/src/db/migrations/002_add_fcm_tables.sql
```

### 7. Start & Test (2 min)
```bash
# Terminal 1
cd apps/backend && npm run dev

# Terminal 2
cd apps/frontend && npm run dev

# Open http://localhost:3000 and allow notifications
```

---

## 🔥 Quick Test Commands

### 1. Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "fullName": "Test User"}'
```

### 2. Save FCM Token
```bash
curl -X POST http://localhost:3001/api/fcm/save-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"token": "YOUR_FCM_TOKEN"}'
```

### 3. Send Test Notification
```bash
curl -X POST http://localhost:3001/api/fcm/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Trigger Emergency
```bash
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"eventType": "MANUAL", "threatLevel": "HIGH", "latitude": 31.5204, "longitude": 74.3587}'
```

---

## 📁 Key Files Reference

### Backend
```
apps/backend/src/
├── services/
│   ├── fcm.service.ts              # Firebase Admin SDK
│   └── notification.service.ts     # High-level notifications
├── repositories/
│   └── deviceToken.repository.ts   # Token CRUD
├── routes/
│   └── fcm.ts                      # FCM endpoints
└── db/migrations/
    └── 002_add_fcm_tables.sql      # Database schema
```

### Frontend
```
apps/frontend/
├── src/
│   ├── lib/
│   │   └── firebase.ts             # Firebase client
│   ├── hooks/
│   │   └── useFCM.ts               # React hook
│   └── components/
│       └── NotificationSetup.tsx   # UI component
└── public/
    └── firebase-messaging-sw.js    # Service worker
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fcm/save-token` | Save device token |
| POST | `/api/fcm/send-test` | Send test notification |
| DELETE | `/api/fcm/token` | Remove token |
| GET | `/api/fcm/tokens` | List user's tokens |

---

## 💻 Frontend Usage

### Option 1: Component
```tsx
import { NotificationSetup } from '@/components/NotificationSetup';

<NotificationSetup authToken={token} />
```

### Option 2: Hook
```tsx
import { useFCM } from '@/hooks/useFCM';

const { token, permission, requestPermission } = useFCM({ authToken });
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| No token generated | Check notification permission granted |
| Service worker fails | Verify firebase-messaging-sw.js in /public |
| Notification not received | Test with /api/fcm/send-test first |
| Invalid service account | Check FIREBASE_PRIVATE_KEY has \n |

---

## 📊 Database Tables

### device_tokens
- Stores FCM tokens per user
- Supports multiple devices
- Tracks active/inactive status

### notification_logs
- Logs all sent notifications
- Tracks delivery status
- Links to emergency events

---

## 🎨 Notification Types

1. **Emergency Alert** - Critical incidents
2. **Community Validation** - Request nearby help
3. **Test Notification** - For testing
4. **Custom** - Flexible payload

---

## 💰 Cost

**100% FREE** - No limits on:
- Messages sent
- Devices registered
- Topics created

---

## 📚 Full Documentation

- **Setup:** `docs/FCM_INTEGRATION_GUIDE.md`
- **Testing:** `docs/FCM_COMPLETE_SETUP_TESTING.md`
- **Summary:** `FCM_INTEGRATION_SUMMARY.md`

---

## ✅ Success Indicators

- [ ] Backend logs: "Firebase Admin SDK initialized successfully"
- [ ] Browser console: "FCM Token generated: e..."
- [ ] Browser console: "Service Worker registered"
- [ ] Test notification appears in browser
- [ ] Token saved in database
- [ ] Emergency triggers notification

---

## 🚨 Important Notes

1. **Never commit** service account JSON to Git
2. **Always use** environment variables for secrets
3. **Test locally** before deploying
4. **HTTPS required** in production (localhost OK for dev)
5. **Service worker** must be in /public directory

---

## 🎓 For Student Projects

This implementation includes:
- ✅ Production-quality code
- ✅ Complete documentation
- ✅ Testing guide
- ✅ Error handling
- ✅ Security best practices
- ✅ Free forever (no credit card)

Perfect for demos and presentations!

---

## 🔗 Quick Links

- Firebase Console: https://console.firebase.google.com/
- FCM Docs: https://firebase.google.com/docs/cloud-messaging
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

**Need help? Check the full documentation in `/docs` folder!**
