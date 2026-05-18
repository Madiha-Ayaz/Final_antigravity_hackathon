# 🔑 How to Update Gemini API Key

## Current Status
Your Gemini API key is invalid. This is the ONLY thing preventing the app from starting.

## Step-by-Step Instructions

### 1. Get Your API Key

Open this link in your browser:
```
https://aistudio.google.com/app/apikey
```

- Sign in with your Google account
- Click the blue "Create API Key" button
- Select "Create API key in new project" (or use existing project)
- Copy the key (it will look like: `AIzaSyABCDEF1234567890...`)

### 2. Update the .env File

**Option A: I can do it for you**
Just paste your new API key here in the chat and I'll update the file.

**Option B: Manual update**
1. Open the file: `.env` (in the project root folder)
2. Find line 16 that says:
   ```
   GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY_HERE
   ```
3. Replace it with your actual key:
   ```
   GEMINI_API_KEY=AIzaSyABCDEF1234567890...
   ```
4. Save the file

### 3. Test It

Run this command to verify it works:
```bash
node test-gemini-only.js
```

You should see:
```
✅ Gemini API is working!
🎉 You can now start the servers!
```

### 4. Start the App

Once the test passes, run:
```bash
start-servers.bat
```

Or:
```bash
npm run dev
```

The app will start on:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Troubleshooting

**"API Key not found" error?**
- Make sure you copied the entire key
- Check there are no extra spaces
- Verify the key starts with `AIzaSy`

**Still not working?**
- Try creating a new API key
- Make sure you saved the .env file
- Restart your terminal/command prompt

---

## Need Help?

Just paste your new Gemini API key in the chat and I'll update everything for you!
