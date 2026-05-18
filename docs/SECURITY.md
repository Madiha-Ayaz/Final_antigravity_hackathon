# Phase 7: Security, Abuse Prevention & Threat Hardening

## Overview

Phase 7 implements enterprise-grade security features including JWT authentication, OTP verification, RBAC (Role-Based Access Control), replay attack prevention, audit logging, and comprehensive abuse analytics.

## Architecture

### Core Security Components

1. **Encryption Service** (`encryption.service.ts`)
   - AES-256-GCM encryption/decryption
   - Password hashing with scrypt
   - HMAC signature generation/verification
   - Secure token and OTP generation
   - RSA key pair generation
   - Nonce generation and validation

2. **JWT Authentication** (`auth.service.ts`)
   - Access token (15 minutes)
   - Refresh token (7 days)
   - Token blacklisting
   - Session management
   - Multi-device support
   - Automatic token refresh

3. **OTP Verification** (`otp.service.ts`)
   - SMS-based OTP via Twilio
   - 6-digit OTP codes
   - 5-minute expiry
   - Rate limiting (5 OTP/hour)
   - 3 verification attempts
   - Resend functionality

4. **RBAC System** (`rbac.ts`, `rbac.types.ts`)
   - 4 roles: user, moderator, admin, superadmin
   - 25+ granular permissions
   - Role hierarchy
   - Permission-based middleware
   - Resource ownership checks

5. **Replay Attack Prevention** (`replayProtection.ts`)
   - Request signing with HMAC
   - Nonce tracking in Redis
   - Timestamp validation (5-minute window)
   - Automatic nonce expiry

6. **Audit Logging** (`audit.service.ts`)
   - 20+ audit actions
   - Comprehensive event tracking
   - 90-day retention
   - User activity logs
   - Action-based indexing
   - Statistics and analytics

7. **Abuse Analytics** (`abuseAnalytics.service.ts`)
   - False alarm detection
   - User behavior analysis
   - Risk scoring (0-100)
   - Coordinated attack detection
   - Real-time alerts
   - Pattern recognition

8. **Enhanced Device Fingerprinting** (`deviceFingerprint.ts`)
   - Canvas fingerprinting
   - WebGL fingerprinting
   - Audio context fingerprinting
   - Font detection
   - Hardware detection
   - Browser plugin detection

9. **Security Headers** (`securityEnhanced.ts`)
   - Content Security Policy (CSP)
   - HSTS with preload
   - XSS protection
   - Clickjacking prevention
   - MIME sniffing prevention
   - Permissions Policy

---

## Features

### 1. JWT Authentication

**Access Token:**

- Lifetime: 15 minutes
- Contains: userId, role, deviceId, sessionId
- Stored: Client-side (memory/localStorage)
- Validation: Every request

**Refresh Token:**

- Lifetime: 7 days
- Stored: Redis + Client-side
- Used: To obtain new access token
- Rotation: New refresh token on each use

**Session Management:**

- Multi-device support
- Session tracking in Redis
- Logout from single device
- Logout from all devices
- Session expiry handling

### 2. OTP Verification

**Flow:**

```
1. User requests OTP
2. System generates 6-digit code
3. SMS sent via Twilio
4. User enters OTP
5. System verifies (3 attempts max)
6. Success → User verified
```

**Security:**

- Rate limiting: 5 OTP per hour
- Expiry: 5 minutes
- Max attempts: 3
- Phone number masking in logs
- Test mode for development

### 3. RBAC (Role-Based Access Control)

**Roles:**

| Role       | Level | Description            |
| ---------- | ----- | ---------------------- |
| user       | 1     | Basic user permissions |
| moderator  | 2     | Content moderation     |
| admin      | 3     | System administration  |
| superadmin | 4     | Full system access     |

**Permissions:**

```typescript
// User permissions
('user:read', 'user:update', 'user:delete');

// Emergency permissions
('emergency:create', 'emergency:read', 'emergency:cancel');

// Validator permissions
('validator:submit', 'validator:read');

// Reputation permissions
('reputation:read', 'reputation:update');

// Moderation permissions
('moderation:ban', 'moderation:unban', 'moderation:review');

// Admin permissions
('admin:users', 'admin:analytics', 'admin:settings', 'admin:audit');

// System permissions
('system:config', 'system:logs', 'system:backup');
```

**Usage:**

```typescript
// Require specific permission
router.get('/admin/users', authenticate, requirePermission('admin:users'), handler);

// Require any of multiple permissions
router.post(
  '/moderate',
  authenticate,
  requireAnyPermission('moderation:ban', 'admin:users'),
  handler
);

// Check resource ownership
router.get(
  '/user/:id',
  authenticate,
  requireOwnership((req) => req.params.id),
  handler
);
```

### 4. Replay Attack Prevention

