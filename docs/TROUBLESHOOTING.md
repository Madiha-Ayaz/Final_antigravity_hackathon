# 🔧 Backend Connection Troubleshooting

## Issue: "Failed to fetch. Is backend running on port 3001?"

Let's fix this step by step.

---

## Step 1: Check if Backend is Running

### Open PowerShell and run:
```powershell
cd C:\Users\FC\Documents\hackathon-main\apps\backend
npm run dev
```

### What to look for:

✅ **SUCCESS - Backend is running:**
```
[INFO] Database pool initialized
[INFO] Server running on port 3001 in development mode
```

❌ **ERROR - Backend failed to start:**
Look for error messages in the output.

---

## Step 2: Common Startup Errors & Fixes

### Error 1: "Cannot find module 'firebase-admin'"
**Already fixed!** ✅ firebase-admin is installed.

### Error 2: "Port 3001 is already in use"
```powershell
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace <PID> with the number from above)
taskkill /PID <PID> /F

# Then restart backend
npm run dev
```

### Error 3: "Cannot find module '@silentsiren/config'"
```powershell
# Install all dependencies
npm install

# Then restart
npm run dev
```

### Error 4: "Database connection failed"
This is okay for now! Backend will still start with a warning.

To fix later:
- Setup Neon database (see `NEON_SETUP_QUICKSTART.md`)
- Or comment out database initialization temporarily

### Error 5: "Redis connection failed"
This is okay! Backend will continue with a warning.
Redis is optional for development.

---

## Step 3: Verify Backend is Running

### Check 1: Look for this message
```
[INFO] Server running on port 3001 in development mode
```

### Check 2: Test with curl
```powershell
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{"status":"healthy","timestamp":"...","uptime":5.123,"environment":"development"}
```

### Check 3: Check in browser
Open: http://localhost:3001/api/health

---

## Step 4: If Backend Still Won't Start

### Option A: Check for detailed errors
```powershell
# Navigate to backend
cd C:\Users\FC\Documents\hackathon-main\apps\backend

# Try to build first
npm run build

# If build succeeds, start
npm run dev
```

### Option B: Check environment variables
```powershell
# Make sure .env file exists in project root
cd C:\Users\FC\Documents\hackathon-main
dir .env

# Check PORT setting
type .env | findstr PORT
```

Should show: `PORT=3001`

### Option C: Try a different port
Edit `.env` file:
```env
PORT=3002
```

Then test: `curl http://localhost:3002/api/health`

---

## Step 5: Temporary Workaround (If Database Issues)

If you're getting database errors and want to start quickly:

### Edit `apps/backend/src/index.ts`

Comment out database initialization temporarily:

```typescript
private async initialize(): Promise<void> {
  // await this.initializeDatabase();  // Temporarily disabled
  await this.initializeRedis();
  this.initializeMiddleware();
  this.initializeRoutes();
  this.initializeErrorHandling();
}
```

This lets you start the backend without database setup.

---

## Step 6: Check Firewall/Antivirus

Sometimes Windows Firewall blocks Node.js:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js and check both Private and Public
4. Click OK
5. Restart backend

---

## Quick Diagnostic Commands

Run these in PowerShell:

```powershell
# 1. Check if Node.js is working
node --version

# 2. Check if npm is working
npm --version

# 3. Check current directory
pwd

# 4. Check if backend folder exists
dir apps\backend

# 5. Check if node_modules exists
dir apps\backend\node_modules

# 6. Check what's running on port 3001
netstat -ano | findstr :3001
```

---

## Most Common Solution

**90% of the time, the issue is:**

1. **Backend not started yet**
   - Solution: Run `npm run dev` in apps/backend

2. **Port already in use**
   - Solution: Kill the process or use different port

3. **Missing dependencies**
   - Solution: Run `npm install` in apps/backend

---

## What to Send Me

If still not working, send me:

1. The exact error message from `npm run dev`
2. Output of `netstat -ano | findstr :3001`
3. Output of `type .env | findstr PORT`

---

## Expected Working Output

When backend starts successfully, you should see:

```
> @silentsiren/backend@1.0.0 dev
> tsx watch src/index.ts

[2026-05-15 16:45:00.000 +0500] INFO: Database pool initialized
    service: "database"
[2026-05-15 16:45:00.100 +0500] INFO: Database connected successfully
    service: "backend"
[2026-05-15 16:45:00.200 +0500] INFO: Redis connected successfully
    service: "backend"
[2026-05-15 16:45:00.300 +0500] WARN: Firebase credentials not configured. FCM will not be available. This is optional.
    service: "fcm-service"
[2026-05-15 16:45:00.400 +0500] INFO: Server running on port 3001 in development mode
    service: "backend"
```

Then `curl http://localhost:3001/api/health` should work!

---

**Try these steps and let me know what error you're seeing!**
