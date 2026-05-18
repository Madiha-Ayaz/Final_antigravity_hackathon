@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           🚀 START BACKEND SERVER (CLEAN START)               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 🛑 Step 1: Stopping any existing backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo ⏳ Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Step 2: Starting backend server...
cd apps\backend
npm run dev

pause
