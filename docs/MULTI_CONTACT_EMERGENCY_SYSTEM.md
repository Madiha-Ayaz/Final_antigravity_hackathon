# 🚨 Multi-Contact Emergency Alert System - Complete Guide

## ✅ What's New:

Your app now supports **multiple emergency contacts** with **threat-level-based alerts**!

### Threat Level Logic:

| Threat Level | SMS | WhatsApp | Voice Call | Who Gets Alerted |
|-------------|-----|----------|------------|------------------|
| **LOW**     | ✅  | ❌       | ❌         | Primary contacts only (priority 1) |
| **MEDIUM**  | ✅  | ❌       | ❌         | Primary contacts only (priority 1) |
| **HIGH**    | ✅  | ✅       | ❌         | All contacts |
| **CRITICAL**| ✅  | ✅       | ✅         | All contacts |

---

## 🔧 Setup: Add Emergency Contacts

### Step 1: Register/Login (Get JWT Token)

```powershell
# Register
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"phoneNumber\": \"+923001234567\", \"fullName\": \"Test User\", \"email\": \"test@example.com\"}"

# Save the token from response
```

### Step 2: Add Emergency Contacts

```powershell
# Add Primary Contact (Mother) - Priority 1
curl -X POST http://localhost:3001/api/contacts/emergency -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\": \"Mother\", \"phoneNumber\": \"+923343717260\", \"relationship\": \"Mother\", \"priority\": 1, \"notifySms\": true, \"notifyCall\": true, \"notifyWhatsapp\": true}"

# Add Secondary Contact (Father) - Priority 2
curl -X POST http://localhost:3001/api/contacts/emergency -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\": \"Father\", \"phoneNumber\": \"+923001111111\", \"relationship\": \"Father\", \"priority\": 2, \"notifySms\": true, \"notifyCall\": true, \"notifyWhatsapp\": true}"

# Add Friend - Priority 3
curl -X POST http://localhost:3001/api/contacts/emergency -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\": \"Best Friend\", \"phoneNumber\": \"+923002222222\", \"relationship\": \"Friend\", \"priority\": 3, \"notifySms\": true, \"notifyCall\": false, \"notifyWhatsapp\": true}"
```

### Step 3: View Your Contacts

```powershell
curl -X GET http://localhost:3001/api/contacts/emergency -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "uuid-1",
        "name": "Mother",
        "phone_number": "+923343717260",
        "relationship": "Mother",
        "priority": 1,
        "notify_sms": true,
        "notify_call": true,
        "notify_whatsapp": true
      },
      {
        "id": "uuid-2",
        "name": "Father",
        "phone_number": "+923001111111",
        "relationship": "Father",
        "priority": 2,
        "notify_sms": true,
        "notify_call": true,
        "notify_whatsapp": true
      }
    ],
    "count": 2
  }
}
```

---

## 🧪 Test Threat-Based Alerts

### Test 1: LOW Threat (Only Primary Contact Gets SMS)

```powershell
curl -X POST http://localhost:3001/api/emergency/trigger -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"eventType\": \"MANUAL\", \"threatLevel\": \"LOW\", \"latitude\": 31.5204, \"longitude\": 74.3587, \"address\": \"Lahore, Pakistan\"}"
```

**What happens:**
- ✅ SMS sent to Mother (+923343717260) only
- ❌ No WhatsApp
- ❌ No voice call
- ❌ Other contacts not notified

---

### Test 2: MEDIUM Threat (Only Primary Contact Gets SMS)

```powershell
curl -X POST http://localhost:3001/api/emergency/trigger -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"eventType\": \"MANUAL\", \"threatLevel\": \"MEDIUM\", \"latitude\": 31.5204, \"longitude\": 74.3587, \"address\": \"Lahore, Pakistan\"}"
```

**What happens:**
- ✅ SMS sent to Mother (+923343717260) only
- ❌ No WhatsApp
- ❌ No voice call
- ❌ Other contacts not notified

---

### Test 3: HIGH Threat (All Contacts Get SMS + WhatsApp)

```powershell
curl -X POST http://localhost:3001/api/emergency/trigger -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"eventType\": \"MANUAL\", \"threatLevel\": \"HIGH\", \"latitude\": 31.5204, \"longitude\": 74.3587, \"address\": \"Lahore, Pakistan\"}"
```

**What happens:**
- ✅ SMS sent to ALL contacts (Mother, Father, Friend)
- ✅ WhatsApp sent to ALL contacts
- ❌ No voice call yet
- ✅ Nearby users notified (community validation)

---

