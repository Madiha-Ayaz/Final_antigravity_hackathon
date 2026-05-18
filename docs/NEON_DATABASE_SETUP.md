# Connecting to Neon Database

This guide will help you connect your SilentSiren app to a Neon PostgreSQL database.

## Step 1: Create a Neon Account

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up or log in with your GitHub/Google account
3. Create a new project

## Step 2: Get Your Connection String

1. In your Neon project dashboard, click on **"Connection Details"**
2. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Update Your .env File

Replace the `DATABASE_URL` in your `.env` file with your Neon connection string:

```env
# Replace this line:
DATABASE_URL=postgresql://postgres:dua2244@localhost:5432/silentsiren

# With your Neon connection string:
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/silentsiren?sslmode=require
```

## Step 4: Initialize the Database

The database schema will be automatically created when you start the backend server:

```bash
cd apps/backend
npm run dev
```

The server will:
1. Connect to your Neon database
2. Create all necessary tables (users, emergency_events, etc.)
3. Set up indexes and triggers

## Step 5: Verify Connection

Check if the database is connected:

```bash
curl http://localhost:3001/api/health/detailed
```

You should see:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 50
    }
  }
}
```

## Database Schema

The following tables will be created:

- **users** - User accounts and profiles
- **emergency_events** - Emergency incidents
- **emergency_contacts** - User's emergency contacts
- **community_validations** - Community validation records
- **dispatch_logs** - SMS/Call dispatch logs
- **user_sessions** - JWT refresh tokens
- **audit_logs** - System audit trail
- **abuse_reports** - Abuse/spam reports

## Neon Features

Your Neon database includes:

- ✅ **Autoscaling** - Scales to zero when not in use
- ✅ **Branching** - Create database branches for testing
- ✅ **Point-in-time restore** - Restore to any point in time
- ✅ **Connection pooling** - Built-in connection pooling
- ✅ **SSL/TLS** - Encrypted connections by default

## Troubleshooting

### Connection Timeout
If you get connection timeouts, check:
1. Your IP is allowed in Neon's IP allowlist (if enabled)
2. The connection string is correct
3. SSL mode is set to `require`

### Schema Not Created
If tables aren't created automatically:
```bash
# Manually run the schema
psql "your-neon-connection-string" -f apps/backend/src/db/schema.sql
```

### Check Logs
View backend logs for database errors:
```bash
cd apps/backend
npm run dev
# Watch for "Database connected successfully" message
```

## Production Deployment

For production (Railway, Vercel, etc.):

1. Add `DATABASE_URL` as an environment variable
2. Ensure SSL is enabled: `?sslmode=require`
3. Use connection pooling (already configured in the app)
4. Enable Neon's autoscaling for cost optimization

## Need Help?

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Check `apps/backend/src/services/database.service.ts` for connection code
