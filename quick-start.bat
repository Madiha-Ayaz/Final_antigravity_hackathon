@echo off
echo ========================================
echo   SilentSiren - Quick Start Guide
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env first
    pause
    exit /b 1
)

echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo     Node.js: OK

echo.
echo [2/4] Testing API Keys and Database...
node test-services.js
echo.

echo [3/4] Ready to start servers?
echo.
echo Available commands:
echo   - start-servers.bat : Start both backend and frontend
echo   - Backend only: cd apps\backend ^&^& npm run dev
echo   - Frontend only: cd apps\frontend ^&^& npm run dev
echo.

echo [4/4] Important Notes:
echo   - Backend runs on: http://localhost:3001
echo   - Frontend runs on: http://localhost:3000
echo   - Make sure Gemini API key is valid before starting
echo.

echo ========================================
pause