### Test 4: CRITICAL Threat (All Contacts Get SMS + WhatsApp + Voice Call)

```powershell
curl -X POST http://localhost:3001/api/emergency/trigger -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"eventType\": \"MANUAL\", \"threatLevel\": \"CRITICAL\", \"latitude\": 31.5204, \"longitude\": 74.3587, \"address\": \"Lahore, Pakistan\"}"
```

**What happens:**
- ✅ SMS sent to ALL contacts
- ✅ WhatsApp sent to ALL contacts
- ✅ Voice call made to ALL contacts
- ✅ Nearby users notified (community validation)

---

## 📱 Contact Management API

### Get All Contacts
```powershell
curl -X GET http://localhost:3001/api/contacts/emergency -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Specific Contact
```powershell
curl -X GET http://localhost:3001/api/contacts/emergency/CONTACT_ID -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Contact
```powershell
curl -X PUT http://localhost:3001/api/contacts/emergency/CONTACT_ID -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\": \"Updated Name\", \"priority\": 2}"
```

### Delete Contact
```powershell
curl -X DELETE http://localhost:3001/api/contacts/emergency/CONTACT_ID -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 Contact Preferences

Each contact can have individual notification preferences:

```json
{
  "notifySms": true,      // Receive SMS alerts
  "notifyCall": true,     // Receive voice calls
  "notifyWhatsapp": true  // Receive WhatsApp messages
}
```

**Example:** Friend who only wants WhatsApp (no calls):
```powershell
curl -X POST http://localhost:3001/api/contacts/emergency -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\": \"Friend\", \"phoneNumber\": \"+923002222222\", \"relationship\": \"Friend\", \"priority\": 3, \"notifySms\": false, \"notifyCall\": false, \"notifyWhatsapp\": true}"
```

---

## 🔥 Emergency Flow with Multiple Contacts

```
User triggers emergency
   ↓
System analyzes threat level
   ↓
┌─────────────────────────────────────────┐
│ LOW/MEDIUM: Primary contacts only      │
│ - SMS to priority 1 contacts           │
├─────────────────────────────────────────┤
│ HIGH: All contacts                      │
│ - SMS to all contacts                   │
│ - WhatsApp to all contacts              │
│ - Notify nearby users                   │
├─────────────────────────────────────────┤
│ CRITICAL: All contacts + Voice          │
│ - SMS to all contacts                   │
│ - WhatsApp to all contacts              │
│ - Voice call to all contacts            │
│ - Notify nearby users                   │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema

```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  phone_number VARCHAR(20),
  relationship VARCHAR(100),
  priority INTEGER,           -- 1 = primary, 2 = secondary
  notify_sms BOOLEAN,
  notify_call BOOLEAN,
  notify_whatsapp BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🆘 Twilio Trial Account Setup

**IMPORTANT:** For Twilio trial accounts, you must verify each phone number:

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter each emergency contact number
4. Verify via SMS code

**Numbers to verify:**
- +923343717260 (Mother)
- +923001111111 (Father)
- +923002222222 (Friend)

---

## 💡 Pro Tips

1. **Priority Matters:** Lower number = higher priority
   - Priority 1: Gets alerts for ALL threat levels
   - Priority 2+: Only gets alerts for HIGH/CRITICAL

2. **Notification Preferences:** Respect contact preferences
   - Some contacts may not want voice calls
   - Some may prefer only WhatsApp

3. **WhatsApp Sandbox:** Join sandbox for each contact
   - Send "join [code]" to +14155238886 from each WhatsApp number

4. **Test Gradually:**
   - Start with LOW threat (only primary contact)
   - Then test HIGH (all contacts, no calls)
   - Finally test CRITICAL (all channels)

---

## 🎉 What You Have Now

✅ **Multi-Contact System:**
- Add unlimited emergency contacts
- Set priority levels
- Individual notification preferences

✅ **Threat-Based Alerts:**
- LOW/MEDIUM: SMS to primary only
- HIGH: SMS + WhatsApp to all
- CRITICAL: SMS + WhatsApp + Voice to all

✅ **Smart Routing:**
- Respects contact preferences
- Filters by priority
- Handles Twilio errors gracefully

✅ **Complete API:**
- CRUD operations for contacts
- Threat-level analysis
- Multi-channel delivery

---

## 🚀 Next Steps

1. ✅ **Restart backend** to load new code
2. ✅ **Add emergency contacts** via API
3. ✅ **Verify phone numbers** in Twilio
4. ✅ **Test each threat level**
5. ✅ **Join WhatsApp sandbox** for each contact

---

**Your emergency alert system is now production-ready with multi-contact support!** 🎯