**Request Signing:**

```typescript
// Client-side
const timestamp = Date.now();
const nonce = generateNonce();
const body = JSON.stringify(data);
const signature = sign(`${method}:${path}:${timestamp}:${nonce}:${body}`);

// Headers
{
  'X-Timestamp': timestamp,
  'X-Nonce': nonce,
  'X-Signature': signature
}
```

**Server-side Validation:**

1. Check timestamp (not expired, not future)
2. Check nonce (not used before)
3. Verify signature
4. Mark nonce as used
5. Process request

**Configuration:**

- Max request age: 5 minutes
- Nonce TTL: 10 minutes
- Signature algorithm: HMAC-SHA256

### 5. Audit Logging

**Logged Actions:**

- User authentication (login, logout, register)
- Emergency operations (create, cancel, dispatch)
- Validator operations (submit, validate)
- Reputation updates
- Moderation actions (ban, unban)
- Admin operations (settings, user management)
- Security events (OTP, token operations)

**Log Structure:**

```typescript
{
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  targetUserId?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  status: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  errorMessage?: string;
}
```

**Retention:**

- Duration: 90 days
- Storage: Redis sorted sets
- Indexing: By user, by action, by timestamp

### 6. Abuse Analytics

**Metrics Tracked:**

- Total incidents
- False alarm rate
- Validated incidents
- Average AI confidence
- Suspicious users
- Suspicious devices
- Top abusers

**User Behavior Analysis:**

- Incident count
- False alarm count
- Average time between incidents
- Suspicious patterns detection
- Risk score (0-100)

**Risk Scoring:**

```
Risk Score =
  (False Alarm Rate × 40) +
  (Incident Count Factor × 30) +
  (Suspicious Patterns × 10 each)
```

**Alert Types:**

- High false alarm rate
- Rapid incident creation
- Suspicious device activity
- Coordinated attacks

### 7. Device Fingerprinting

**Collected Data:**

- User agent
- Platform
- Screen resolution
- Color depth
- Timezone
- Languages
- Hardware concurrency
- Device memory
- Touch support
- Canvas fingerprint
- WebGL fingerprint
- Audio context fingerprint
- Available fonts
- Browser plugins

**Fingerprint Generation:**

1. Collect all data points
2. Serialize to JSON
3. Hash with SHA-256
4. Return 64-character hex string

### 8. Security Headers

**Implemented Headers:**

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Expect-CT
- Cross-Origin-Embedder-Policy
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy

---

## API Endpoints

### Authentication

**POST /api/auth/register**

```json
{
  "phoneNumber": "+1234567890",
  "deviceId": "device-fingerprint"
}
```

**POST /api/auth/login**

```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**POST /api/auth/refresh**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**POST /api/auth/logout**

```json
{
  "sessionId": "session_123"
}
```

### OTP

**POST /api/auth/otp/send**

```json
{
  "phoneNumber": "+1234567890"
}
```

**POST /api/auth/otp/verify**

```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

### Audit Logs

**GET /api/admin/audit/logs**
Query params: `limit`, `offset`

**GET /api/admin/audit/user/:userId**
Get user-specific audit logs

**GET /api/admin/audit/statistics**
Get audit statistics

### Abuse Analytics

**GET /api/admin/analytics/metrics**
Query params: `startDate`, `endDate`

**GET /api/admin/analytics/user/:userId**
Get user behavior analysis

**GET /api/admin/analytics/alerts**
Get recent abuse alerts

**GET /api/admin/analytics/summary**
Get comprehensive summary

---

## Configuration

### Environment Variables

```bash
# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Encryption
ENCRYPTION_KEY=your_encryption_key_min_32_chars

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Redis
REDIS_URL=redis://localhost:6379
```

### Token Configuration

```typescript
// Access token
accessTokenExpiry: '15m';

// Refresh token
refreshTokenExpiry: '7d';

// Session
sessionExpiry: 7 * 86400; // 7 days
```

### OTP Configuration

```typescript
OTP_LENGTH: 6;
OTP_EXPIRY_SECONDS: 300; // 5 minutes
MAX_ATTEMPTS: 3;
MAX_OTP_PER_HOUR: 5;
```

### Replay Protection

```typescript
MAX_REQUEST_AGE_MS: 300000; // 5 minutes
NONCE_TTL_SECONDS: 600; // 10 minutes
```

---

## Usage Examples

### 1. User Registration & Login

```typescript
// 1. Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    deviceId: await deviceFingerprint.generate(),
  }),
});

// 2. Request OTP
await fetch('/api/auth/otp/send', {
  method: 'POST',
  body: JSON.stringify({ phoneNumber: '+1234567890' }),
});

// 3. Verify OTP and login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    otp: '123456',
  }),
});

const { accessToken, refreshToken } = await loginResponse.json();

// 4. Use access token
const response = await fetch('/api/emergency/create', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emergencyData),
});
```

