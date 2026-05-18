# Production Deployment Guide

## Overview

This guide covers deploying SilentSiren AI to production using Railway for backend and Vercel for frontend.

---

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Railway CLI
- Vercel CLI
- Git
- PostgreSQL 16
- Redis 7

---

## Environment Setup

### 1. Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/silentsiren-ai.git
cd silentsiren-ai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your values
# Generate secrets:
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -hex 32  # For ENCRYPTION_KEY

# Start services
docker-compose up -d

# Run development server
npm run dev
```

### 2. Staging Environment

```bash
# Create staging branch
git checkout -b staging

# Deploy to Railway (staging)
railway up --environment staging

# Deploy frontend to Vercel (staging)
vercel --prod --scope staging
```

### 3. Production Environment

```bash
# Merge to main branch
git checkout main
git merge develop

# Push to trigger CI/CD
git push origin main

# Verify deployment
curl https://api.silentsiren.app/health
```

---

## Railway Deployment (Backend)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create New Project

```bash
railway init
railway link
```

### Step 3: Add Services

```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis
```

### Step 4: Configure Environment Variables

```bash
# Set via CLI
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=your_secret
railway variables set JWT_REFRESH_SECRET=your_secret
railway variables set ENCRYPTION_KEY=your_key
railway variables set GEMINI_API_KEY=your_key
railway variables set TWILIO_ACCOUNT_SID=your_sid
railway variables set TWILIO_AUTH_TOKEN=your_token
railway variables set TWILIO_PHONE_NUMBER=your_number

# Or use Railway dashboard
# https://railway.app/project/your-project/settings
```

### Step 5: Deploy

```bash
# Deploy backend
railway up

# Check logs
railway logs

# Get deployment URL
railway domain
```

### Step 6: Configure Custom Domain

```bash
# Add custom domain
railway domain add api.silentsiren.app

# Configure DNS
# Add CNAME record: api.silentsiren.app -> your-app.railway.app
```

---

## Vercel Deployment (Frontend)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 2: Configure Project

```bash
cd apps/frontend
vercel
```

### Step 3: Set Environment Variables

```bash
# Via CLI
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_APP_URL production

# Or via Vercel dashboard
# https://vercel.com/your-org/silentsiren-frontend/settings/environment-variables
```

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Check deployment
vercel ls
```

### Step 5: Configure Custom Domain

```bash
# Add domain via Vercel dashboard
# https://vercel.com/your-org/silentsiren-frontend/settings/domains

# Add DNS records:
# A record: @ -> 76.76.21.21
# CNAME: www -> cname.vercel-dns.com
```

---

## Docker Deployment

### Option 1: Docker Compose (Single Server)

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Option 2: Kubernetes (Scalable)

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n silentsiren
kubectl get services -n silentsiren

# View logs
kubectl logs -f deployment/backend -n silentsiren
```

---

## Database Setup

### PostgreSQL Migration

```bash
# Connect to database
psql $DATABASE_URL

# Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  location JSONB NOT NULL,
  ai_analysis JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_location ON emergency_incidents USING GIN (location);
CREATE INDEX idx_incidents_user ON emergency_incidents(user_id);
CREATE INDEX idx_incidents_created ON emergency_incidents(created_at);
```

### Redis Configuration

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Set configuration
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET save "900 1 300 10 60 10000"

# Verify
CONFIG GET maxmemory
INFO memory
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d api.silentsiren.app

# Auto-renewal
sudo certbot renew --dry-run
```

### Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full Strict)
4. Enable Always Use HTTPS
5. Enable Automatic HTTPS Rewrites
6. Configure Page Rules

---

## Monitoring Setup

### 1. Uptime Monitoring (UptimeRobot)

```bash
# Add monitors:
# - https://api.silentsiren.app/health (every 5 min)
# - https://silentsiren.app (every 5 min)

# Configure alerts:
# - Email notifications
# - Slack webhook
# - SMS alerts (critical only)
```

### 2. Error Tracking (Sentry)

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/nextjs

