# 🎯 FINAL SETUP INSTRUCTIONS - SilentSiren AI

## ⚡ Quick Setup (Follow in Order)

### Step 1: Install Missing Dependencies (2 minutes)

```bash
# Navigate to project root
cd C:\Users\FC\Documents\hackathon-main

# Install firebase-admin for backend
npm install firebase-admin --workspace=@silentsiren/backend

# Install firebase for frontend
npm install firebase --workspace=@silentsiren/frontend

# Verify installation
npm list firebase-admin --workspace=@silentsiren/backend
npm list firebase --workspace=@silentsiren/frontend
```

---

### Step 2: Setup Neon Database (15 minutes)

#### 2.1 Create Neon Account
1. Go to https://console.neon.tech/
2. Sign up with GitHub or Google
3. Click **"Create Project"**
4. Name: **"silentsiren"**
5. Region: Choose closest to you
6. Click **"Create"**

#### 2.2 Get Connection String
1. In Neon dashboard, click **"Connection Details"**
2. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

#### 2.3 Update .env File
```bash
# Open .env file and update:
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

#### 2.4 Run Database Migrations
```bash
# Connect to Neon and run schema
psql "YOUR_NEON_CONNECTION_STRING" -f apps/backend/src/db/schema.sql

# Run FCM migration
psql "YOUR_NEON_CONNECTION_STRING" -f apps/backend/src/db/migrations/002_add_fcm_tables.sql

# Verify tables created
psql "YOUR_NEON_CONNECTION_STRING" -c "\dt"
```

---

### Step 3: Setup Firebase (15 minutes)

#### 3.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name: **"SilentSiren AI"**
4. Disable Google Analytics (optional)
5. Click **"Create project"**

#### 3.2 Add Web App
1. Click the **Web icon** (</>)
2. App nickname: **"SilentSiren Web"**
3. Click **"Register app"**
4. **Copy the Firebase config** - you'll need this!

#### 3.3 Generate VAPID Key
1. Go to **Project Settings** > **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"**
3. Click **"Generate key pair"**
4. **Copy the VAPID key** (starts with `B...`)

#### 3.4 Download Service Account Key
1. Go to **Project Settings** > **Service Accounts** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"**
4. **Download the JSON file**
5. **IMPORTANT:** Keep this file secure!

#### 3.5 Configure Backend (.env)
```bash
# Add to your .env file:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**How to get these from the JSON file:**
- Open the downloaded JSON file
- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL
- `private_key` → FIREBASE_PRIVATE_KEY (keep the \n characters)

#### 3.6 Configure Frontend (.env.local)
```bash
# Create apps/frontend/.env.local with:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BYour-VAPID-Key-Here

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3.7 Update Service Worker
Edit `apps/frontend/public/firebase-messaging-sw.js`:
```javascript
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',           // Replace with actual values
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

---

### Step 4: Build & Start (5 minutes)

```bash
# Build backend
cd apps/backend
npm run build

# If build succeeds, start backend
npm run dev

# In a new terminal, start frontend
cd apps/frontend
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
✅ Database schema verified
✅ Redis connected successfully
✅ Firebase Admin SDK initialized successfully
✅ Server running on port 3001
```

---

### Step 5: Test Everything (10 minutes)

#### 5.1 Test Backend Health
```bash
curl http://localhost:3001/api/health/detailed
```

**Expected:** Status 200 with database and Redis status

#### 5.2 Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923343717260",
    "fullName": "Test User",
    "email": "test@example.com"
  }'
```

**Copy the JWT token from response!**

#### 5.3 Test Frontend
1. Open http://localhost:3000
2. Click "Allow" when prompted for notifications
3. Check browser console for FCM token
4. **Copy the FCM token**

#### 5.4 Save FCM Token
```bash
curl -X POST http://localhost:3001/api/fcm/save-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "deviceType": "web"
  }'
```

#### 5.5 Send Test Notification
```bash
curl -X POST http://localhost:3001/api/fcm/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Alert",
    "body": "This is a test notification!"
  }'
```

**You should see a notification in your browser! 🎉**

#### 5.6 Trigger Emergency
```bash
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "HIGH",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address": "Lahore, Pakistan"
  }'
```

**This should create an emergency and send notifications!**

---

## 🎯 Success Checklist

- [ ] Dependencies installed (firebase-admin, firebase)
- [ ] Neon database connected
- [ ] Database migrations run
- [ ] Firebase project created
- [ ] Environment variables configured (backend & frontend)
- [ ] Service worker updated with Firebase config
- [ ] Backend builds successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] User registration works
- [ ] FCM token generated in browser
- [ ] Token saved to database
- [ ] Test notification received
- [ ] Emergency triggers notification

---

## 🐛 Troubleshooting

### Build Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin --workspace=@silentsiren/backend
```

### Build Error: TypeScript errors
```bash
# Already fixed in the code
npm run build --workspace=@silentsiren/backend
```

### Database Connection Failed
- Check DATABASE_URL is correct
- Ensure `?sslmode=require` is at the end
- Verify Neon project is active

### Firebase Not Initialized
- Check all Firebase env vars are set
- Verify FIREBASE_PRIVATE_KEY has `\n` characters
- Ensure service account JSON is valid

### No Notification Received
- Check notification permission is granted
- Verify FCM token is saved in database
- Test with `/api/fcm/send-test` first
- Check browser console for errors

---

## 📊 What You've Built

### Backend (Node.js/Express)
- ✅ User authentication (JWT)
- ✅ Emergency event management
- ✅ Push notification system (FCM)
- ✅ Database integration (Neon PostgreSQL)
- ✅ Redis caching
- ✅ AI voice analysis (Gemini/OpenRouter)
- ✅ SMS/Call alerts (Twilio)
- ✅ Community validation
- ✅ Geolocation-based features

### Frontend (Next.js/React)
- ✅ User interface
- ✅ Push notification setup
- ✅ Emergency triggering
- ✅ Real-time updates
- ✅ Service worker for background notifications

### Database (Neon PostgreSQL)
- ✅ 8 tables with relationships
- ✅ Indexes for performance
- ✅ Triggers for auto-updates
- ✅ Full CRUD operations

### Notifications (Firebase FCM)
- ✅ Emergency alerts
- ✅ Community validation requests
- ✅ Multi-device support
- ✅ Background notifications
- ✅ Click handling

---

## 💰 Total Cost: $0

- Firebase FCM: **FREE** (unlimited)
- Neon Database: **FREE** (0.5GB, 100hrs/month)
- All other services: **FREE** tiers

---

## 📚 Documentation

All documentation is in your project:

- **Quick Start:** `FCM_QUICK_REFERENCE.md`
- **Complete Guide:** `docs/FCM_COMPLETE_SETUP_TESTING.md`
- **Database Setup:** `NEON_SETUP_QUICKSTART.md`
- **Project Status:** `PROJECT_STATUS.md`
- **Full Summary:** `INTEGRATION_COMPLETE.md`

---

## 🎉 You're Done!

Once you complete the 5 steps above, you'll have a **fully functional emergency notification system** with:

- Real-time push notifications
- AI-powered voice analysis
- Community validation
- SMS/Call alerts
- Database persistence
- Multi-device support

**Perfect for your hackathon demo! 🚀**

---

## 🆘 Need Help?

1. Check the documentation files in your project
2. Review error messages in terminal
3. Check browser console for frontend issues
4. Verify all environment variables are set
5. Ensure Firebase and Neon are properly configured

---

**Follow the steps above in order, and you'll be up and running in 30 minutes!**
