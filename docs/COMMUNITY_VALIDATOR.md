# Phase 6: Community Validator & Cross-Verification

## Overview

The Community Validator system implements decentralized consensus-based emergency validation. When multiple users in the same geographic area report emergencies within a short time window, the system cross-validates these incidents to determine if they represent a genuine emergency situation.

## Architecture

### Core Components

1. **Redis Service** (`redis.service.ts`)
   - Geospatial indexing with GEORADIUS
   - Time-series data with sorted sets
   - Hash storage for incident data
   - Connection pooling and retry logic

2. **Community Validator Service** (`communityValidator.service.ts`)
   - GPS radius clustering (500m default)
   - Time window filtering (5 minutes default)
   - Consensus calculation algorithm
   - Validation scoring (0-1 scale)

3. **Reputation Service** (`reputation.service.ts`)
   - User reputation scoring
   - Rate limiting (3/hour, 10/day)
   - Device fingerprinting
   - Sybil attack detection
   - Temporary banning system

4. **Validator API** (`routes/validator.ts`)
   - REST endpoints for incident submission
   - Validation status queries
   - Reputation management
   - Admin controls

### Data Flow

```
1. User detects emergency
   ↓
2. Submit incident with GPS + AI analysis
   ↓
3. Check user reputation & rate limits
   ↓
4. Store incident in Redis (geospatial + temporal)
   ↓
5. Find nearby incidents (radius + time window)
   ↓
6. Calculate validation score & consensus
   ↓
7. Return validation result + dispatch recommendation
   ↓
8. Update user reputation based on outcome
```

## Configuration

### Default Settings

```typescript
{
  radiusMeters: 500,              // 500m radius for nearby incidents
  timeWindowSeconds: 300,         // 5 minute time window
  minIncidentsForConsensus: 2,    // At least 2 incidents required
  minAverageConfidence: 0.7,      // 70% average AI confidence
  maxIncidentsPerUser: 3,         // Max 3 incidents per hour
  cooldownSeconds: 3600           // 1 hour cooldown
}
```

### Environment Variables

```bash
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### 1. Submit Incident

**POST** `/api/validator/submit`

Submit a new emergency incident for community validation.

**Request Body:**

```json
{
  "userId": "string",
  "deviceId": "string",
  "location": {
    "latitude": number,
    "longitude": number,
    "accuracy": number (optional)
  },
  "aiAnalysis": {
    "confidence": number (0-1),
    "threatLevel": "LOW" | "MEDIUM" | "HIGH",
    "reasoning": "string",
    "audioPatterns": ["string"] (optional)
  },
  "audioClipUrl": "string" (optional)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "incident": {
      "id": "string",
      "status": "pending" | "validated",
      "timestamp": "ISO8601"
    },
    "validation": {
      "isValidated": boolean,
      "validationScore": number,
      "nearbyIncidentCount": number,
      "consensusReached": boolean,
      "reasoning": "string",
      "shouldDispatch": boolean,
      "nearbyIncidents": [...]
    },
    "reputation": {...},
    "remainingQuota": number
  }
}
```

**Error Responses:**

- `429` - Rate limit exceeded
- `400` - Invalid request data
- `500` - Internal server error

### 2. Get Validation Status

**GET** `/api/validator/status/:incidentId`

Get current validation status for an incident.

**Response:**

```json
{
  "success": true,
  "data": {
    "incident": {
      "id": "string",
      "status": "string",
      "timestamp": "ISO8601",
      "validationScore": number
    },
    "validation": {...}
  }
}
```

### 3. Get Incident Details

**GET** `/api/validator/incident/:incidentId`

Get full incident details.

### 4. Update Reputation

**POST** `/api/validator/reputation/update`

Update user reputation after incident resolution.

**Request Body:**

```json
{
  "userId": "string",
  "wasValidated": boolean,
  "wasFalseAlarm": boolean
}
```

### 5. Get User Reputation

**GET** `/api/validator/reputation/:userId`

Get user reputation and statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "reputation": {
      "userId": "string",
      "score": number,
      "totalIncidents": number,
      "validatedIncidents": number,
      "falseAlarms": number,
      "isBanned": boolean,
      "banReason": "string" (optional),
      "banExpiresAt": "ISO8601" (optional)
    }
  }
}
```

