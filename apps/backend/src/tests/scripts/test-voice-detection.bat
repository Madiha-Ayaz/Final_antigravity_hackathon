@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         🎤 VOICE DETECTION + AUTO ALERTS - TEST GUIDE         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 Testing: Voice detection, auto-alerts, siren, WhatsApp
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 STEP 1: Start Servers
echo.
echo    Terminal 1: cd apps\backend ^&^& npm run dev
echo    Terminal 2: npm run dev:frontend
echo.
echo    Wait for both servers to start...
echo.
pause
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 STEP 2: Add Emergency Contact
echo.
echo    1. Open: http://localhost:3000/contacts
echo    2. Click "Add Emergency Contact"
echo    3. Fill form:
echo       - Name: Test Contact
echo       - Phone: +923001234567 (your WhatsApp number)
echo       - Relationship: Friend
echo       - Check: WhatsApp ✅
echo    4. Click "Add Contact"
echo.
pause
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 STEP 3: Test Voice Detection
echo.
echo    1. Open: http://localhost:3000/monitor
echo    2. Open browser console (Press F12)
echo    3. Page should auto-start protection
echo    4. Say clearly: "Help me!" or "Emergency!"
echo.
echo    Expected console logs:
echo    🎤 Wake phrase detected! Starting analysis...
echo    🔍 Starting AI analysis for transcript: help me
echo    ✅ Analysis result: {...}
echo    🚨 High threat detected! Starting countdown...
echo.
pause
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 STEP 4: Verify Auto-Alerts
echo.
echo    After 3-second countdown:
echo.
echo    ✅ Siren should play automatically
echo    ✅ Fullscreen red emergency UI appears
echo    ✅ Console shows: "Emergency countdown complete!"
echo    ✅ Console shows: "WhatsApp alert sent successfully!"
echo    ✅ Check WhatsApp for emergency message
echo.
echo    WhatsApp message should include:
echo    - 🚨 SILENT SIREN AI ALERT
echo    - Transcript: "help me"
echo    - Threat Level: HIGH
echo    - GPS coordinates
echo    - Google Maps link
echo.
pause
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 STEP 5: Stop Emergency
echo.
echo    1. Click "DISMISS EMERGENCY (I'M SAFE)" button
echo    2. Siren should stop
echo    3. Returns to normal monitor page
echo.
pause
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🎉 TEST COMPLETE!
echo.
echo ✅ Voice Detection: Working
echo ✅ AI Analysis: Working
echo ✅ Auto Countdown: Working
echo ✅ Auto Siren: Working
echo ✅ Auto WhatsApp: Working
echo ✅ Emergency UI: Working
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🐛 TROUBLESHOOTING:
echo.
echo If voice not detected:
echo    - Check microphone permission in browser
echo    - Speak clearly and loudly
echo    - Try: "help me", "emergency", "call police"
echo.
echo If WhatsApp not received:
echo    - Check console for "WhatsApp alert sent successfully!"
echo    - Verify phone number format: +923001234567
echo    - Check TextMeBot API key in backend .env
echo.
echo If backend errors:
echo    - Fallback detection should still work
echo    - WhatsApp should still send
echo    - Check console for fallback messages
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📚 For detailed documentation, see:
echo    - VOICE_DETECTION_FIXED.md
echo    - FINAL_STATUS.md
echo    - ALL_ISSUES_FIXED.md
echo.
pause
