# ▶️ START BACKEND NOW - Follow These Exact Steps

## The Issue:
✅ Port 3001 is free (nothing using it)
❌ Backend is not running yet

## Solution: Start the Backend

---

## Step-by-Step Instructions:

### 1️⃣ Open PowerShell (or Command Prompt)

Press `Win + X` and select "Windows PowerShell" or "Terminal"

### 2️⃣ Navigate to Backend Directory

```powershell
cd C:\Users\FC\Documents\hackathon-main\apps\backend
```

### 3️⃣ Start the Backend

```powershell
npm run dev
```

### 4️⃣ Wait for Success Message

You should see output like this:

```
> @silentsiren/backend@1.0.0 dev
> tsx watch src/index.ts

[INFO] Database pool initialized
[INFO] Database connected successfully (or warning if not setup)
[INFO] Redis connected successfully (or warning if not setup)
[WARN] Firebase credentials not configured. FCM will not be available. This is optional.
[INFO] Server running on port 3001 in development mode
```

✅ **When you see "Server running on port 3001" - SUCCESS!**

---

## 5️⃣ Test the Backend (In a NEW Terminal)

Open a **second** PowerShell window and run:

```powershell
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{"status":"healthy","timestamp":"2026-05-15T...","uptime":5.123,"environment":"development"}
```

✅ **If you see this JSON response - Backend is working!**

---

## 🚨 If You See Errors:

### Error: "Cannot find module"
```powershell
# Install dependencies
npm install

# Then try again
npm run dev
```

### Error: "Port 3001 already in use"
```powershell
# Change port in .env file
# Edit: C:\Users\FC\Documents\hackathon-main\.env
# Change: PORT=3001
# To: PORT=3002

# Then start backend
npm run dev

# Test with new port
curl http://localhost:3002/api/health
```

### Error: "Database connection failed"
**This is OK!** Backend will still start with a warning.
You can setup database later.

### Error: "ENOENT: no such file or directory"
```powershell
# Make sure you're in the right directory
pwd
# Should show: C:\Users\FC\Documents\hackathon-main\apps\backend

# If not, navigate there:
cd C:\Users\FC\Documents\hackathon-main\apps\backend
```

---

## 📋 Quick Checklist:

- [ ] Opened PowerShell
- [ ] Navigated to `apps/backend` directory
- [ ] Ran `npm run dev`
- [ ] Saw "Server running on port 3001"
- [ ] Tested with `curl http://localhost:3001/api/health`
- [ ] Got JSON response

---

## 🎯 What to Do After Backend Starts:

### Test User Registration:
```powershell
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+923343717260\", \"fullName\": \"Test User\", \"email\": \"test@example.com\"}"
```

### Start Frontend (Optional):
```powershell
# In a NEW terminal
cd C:\Users\FC\Documents\hackathon-main\apps\frontend
npm run dev
```

Then open: http://localhost:3000

---

## 💡 Pro Tips:

1. **Keep backend terminal open** - Don't close it while testing
2. **Use a second terminal** for testing commands
3. **Watch for errors** in the backend terminal
4. **Ctrl+C** to stop the backend when needed

---

## 🆘 Still Not Working?

**Copy and send me:**

1. The exact error message from `npm run dev`
2. Output of this command:
   ```powershell
   cd C:\Users\FC\Documents\hackathon-main\apps\backend
   npm run dev
   ```

---

## ✅ Success Looks Like:

**Terminal 1 (Backend):**
```
[INFO] Server running on port 3001 in development mode
```

**Terminal 2 (Testing):**
```powershell
PS> curl http://localhost:3001/api/health
{"status":"healthy",...}
```

---

**Try running `npm run dev` now and tell me what you see!**
