# 🎯 Complete Testing & Next Steps Guide

## Step 1: Verify Backend is Running ✅

After running `npm run dev`, you should see:
```
[INFO] Server running on port 3001 in development mode
```

**If you see this → Backend is working!** ✅

---

## Step 2: Test Your API (Copy & Paste These)

### Open a NEW PowerShell window and run:

### Test 1: Health Check
```powershell
curl http://localhost:3001/api/health
```

**Expected:**
```json
{"status":"healthy","timestamp":"2026-05-15T...","uptime":5.123,"environment":"development"}
```

---

### Test 2: Register a User
```powershell
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+923343717260\", \"fullName\": \"Test User\", \"email\": \"test@example.com\"}"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "phoneNumber": "+923343717260",
    "fullName": "Test User",
    "email": "test@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Registration successful"
  }
}
```

**📝 IMPORTANT: Copy the `token` value!** You'll need it for the next tests.

---

### Test 3: Login
```powershell
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+923343717260\"}"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "uuid-here",
    "phoneNumber": "+923343717260",
    "fullName": "Test User",
    "isVerified": false,
    "reputationScore": 100
  }
}
```

---

### Test 4: Create Emergency Event
```powershell
# Replace YOUR_JWT_TOKEN with the token from registration/login
curl -X POST http://localhost:3001/api/emergency/trigger -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"eventType\": \"MANUAL\", \"threatLevel\": \"HIGH\", \"latitude\": 31.5204, \"longitude\": 74.3587, \"address\": \"Lahore, Pakistan\"}"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "eventId": "uuid-here",
    "status": "PENDING",
    "threatLevel": "HIGH",
    "dispatchRecommended": true,
    "message": "Emergency event created successfully"
  }
}
```

---

### Test 5: Get Emergency History
```powershell
curl -X GET http://localhost:3001/api/emergency/history -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "count": 1
  }
}
```

---

### Test 6: Get Emergency Statistics
```powershell
curl -X GET http://localhost:3001/api/emergency/statistics -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "total": 1,
    "pending": 1,
    "verified": 0,
    "falseAlarms": 0,
    "dispatched": 0,
    "resolved": 0
  }
}
```

---

## Step 3: Start Frontend (Optional)

### Open a NEW PowerShell window:

```powershell
cd C:\Users\FC\Documents\hackathon-main\apps\frontend
npm run dev
```

**Expected:**
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

### Open in Browser:
http://localhost:3000

---

## Step 4: Test in Browser

1. **Open:** http://localhost:3000
2. **Register/Login** with your phone number
3. **Allow notifications** when prompted (for FCM)
4. **Test emergency trigger**
5. **Check emergency history**

---

## 📊 What's Working Now:

### ✅ Backend Features (Port 3001)
- User authentication (JWT)
- User registration & login
- Emergency event creation
- Emergency history & statistics
- Database persistence (Neon)
- Health monitoring
- Rate limiting
- Security middleware
- Error handling
- Logging

### ✅ Database (Neon PostgreSQL)
- User storage
- Emergency events
- Session management
- Full CRUD operations

### 🔔 Optional Features (Setup Later)
- Push notifications (requires Firebase)
- SMS/Call alerts (requires Twilio)
- AI voice analysis (requires valid Gemini key)

---

## 🎯 API Endpoints Available:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Emergency
- `POST /api/emergency/trigger` - Create emergency event
- `POST /api/emergency/cancel/:eventId` - Cancel emergency
- `GET /api/emergency/history` - Get user's emergency history
- `GET /api/emergency/statistics` - Get user statistics

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with services
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### FCM (Requires Firebase Setup)
- `POST /api/fcm/save-token` - Save device token
- `POST /api/fcm/send-test` - Send test notification
- `DELETE /api/fcm/token` - Remove token
- `GET /api/fcm/tokens` - List user's tokens

---

## 🔧 Optional: Setup Firebase (30 min)

To enable push notifications:

1. **Follow guide:** `FCM_QUICK_REFERENCE.md`
2. **Create Firebase project**
3. **Configure environment variables**
4. **Test notifications**

---

## 🔧 Optional: Fix Gemini API (5 min)

To enable AI voice analysis:

1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Update `.env`: `GEMINI_API_KEY=your_new_key`
4. Restart backend

---

## 📈 Your Progress:

✅ **Completed:**
- Firebase Cloud Messaging integration (code ready)
- Neon Database integration (connected)
- Backend API (running on port 3001)
- User authentication
- Emergency management
- Database persistence

🔄 **Optional (Setup Later):**
- Firebase configuration (push notifications)
- Gemini API key (AI voice analysis)
- Twilio configuration (SMS/Call alerts)
- Frontend deployment
- Production deployment

---

## 🎉 Success Criteria:

You've successfully completed the integration if:

- ✅ Backend starts without errors
- ✅ `curl http://localhost:3001/api/health` returns JSON
- ✅ User registration works
- ✅ Emergency creation works
- ✅ Database stores data

---

## 📚 Documentation Reference:

- **Complete Setup:** `START_HERE_COMPLETE.md`
- **FCM Setup:** `FCM_QUICK_REFERENCE.md`
- **Database Setup:** `NEON_SETUP_QUICKSTART.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Full Summary:** `INTEGRATION_COMPLETE.md`

---

## 🆘 If Something Doesn't Work:

1. **Check backend logs** in the terminal
2. **Verify JWT token** is correct
3. **Check request format** (JSON, headers)
4. **Review error messages**
5. **Check documentation files**

---

## 💡 Pro Tips:

1. **Keep backend terminal open** while testing
2. **Use Postman** for easier API testing (optional)
3. **Check browser DevTools** for frontend errors
4. **Watch backend logs** for request/response info
5. **Save JWT tokens** for authenticated requests

---

## 🚀 What to Do Now:

1. ✅ **Verify backend is running** (`Server running on port 3001`)
2. ✅ **Test health endpoint** (`curl http://localhost:3001/api/health`)
3. ✅ **Register a user** (save the JWT token)
4. ✅ **Create an emergency** (test the main feature)
5. ✅ **Check emergency history** (verify database works)
6. 🔄 **Start frontend** (optional)
7. 🔄 **Setup Firebase** (optional, for push notifications)

---

**Tell me which test you're on and if you need help with any step!** 🎯
