# 🔧 QUICK FIX - Backend Issues

## Issue 1: Missing firebase-admin ✅ FIXED

The `firebase-admin` package is now installed.

## Issue 2: Port Keeps Changing 🔧 FIX

Your `.env` file has `PORT=3001` which is correct. The issue is that the backend is reading from the config package.

### Solution:

**Option 1: Make Firebase Optional (Recommended for now)**

The backend will start even without Firebase configured. FCM features will be disabled but everything else works.

**Option 2: Temporarily Disable FCM Routes**

If you want to run the backend without setting up Firebase yet:

1. Open `apps/backend/src/routes/index.ts`
2. Comment out the FCM route:

```typescript
// router.use('/fcm', fcmRoutes);  // Temporarily disabled
```

### To Fix Port Issue Permanently:

The port is set correctly in `.env` as `PORT=3001`. If it's changing, it might be:

1. **Another process using port 3001**
   ```bash
   # Check what's using port 3001
   netstat -ano | findstr :3001

   # Kill the process if needed
   taskkill /PID <process_id> /F
   ```

2. **Environment variable not loading**
   - Make sure `.env` is in the project root
   - Restart your terminal/PowerShell

### Quick Test:

```bash
# Navigate to backend
cd apps/backend

# Start the server
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
✅ Redis connected successfully
⚠️  Firebase credentials not configured. FCM will not be available. This is optional.
✅ Server running on port 3001
```

The server should start on port 3001 even without Firebase configured.

---

## What to Do Next:

### Option A: Run Without Firebase (Quick)
Just start the backend - it will work without FCM:
```bash
npm run dev
```

### Option B: Setup Firebase (30 min)
Follow the guide in `FCM_QUICK_REFERENCE.md` to enable push notifications.

---

## Summary:

- ✅ `firebase-admin` installed
- ✅ Backend will start without Firebase (FCM disabled)
- ✅ Port is set to 3001 in `.env`
- ✅ All other features work (auth, emergency, database)

**Try starting the backend now!**
