#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 WHATSAPP + VOICE + AUDIT SYSTEM - QUICK START          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
echo "Note: If disk space error, manually run: npm install axios"
cd apps/backend
npm install axios 2>/dev/null || echo "⚠️  Axios install failed - add manually to package.json"
cd ../..

# Step 2: Setup NEON Database
echo ""
echo "🗄️  Step 2: Setting up NEON Database..."
echo "Run this command to setup database:"
echo "psql \"postgresql://neondb_owner:npg_bdflQ1gx7qYz@ep-dry-smoke-aqh2syx4-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require\" -f database/neon_schema.sql"
echo ""
echo "Or manually execute the SQL file in NEON console"

# Step 3: Build backend
echo ""
echo "🔨 Step 3: Building backend..."
cd apps/backend
npm run build
cd ../..

# Step 4: Start servers
echo ""
echo "🚀 Step 4: Starting servers..."
echo "Run in separate terminals:"
echo "  Terminal 1: npm run dev:backend"
echo "  Terminal 2: npm run dev:frontend"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📱 Test Pages:"
echo "  - WhatsApp Test: http://localhost:3000/whatsapp-test"
echo "  - Admin Dashboard: http://localhost:3000/admin"
echo "  - Voice Test: http://localhost:3000/test-voice"
echo ""
echo "📚 Documentation: WHATSAPP_VOICE_AUDIT_COMPLETE.md"
