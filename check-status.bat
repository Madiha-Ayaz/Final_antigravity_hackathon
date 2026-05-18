@echo off
echo ========================================
echo   Checking SilentSiren Setup Status
echo ========================================
echo.

REM Check .env file
if not exist .env (
    echo [X] .env file missing
    exit /b 1
) else (
    echo [OK] .env file exists
)

REM Check frontend .env.local
if not exist apps\frontend\.env.local (
    echo [X] Frontend .env.local missing
    exit /b 1
) else (
    echo [OK] Frontend .env.local exists
)

REM Check node_modules
if not exist node_modules (
    echo [X] Dependencies not installed
    echo     Run: npm install
    exit /b 1
) else (
    echo [OK] Dependencies installed
)

echo.
echo ========================================
echo   Testing API Keys...
echo ========================================
echo.

node test-gemini-only.js

echo.
echo ========================================
if errorlevel 1 (
    echo   Status: NOT READY
    echo   Fix Gemini API key to continue
) else (
    echo   Status: READY TO START!
    echo.
    echo   Run: start-servers.bat
)
echo ========================================
pause
