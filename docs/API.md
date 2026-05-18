# API Documentation

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://your-backend.railway.app/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": string,
    "message": string,
    "details": object | null
  } | null,
  "timestamp": string
}
```

## Endpoints

### Health Check

**GET** `/health`

Check server health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

---

### Authentication

#### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "message": "Registration successful"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "userId": "uuid"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### User Management

#### Get Profile

**GET** `/api/user/profile`

Get current user profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "phoneNumber": "+1234567890",
    "trustedContacts": [],
    "isVerified": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Add Trusted Contact

**POST** `/api/user/trusted-contacts`

Add a trusted emergency contact.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "contactId": "uuid",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "priority": 1
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Emergency Management

#### Trigger Emergency

**POST** `/api/emergency/trigger`

Trigger an emergency event with audio analysis.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "audioBuffer": "base64_encoded_audio",
  "gpsCoordinates": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "status": "ANALYZING",
    "message": "Emergency event created, analyzing audio"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Rate Limit:** 10 requests per 15 minutes

#### Cancel Emergency

**POST** `/api/emergency/cancel/:eventId`

Cancel an active emergency event.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "status": "CANCELLED",
    "message": "Emergency event cancelled successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Codes

| Code                       | Description                             |
| -------------------------- | --------------------------------------- |
| `UNAUTHORIZED`             | Missing or invalid authentication token |
| `INVALID_TOKEN`            | JWT token is invalid or expired         |
| `RATE_LIMIT_EXCEEDED`      | Too many requests                       |
| `NOT_FOUND`                | Resource not found                      |
| `VALIDATION_ERROR`         | Request validation failed               |
| `INTERNAL_SERVER_ERROR`    | Unexpected server error                 |
| `REGISTRATION_FAILED`      | User registration failed                |
| `LOGIN_FAILED`             | User login failed                       |
| `EMERGENCY_TRIGGER_FAILED` | Emergency trigger failed                |
| `CANCELLATION_FAILED`      | Emergency cancellation failed           |

## Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Emergency endpoints**: 10 requests per 15 minutes

Rate limit headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1640000000
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
