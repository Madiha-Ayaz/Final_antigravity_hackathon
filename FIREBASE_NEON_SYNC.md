# 🔄 Firebase-Neon Database Sync Guide

## Overview

This system syncs Firebase Authentication users with Neon PostgreSQL database, allowing you to:
- Store Firebase users in Neon database
- Add emergency contacts linked to Firebase users
- Query user data from Neon instead of Firebase
- Maintain single source of truth

---

## 🗄️ Database Setup

### Step 1: Run Migration

```bash
# Connect to Neon database
psql $DATABASE_URL

# Run migration
\i apps/backend/src/db/migrations/005_add_firebase_sync.sql

# Verify changes
\d users
\d emergency_contacts
```

**What This Does:**
- Adds `firebase_uid` column to `users` table
- Adds `carrier` column to `emergency_contacts` table
- Makes `phone_number` optional in `users` table
- Creates indexes for faster lookups

---

## 🔧 How It Works

### 1. User Authentication Flow

```
User logs in with Firebase
         ↓
Firebase returns ID token
         ↓
Backend verifies token
         ↓
Backend syncs user to Neon
         ↓
User data stored in both Firebase & Neon
```

### 2. Emergency Contact Flow

```
User adds emergency contact
         ↓
Contact saved to Neon database
         ↓
Linked to user via user_id (from Neon)
         ↓
Contact includes carrier for free SMS
```

---

## 📡 API Endpoints

### Add Emergency Contact (Simple)

```bash
POST /api/emergency-contacts/add
Authorization: Bearer <firebase-token>

Body:
{
  "name": "John Doe",
  "phoneNumber": "923001234567",  // No + required
  "relationship": "Family",
  "carrier": "jazz"  // Optional
}

Response:
{
  "success": true,
  "contact": {
    "id": "uuid",
    "name": "John Doe",
    "phoneNumber": "+923001234567",
    "relationship": "Family",
    "carrier": "jazz"
  },
  "message": "Emergency contact added successfully"
}
```

### Get All Contacts

```bash
GET /api/emergency-contacts/list
Authorization: Bearer <firebase-token>

Response:
{
  "success": true,
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phoneNumber": "+923001234567",
      "relationship": "Family",
      "carrier": "jazz",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Delete Contact

```bash
DELETE /api/emergency-contacts/:contactId
Authorization: Bearer <firebase-token>

Response:
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

## 🔐 Firebase Token Authentication

### Frontend: Get Firebase Token

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const idToken = await user.getIdToken();

  // Use token in API calls
  const response = await fetch('/api/emergency-contacts/add', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'John Doe',
      phoneNumber: '923001234567',
      relationship: 'Family',
      carrier: 'jazz'
    })
  });
}
```

### Backend: Verify Token & Sync User

```typescript
import { firebaseNeonSyncService } from './services/firebaseNeonSync.service';

// In your auth middleware
const idToken = req.headers.authorization?.replace('Bearer ', '');

const { userId, firebaseUid } = await firebaseNeonSyncService.verifyAndSyncUser(idToken);

// Now userId is the Neon database user ID
// Use it to query/insert data
```

---

## 🔄 Bulk Sync Existing Users

If you already have Firebase users and want to sync them to Neon:

```bash
# Create sync script
node sync-firebase-users.js
```

**Script:**
```javascript
const { firebaseNeonSyncService } = require('./services/firebaseNeonSync.service');

async function syncAllUsers() {
  console.log('Starting bulk sync...');

  const result = await firebaseNeonSyncService.bulkSyncUsers();

  console.log(`Synced: ${result.synced}`);
  console.log(`Failed: ${result.failed}`);
}

syncAllUsers();
```

---

## 📊 Database Schema

### Users Table (Updated)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE,  -- NEW: Firebase UID
  phone_number VARCHAR(20),          -- Now optional
  email VARCHAR(255),
  full_name VARCHAR(255),
  is_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Emergency Contacts Table (Updated)

```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  phone_number VARCHAR(20),
  relationship VARCHAR(100),
  carrier VARCHAR(50),               -- NEW: For free SMS
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🧪 Testing

### Test 1: Add Contact

```bash
# Get Firebase token first
TOKEN="your-firebase-id-token"

# Add contact
curl -X POST http://localhost:3001/api/emergency-contacts/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact",
    "phoneNumber": "923001234567",
    "relationship": "Friend",
    "carrier": "jazz"
  }'
```

### Test 2: Get Contacts

```bash
curl http://localhost:3001/api/emergency-contacts/list \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Verify in Database

```bash
# Connect to Neon
psql $DATABASE_URL

# Check users
SELECT id, firebase_uid, email, full_name FROM users;

# Check contacts
SELECT id, user_id, name, phone_number, carrier FROM emergency_contacts;
```

---

## ✅ Benefits

### Before (Firebase Only):
- ❌ User data only in Firebase
- ❌ Can't query users with SQL
- ❌ Can't join with emergency contacts
- ❌ Limited reporting capabilities

### After (Firebase + Neon):
- ✅ User data in both Firebase & Neon
- ✅ Full SQL query capabilities
- ✅ Easy joins with contacts/events
- ✅ Advanced reporting & analytics
- ✅ Backup in Neon database

---

## 🔍 Troubleshooting

### Issue: "User not found in Neon"

**Solution:**
```javascript
// Manually sync user
const { userId } = await firebaseNeonSyncService.verifyAndSyncUser(idToken);
```

### Issue: "Phone number validation failed"

**Solution:**
Use the simple endpoint `/api/emergency-contacts/add` instead of `/api/contacts/emergency`

### Issue: "Firebase UID already exists"

**Solution:**
This is normal - user already synced. The system will update existing user.

---

## 📝 Migration Checklist

- [ ] Run database migration (005_add_firebase_sync.sql)
- [ ] Verify `firebase_uid` column exists in `users` table
- [ ] Verify `carrier` column exists in `emergency_contacts` table
- [ ] Update frontend to use new endpoints
- [ ] Test adding contacts with Firebase token
- [ ] Bulk sync existing Firebase users (if any)
- [ ] Verify data in Neon database

---

## 🚀 Next Steps

1. Run migration
2. Restart backend
3. Test adding contacts
4. Verify in Neon database
5. Update frontend to use new endpoints

---

## 📞 Support

For issues:
1. Check backend logs
2. Verify Firebase token is valid
3. Check Neon database connection
4. Verify migration ran successfully