# Configure backend
# apps/backend/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

# Configure frontend
# apps/frontend/sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 3. Performance Monitoring

```bash
# Add New Relic
npm install newrelic

# Configure
# newrelic.js
exports.config = {
  app_name: ['SilentSiren AI'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  }
};
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. Runs linting and type checking
2. Runs security audit
3. Builds application
4. Runs tests with Redis
5. Builds Docker images
6. Deploys to staging (develop branch)
7. Deploys to production (main branch)
8. Runs health checks
9. Sends notifications

### Manual Deployment

```bash
# Trigger deployment manually
gh workflow run ci.yml

# Check workflow status
gh run list

# View logs
gh run view <run-id>
```

---

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20260512.sql

# Railway automatic backups
railway backup create
railway backup list
railway backup restore <backup-id>
```

### Redis Backup

```bash
# Manual backup
redis-cli -u $REDIS_URL SAVE

# Automated backup (redis.conf)
save 900 1
save 300 10
save 60 10000

# Restore
redis-cli -u $REDIS_URL --rdb /path/to/dump.rdb
```

---

## Scaling

### Horizontal Scaling

```bash
# Railway: Scale instances
railway scale --replicas 3

# Kubernetes: Scale deployment
kubectl scale deployment backend --replicas=3 -n silentsiren
```

### Vertical Scaling

```bash
# Railway: Upgrade plan
# Dashboard -> Settings -> Plan

# Kubernetes: Update resources
kubectl set resources deployment backend \
  --limits=cpu=2,memory=4Gi \
  --requests=cpu=1,memory=2Gi \
  -n silentsiren
```

### Database Scaling

```bash
# Read replicas
# Railway: Add read replica via dashboard

# Connection pooling
# Use PgBouncer
docker run -d \
  -e DATABASE_URL=$DATABASE_URL \
  -e POOL_MODE=transaction \
  -e MAX_CLIENT_CONN=100 \
  -p 6432:6432 \
  pgbouncer/pgbouncer
```

---

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database credentials rotated
- [ ] Redis password set
- [ ] Firewall rules configured
- [ ] DDoS protection enabled (Cloudflare)
- [ ] Regular security audits scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts configured
- [ ] Incident response plan documented

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
railway logs
docker logs silentsiren-backend-prod

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Redis connection failed
# - Port already in use

# Verify environment
railway variables
```

### Frontend Build Failing

```bash
# Check Vercel logs
vercel logs

# Common issues:
# - Missing NEXT_PUBLIC_ variables
# - Build timeout
# - Memory limit exceeded

# Increase build resources
# vercel.json
{
  "builds": [{
    "src": "package.json",
    "use": "@vercel/next",
    "config": {
      "maxLambdaSize": "50mb"
    }
  }]
}
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '5 minutes';
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -u $REDIS_URL ping

# Check memory
redis-cli -u $REDIS_URL INFO memory

# Clear cache if needed
redis-cli -u $REDIS_URL FLUSHDB
```

---

## Performance Optimization

### Backend

- Enable compression
- Use Redis caching
- Optimize database queries
- Use connection pooling
- Enable HTTP/2
- Implement CDN for static assets

### Frontend

- Enable Next.js Image Optimization
- Use dynamic imports
- Implement code splitting
- Enable SWR for data fetching
- Optimize bundle size
- Use Vercel Edge Network

### Database

- Add appropriate indexes
- Use query optimization
- Enable query caching
- Regular VACUUM and ANALYZE
- Monitor slow queries

---

## Maintenance

### Regular Tasks

**Daily:**

- Check error logs
- Monitor uptime
- Review security alerts

**Weekly:**

- Review performance metrics
- Check disk space
- Update dependencies

**Monthly:**

- Security audit
- Backup verification
- Cost optimization review
- Performance optimization

---

## Support & Resources

- Documentation: https://docs.silentsiren.app
- Status Page: https://status.silentsiren.app
- Support Email: support@silentsiren.app
- GitHub Issues: https://github.com/your-org/silentsiren-ai/issues
