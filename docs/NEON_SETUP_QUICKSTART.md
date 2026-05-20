# Neon Database Integration - Quick Start Guide

## ✅ What's Been Done

Your SilentSiren app is now fully integrated with PostgreSQL and ready to connect to Neon database!

### Files Created/Updated:

1. **Database Service** (`apps/backend/src/services/database.service.ts`)
   - Connection pooling with pg
   - Transaction support
   - Health checks
   - Auto-reconnection

2. **Database Schema** (`apps/backend/src/db/schema.sql`)
   - Users table
   - Emergency events table
   - Emergency contacts table
   - Community validations table
   - Dispatch logs table
   - User sessions table
   - Audit logs table
   - Abuse reports table
   - All indexes and triggers

3. **Repositories**
   - `user.repository.ts` - User CRUD operations
   - `emergency.repository.ts` - Emergency event operations

4. **Updated Routes**
   - `/api/auth/register` - Now saves users to database
   - `/api/auth/login` - Now authenticates from database
   - `/api/emergency/trigger` - Now creates events in database
   - `/api/emergency/cancel` - Now updates events in database
   - `/api/emergency/history` - New endpoint for user's emergency history
   - `/api/emergency/statistics` - New endpoint for user statistics

5. **Health Checks**
   - `/api/health/detailed` - Now includes database status
   - `/api/health/ready` - Checks database connectivity

## 🚀 How to Connect to Neon

### Step 1: Create Neon Database

1. Go to https://console.neon.tech/
2. Sign up or log in
3. Click **"Create Project"**
4. Choose a name (e.g., "silentsiren")
5. Select a region close to you
6. Click **"Create Project"**

### Step 2: Get Connection String

1. In your Neon dashboard, click **"Connection Details"**
2. Copy the connection string (it looks like this):
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Update Your .env File

Open your `.env` file and replace the DATABASE_URL:

```env
# Replace this:
DATABASE_URL=postgresql://postgres:dua2244@localhost:5432/silentsiren

# With your Neon connection string:
DATABASE_URL=postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Start Your Backend

```bash
cd apps/backend
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Database schema verified
✅ Redis connected successfully
✅ Server running on port 3001
```

### Step 5: Verify Connection

Test the health endpoint:

```bash
curl http://localhost:3001/api/health/detailed
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "redis": {
      "status": "up",
      "responseTime": 2
    }
  }
}
```

## 🧪 Test the Database Integration

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923343717260",
    "fullName": "Test User",
    "email": "test@example.com"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+923343717260"
  }'
```

Save the token from the response!

### 3. Create Emergency Event

```bash
curl -X POST http://localhost:3001/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "eventType": "MANUAL",
    "threatLevel": "HIGH",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "address": "Lahore, Pakistan"
  }'
```

### 4. View Emergency History

```bash
curl http://localhost:3001/api/emergency/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Tables

Your Neon database now has these tables:

- **users** - User accounts (phone, email, reputation)
- **emergency_events** - All emergency incidents
- **emergency_contacts** - User's emergency contacts
- **community_validations** - Community validation records
- **dispatch_logs** - SMS/Call logs
- **user_sessions** - JWT refresh tokens
- **audit_logs** - System audit trail
- **abuse_reports** - Abuse/spam reports

## 🔧 Troubleshooting

### "Failed to connect to database"

1. Check your connection string is correct
2. Ensure `?sslmode=require` is at the end
3. Verify your Neon project is active
4. Check if your IP is allowed (Neon allows all IPs by default)

### "Schema not created"

The schema is created automatically on first run. If it fails:

```bash
# Manually run the schema
psql "YOUR_NEON_CONNECTION_STRING" -f apps/backend/src/db/schema.sql
```

### "Connection timeout"

- Check your internet connection
- Verify the Neon region is accessible
- Try a different region in Neon settings

## 🎯 Next Steps

1. ✅ Connect to Neon (follow steps above)
2. ✅ Test user registration and login
3. ✅ Test emergency event creation
4. 🔄 Fix the Gemini API key issue (get new key from https://aistudio.google.com/app/apikey)
5. 🔄 Test voice analysis with working Gemini API
6. 🔄 Deploy to production (Railway/Vercel)

## 📝 Important Notes

- **SSL is required** for Neon connections (already configured)
- **Connection pooling** is enabled (max 20 connections)
- **Auto-reconnection** is handled automatically
- **Transactions** are supported for complex operations
- **Schema migrations** run automatically on startup

## 🌐 Production Deployment

When deploying to Railway/Vercel:

1. Add `DATABASE_URL` environment variable
2. Use your Neon connection string
3. Enable connection pooling in Neon dashboard
4. Consider using Neon's autoscaling feature

## 💡 Neon Benefits

- ✅ **Autoscaling** - Scales to zero when not in use (saves money!)
- ✅ **Branching** - Create database branches for testing
- ✅ **Backups** - Automatic daily backups
- ✅ **Point-in-time restore** - Restore to any point in time
- ✅ **Free tier** - 0.5 GB storage, 100 hours compute/month

---

Need help? Check the detailed guide: `docs/NEON_DATABASE_SETUP.md`
