@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           🧪 AUTOMATED TESTING SCRIPT                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 📋 This script will test all WhatsApp features
echo.

REM Test 1: Check if backend is running
echo 🔍 Test 1: Checking backend health...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running!
    echo    Start backend first: npm run dev:backend
    pause
    exit /b 1
)

echo.

REM Test 2: Check if frontend is running
echo 🔍 Test 2: Checking frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ⚠️  Frontend might not be running
    echo    Start frontend: npm run dev:frontend
)

echo.

REM Test 3: Test WhatsApp service
echo 🔍 Test 3: Testing WhatsApp service...
echo.
node test-whatsapp-service.js

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    📱 MANUAL TESTS                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Now test these manually:
echo.
echo 1. Voice Alert System:
echo    http://localhost:3000/whatsapp-test
echo.
echo 2. Contact Form:
echo    http://localhost:3000/whatsapp-test
echo.
echo 3. Admin Dashboard:
echo    http://localhost:3000/admin
echo.

pause