### 6. Ban User (Admin)

**POST** `/api/validator/ban`

Temporarily ban a user.

**Request Body:**

```json
{
  "userId": "string",
  "reason": "string",
  "durationSeconds": number (optional, default 86400)
}
```

### 7. Unban User (Admin)

**POST** `/api/validator/unban`

Remove ban from a user.

## Validation Algorithm

### Validation Score Calculation

The validation score (0-1) is calculated using four factors:

1. **Incident Count Factor (40%)**
   - More nearby incidents = higher score
   - Normalized: `min(nearbyCount / 5, 1) * 0.4`

2. **Confidence Factor (30%)**
   - Average AI confidence across all incidents
   - Formula: `avgConfidence * 0.3`

3. **Time Proximity Factor (20%)**
   - Incidents closer in time = higher score
   - Formula: `max(0, 1 - avgTimeDiff / timeWindow) * 0.2`

4. **Distance Proximity Factor (10%)**
   - Incidents closer in space = higher score
   - Formula: `max(0, 1 - avgDistance / radius) * 0.1`

### Consensus Criteria

Consensus is reached when:

- At least 2 incidents in the area (configurable)
- Average confidence ≥ 70%
- All incidents within 500m radius
- All incidents within 5 minute window

### Dispatch Recommendation

Dispatch is recommended when:

- Consensus is reached
- Validation score ≥ 0.7
- OR single incident with confidence ≥ 0.85

## Reputation System

### Scoring

- **Initial Score:** 100
- **Validated Incident:** +5 points
- **False Alarm:** -10 points
- **Ban Threshold:** ≤ -50 points

### Rate Limits

- **Hourly:** 3 incidents per user
- **Daily:** 10 incidents per user
- **Cooldown:** 1 hour between incidents

### Banning

Users are automatically banned when:

- Reputation score ≤ -50
- Too many false alarms
- Suspicious device activity

Ban duration: 24 hours (configurable)

## Anti-Abuse Mechanisms

### 1. Rate Limiting

Per-user rate limits prevent spam:

- 3 incidents per hour
- 10 incidents per day
- Tracked in Redis with automatic expiry

### 2. Device Fingerprinting

Tracks device usage patterns:

- Incident count per device
- Multiple users per device (Sybil detection)
- Suspicious activity flagging

### 3. Sybil Attack Prevention

Detects coordinated fake accounts:

- Monitors device-user associations
- Flags devices with >5 users
- Blocks suspicious devices

### 4. Reputation Decay

Reputation scores influence:

- Rate limit allowances
- Validation weight
- Automatic banning

## Frontend Integration

### React Hook

```typescript
import { useCommunityValidator } from '@/hooks/useCommunityValidator';

function EmergencyComponent() {
  const { submitIncident, getValidationStatus } = useCommunityValidator();

  const handleEmergency = async () => {
    const result = await submitIncident({
      userId: 'user-123',
      deviceId: 'device-456',
      location: { latitude: 37.7749, longitude: -122.4194 },
      aiAnalysis: {
        confidence: 0.85,
        threatLevel: 'HIGH',
        reasoning: 'Detected scream and panic',
      },
    });

    if (result?.validation.shouldDispatch) {
      // Proceed with emergency dispatch
    }
  };
}
```

### Validation Status Component

```typescript
import { ValidationStatus } from '@/components/ValidationStatus';

<ValidationStatus validation={validationResult} />
```

## Testing

### Test Page

Navigate to `/validator-test` to access the testing interface.

### Manual Testing Steps

1. **Single Incident Test**
   - Submit one incident
   - Verify no consensus (no nearby incidents)
   - Check validation score is low

2. **Consensus Test**
   - Open page in multiple tabs/devices
   - Submit incidents from same location
   - Verify consensus is reached
   - Check validation score increases

3. **Rate Limit Test**
   - Submit 4 incidents rapidly
   - Verify 4th request is blocked
   - Check error message

