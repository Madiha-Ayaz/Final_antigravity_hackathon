# Railway Configuration

This document explains how to deploy SilentSiren AI to Railway.

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed
- GitHub repository connected to Railway

## Services Setup

### 1. PostgreSQL Database

```bash
railway add --database postgres
```

This creates a PostgreSQL instance and automatically sets `DATABASE_URL`.

### 2. Redis Cache

```bash
railway add --database redis
```

This creates a Redis instance and automatically sets `REDIS_URL`.

### 3. Backend Service

Create a new service for the backend:

```bash
railway service create backend
```

Configure build settings:

- **Build Command**: `npm run build --workspace=apps/backend`
- **Start Command**: `npm run start --workspace=apps/backend`
- **Root Directory**: `/`
- **Dockerfile**: `apps/backend/Dockerfile`

### 4. Frontend Service

Create a new service for the frontend:

```bash
railway service create frontend
```

Configure build settings:

- **Build Command**: `npm run build --workspace=apps/frontend`
- **Start Command**: `npm run start --workspace=apps/frontend`
- **Root Directory**: `/`
- **Dockerfile**: `apps/frontend/Dockerfile`

## Environment Variables

Set these variables in Railway dashboard or via CLI:

### Backend Service

```bash
railway variables set NODE_ENV=production
railway variables set GEMINI_API_KEY=your_gemini_api_key
railway variables set JWT_SECRET=your_jwt_secret_min_32_chars
railway variables set ENCRYPTION_KEY=your_encryption_key_min_32_chars
railway variables set TWILIO_ACCOUNT_SID=your_twilio_sid
railway variables set TWILIO_AUTH_TOKEN=your_twilio_token
railway variables set TWILIO_PHONE_NUMBER=your_twilio_number
railway variables set LOG_LEVEL=info
```

### Frontend Service

```bash
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
railway variables set NEXT_PUBLIC_APP_URL=https://your-frontend-url.railway.app
```

## Deployment

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Railway
2. Enable automatic deployments
3. Push to main branch to trigger deployment

### Manual Deployment

```bash
railway up
```

## Health Checks

Railway will automatically monitor:

- Backend: `GET /health`
- Frontend: `GET /` (Next.js health)

## Scaling

Railway automatically scales based on:

- CPU usage
- Memory usage
- Request volume

Configure scaling in Railway dashboard:

- **Instances**: 1-10
- **Memory**: 512MB - 8GB
- **CPU**: Shared - Dedicated

## Monitoring

View logs in Railway dashboard:

```bash
railway logs
```

## Custom Domain

Add custom domain in Railway dashboard:

1. Go to service settings
2. Add custom domain
3. Configure DNS records
4. Enable SSL (automatic)

## Troubleshooting

### Build Failures

Check build logs:

```bash
railway logs --build
```

### Runtime Errors

Check runtime logs:

```bash
railway logs --runtime
```

### Database Connection Issues

Verify `DATABASE_URL` is set:

```bash
railway variables
```

## Cost Optimization

- Use shared CPU for development
- Enable auto-sleep for staging environments
- Monitor usage in Railway dashboard
- Set up billing alerts

## Backup Strategy

Railway automatically backs up PostgreSQL:

- Daily snapshots
- 7-day retention
- Point-in-time recovery

Manual backup:

```bash
railway db backup create
```

## CI/CD Pipeline

Railway integrates with GitHub Actions. See `.github/workflows/deploy.yml` for CI/CD configuration.
