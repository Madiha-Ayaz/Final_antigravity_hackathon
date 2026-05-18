@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              🔧 PORT 3001 CLEANUP UTILITY                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking for processes using port 3001...
echo.

netstat -ano | findstr :3001

echo.
echo 🛑 Killing processes on port 3001...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo ✅ Port 3001 is now free!
echo.
echo 🚀 You can now start the backend server:
echo    npm run dev:backend
echo.

pause