4. **Reputation Test**
   - Submit multiple false alarms
   - Verify reputation score decreases
   - Check automatic ban at threshold

5. **Sybil Attack Test**
   - Create multiple users on same device
   - Submit incidents from all users
   - Verify device is flagged after 5 users

### Redis CLI Testing

```bash
# View all incidents
redis-cli GEORADIUS incidents:geo -122.4194 37.7749 1000 m

# Check incident data
redis-cli HGET incidents:data:incident_123 data

# View user reputation
redis-cli HGET reputation:user:user-123 data

# Check rate limits
redis-cli GET ratelimit:user:user-123:hour
```

## Security Considerations

### 1. Input Validation

All inputs are validated using Zod schemas:

- GPS coordinates range checks
- Confidence score bounds (0-1)
- String length limits

### 2. Rate Limiting

Multiple layers:

- Per-user rate limits
- Per-device rate limits
- Global API rate limiting

### 3. Data Privacy

- Incident data expires after 24 hours
- Reputation data expires after 90 days
- No PII stored in Redis

### 4. Admin Endpoints

Ban/unban endpoints should be protected with:

- Authentication middleware
- Role-based access control (RBAC)
- Audit logging

### 5. Redis Security

- Use Redis AUTH in production
- Enable TLS for Redis connections
- Restrict Redis network access

## Performance

### Redis Operations

- **GEORADIUS:** O(N+log(M)) where N = results, M = total items
- **HGET/HSET:** O(1)
- **ZADD/ZRANGE:** O(log(N))

### Optimization Tips

1. Use Redis pipelining for batch operations
2. Set appropriate TTLs to limit memory usage
3. Monitor Redis memory with `INFO memory`
4. Use Redis Cluster for horizontal scaling

### Expected Load

- **Incidents per second:** 10-100
- **Redis memory per incident:** ~2KB
- **24-hour retention:** ~17MB per 10K incidents

## Monitoring

### Key Metrics

1. **Validation Rate**
   - % of incidents that reach consensus
   - Target: 20-30% (indicates genuine emergencies)

2. **False Positive Rate**
   - % of validated incidents that were false alarms
   - Target: <5%

3. **Response Time**
   - Time to calculate validation
   - Target: <100ms

4. **Redis Health**
   - Connection status
   - Memory usage
   - Command latency

### Logging

All operations are logged with structured data:

```typescript
logger.info('Incident validation completed', {
  incidentId,
  nearbyCount,
  validationScore,
  consensusReached,
});
```

## Troubleshooting

### Issue: No nearby incidents found

**Cause:** GPS coordinates may be inaccurate or radius too small

**Solution:**

- Increase `radiusMeters` in config
- Check GPS accuracy values
- Verify Redis GEORADIUS is working

### Issue: Rate limit errors

**Cause:** User exceeding rate limits

**Solution:**

- Check user reputation
- Verify rate limit counters in Redis
- Adjust limits if needed

### Issue: Redis connection errors

**Cause:** Redis not running or connection issues

**Solution:**

- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL environment variable
- Check network connectivity

### Issue: Validation score always low

**Cause:** Incidents too far apart in time/space

**Solution:**

- Increase `timeWindowSeconds`
- Increase `radiusMeters`
- Check incident timestamps

## Future Enhancements

1. **Machine Learning**
   - Train model on validated incidents
   - Improve confidence scoring
   - Detect anomalous patterns

2. **Geofencing**
   - Define high-risk areas
   - Adjust thresholds by location
   - Historical incident mapping

3. **Real-time Notifications**
   - WebSocket updates for nearby incidents
   - Push notifications to nearby users
   - Live validation status

4. **Advanced Analytics**
   - Incident heatmaps
   - Temporal patterns
   - User behavior analysis

5. **Blockchain Integration**
   - Immutable incident records
   - Decentralized consensus
   - Cryptographic verification

## References

- Redis Geospatial Commands: https://redis.io/commands/georadius
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
- Sybil Attack Prevention: https://en.wikipedia.org/wiki/Sybil_attack
