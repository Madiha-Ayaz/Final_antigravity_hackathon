@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     🚀 WHATSAPP + VOICE + AUDIT SYSTEM - QUICK START          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Step 1: Install dependencies
echo 📦 Step 1: Installing dependencies...
echo Note: If disk space error, manually add axios to package.json
cd apps\backend
call npm install axios 2>nul || echo ⚠️  Axios install failed - add manually to package.json
cd ..\..

REM Step 2: Setup NEON Database
echo.
echo 🗄️  Step 2: Setting up NEON Database...
echo Run this command to setup database:
echo psql "postgresql://neondb_owner:npg_bdflQ1gx7qYz@ep-dry-smoke-aqh2syx4-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" -f database\neon_schema.sql
echo.
echo Or manually execute the SQL file in NEON console

REM Step 3: Build backend
echo.
echo 🔨 Step 3: Building backend...
cd apps\backend
call npm run build
cd ..\..

REM Step 4: Instructions
echo.
echo 🚀 Step 4: Starting servers...
echo Run in separate terminals:
echo   Terminal 1: npm run dev:backend
echo   Terminal 2: npm run dev:frontend
echo.

echo ✅ Setup complete!
echo.
echo 📱 Test Pages:
echo   - WhatsApp Test: http://localhost:3000/whatsapp-test
echo   - Admin Dashboard: http://localhost:3000/admin
echo   - Voice Test: http://localhost:3000/test-voice
echo.
echo 📚 Documentation: WHATSAPP_VOICE_AUDIT_COMPLETE.md

pause
