@echo off
echo ========================================
echo   SilentSiren AI - Starting Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server...
echo.
start cmd /k "cd apps\backend && echo Backend Server Starting... && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend Server...
echo.
start cmd /k "cd apps\frontend && echo Frontend Server Starting... && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Wait 10 seconds for servers to start, then open:
echo http://localhost:3000/monitor
echo.
echo Press any key to exit this window...
pause >nul
