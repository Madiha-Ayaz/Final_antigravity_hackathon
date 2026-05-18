#!/bin/bash

# Voice Threat Detection System - Quick Start Script
# Run this script to set up and test the system

set -e

echo "🎤 Voice Threat Detection System - Quick Start"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Checking dependencies..."
cd apps/backend
if ! npm list multer > /dev/null 2>&1; then
    echo "Installing multer..."
    npm install multer @types/multer
else
    echo "✅ Multer already installed"
fi
cd ../..

echo ""
echo "📋 Step 2: Database Migration"
echo "Run this command to create the necessary tables:"
echo ""
echo "  psql \$DATABASE_URL -f apps/backend/src/db/migrations/004_add_voice_threat_detection.sql"
echo ""
read -p "Have you run the database migration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please run the migration first, then restart this script"
    exit 1
fi

echo ""
echo "📋 Step 3: Environment Configuration"
echo "Make sure your apps/backend/.env file has:"
echo ""
echo "  GEMINI_API_KEY=your-gemini-api-key"
echo "  TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886"
echo "  EMERGENCY_COUNTDOWN_SECONDS=120"
echo ""
read -p "Have you configured the environment variables? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please configure .env file first"
    exit 1
fi

echo ""
echo "📋 Step 4: Starting Services"
echo ""
echo "Open two terminals and run:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd apps/backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd apps/frontend"
echo "  npm run dev"
echo ""
echo "📋 Step 5: Access the System"
echo ""
echo "Once both services are running, navigate to:"
echo "  http://localhost:3000/emergency/voice-threat"
echo ""
echo "📋 Step 6: Test the System"
echo ""
echo "To run automated tests:"
echo "  export TEST_TOKEN=your-jwt-token"
echo "  node test-voice-threat-system.js"
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📚 Documentation:"
echo "  - VOICE_THREAT_DETECTION.md - Full system documentation"
echo "  - SETUP_VOICE_THREAT.md - Detailed setup guide"
echo "  - IMPLEMENTATION_SUMMARY.md - Implementation overview"
echo ""
echo "🚀 Ready to use!"