### 2. Token Refresh

```typescript
// When access token expires
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});

const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshResponse.json();

// Store new tokens
localStorage.setItem('accessToken', newAccessToken);
localStorage.setItem('refreshToken', newRefreshToken);
```

### 3. Protected Route with RBAC

```typescript
// Backend
router.post(
  '/admin/ban-user',
  authenticate, // Verify JWT
  requirePermission('moderation:ban'), // Check permission
  async (req, res) => {
    // Handler logic
  }
);

// Frontend
const response = await fetch('/api/admin/ban-user', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId, reason }),
});
```

### 4. Request with Replay Protection

```typescript
import { encryptionService } from './encryption';

const timestamp = Date.now();
const nonce = encryptionService.generateNonce();
const body = JSON.stringify(data);
const signature = encryptionService.sign(
  `POST:/api/validator/submit:${timestamp}:${nonce}:${body}`,
  JWT_SECRET
);

const response = await fetch('/api/validator/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Signature': signature,
  },
  body,
});
```

### 5. Audit Logging

```typescript
import { auditService } from './services/audit.service';

// Log user action
await auditService.log({
  action: 'emergency.create',
  userId: req.user.userId,
  resourceId: emergencyId,
  resourceType: 'emergency',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  deviceId: req.user.deviceId,
  sessionId: req.user.sessionId,
  status: 'success',
  metadata: {
    location: { lat, lng },
    threatLevel: 'HIGH',
  },
});
```

---

## Security Best Practices

### 1. Token Storage

**Access Token:**

- Store in memory (React state)
- OR sessionStorage (cleared on tab close)
- NEVER in localStorage (XSS risk)

**Refresh Token:**

- Store in httpOnly cookie (best)
- OR localStorage with encryption
- Rotate on each use

### 2. Password Security

- Minimum 8 characters
- Use scrypt for hashing
- Salt automatically included
- Timing-safe comparison

### 3. API Security

- Always use HTTPS in production
- Validate all inputs with Zod
- Sanitize user inputs
- Rate limit all endpoints
- Use CORS properly

### 4. Session Management

- Implement session timeout
- Track active sessions
- Allow logout from all devices
- Invalidate tokens on password change

### 5. Audit Everything

- Log all authentication attempts
- Log all admin actions
- Log all security events
- Monitor for suspicious patterns

---

## Monitoring & Alerts

### Key Metrics

1. **Authentication:**
   - Login success/failure rate
   - OTP delivery rate
   - Token refresh rate
   - Session duration

2. **Security:**
   - Failed authentication attempts
   - Replay attack attempts
   - Invalid signatures
   - Expired tokens

3. **Abuse:**
   - False alarm rate
   - Suspicious user count
   - Alert frequency
   - Risk score distribution

### Alert Thresholds

- Failed logins: >5 in 5 minutes
- OTP failures: >3 attempts
- Replay attacks: Any occurrence
- High-risk users: Risk score >70
- Coordinated attacks: >10 incidents in 5 minutes

---

## Testing

### Unit Tests

```bash
npm test -- auth.service.test.ts
npm test -- otp.service.test.ts
npm test -- encryption.service.test.ts
```

### Integration Tests

```bash
npm test -- auth.integration.test.ts
```

### Security Tests

- Penetration testing
- OWASP Top 10 checks
- Token expiry validation
- Replay attack simulation
- Rate limit testing

---

## Troubleshooting

### Issue: JWT token expired

**Solution:**

- Use refresh token to get new access token
- Implement automatic token refresh
- Check token expiry before requests

### Issue: OTP not received

**Solution:**

- Check Twilio credentials
- Verify phone number format
- Check rate limits
- Review Twilio logs

### Issue: Replay attack false positives

**Solution:**

- Check client/server time sync
- Increase MAX_REQUEST_AGE_MS
- Verify signature generation

### Issue: High false alarm rate

**Solution:**

- Review AI confidence thresholds
- Analyze user behavior patterns
- Adjust abuse detection rules

---

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - TOTP (Time-based OTP)
   - Biometric authentication
   - Hardware security keys

2. **Advanced Threat Detection**
   - Machine learning for anomaly detection
   - Behavioral biometrics
   - Device reputation scoring

3. **Zero Trust Architecture**
   - Continuous authentication
   - Context-aware access control
   - Micro-segmentation

4. **Compliance**
   - GDPR compliance tools
   - SOC 2 audit logs
   - HIPAA compliance features

5. **Blockchain Integration**
   - Immutable audit logs
   - Decentralized identity
   - Smart contract verification

---

## References

- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- OAuth 2.0: https://oauth.net/2/
- WebAuthn: https://webauthn.io/
