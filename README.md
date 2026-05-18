# SilentSiren AI

**🎉 Production-Ready Emergency Response Platform with Multimodal AI**

SilentSiren AI is a complete emergency detection and response system that uses passive audio monitoring, AI-powered threat analysis, community validation, and automated alert dispatch to protect users in distress.

**✅ All 8 Development Phases Complete - Production Ready**

## 🏗️ Architecture

This is a production-grade monorepo containing:

- **Frontend**: Next.js 16 with App Router, TypeScript, and Tailwind CSS
- **Backend**: Express.js with TypeScript, JWT auth, RBAC, and comprehensive security
- **AI Service**: Google Gemini 1.5 Flash (via OpenRouter Fallback Mesh)
- **Shared Packages**: Types, configuration, and logging utilities
- **Database**: PostgreSQL 16 with Redis 7 caching
- **Deployment**: Docker + Railway + Vercel with CI/CD

## 🚀 Google Antigravity Hackathon Implementation

SilentSiren AI has been evolved into an **Agentic Crisis Management Engine** meeting all hackathon requirements:

### 1. Advanced Multi-Agent Workflow
- **Multi-Source Input**: `SignalFusionAgent` aggregates data from ambient voice, GPS coordinates, simulated weather APIs, and traffic/sensor data.
- **Detected Crisis**: `CrisisVerificationAgent` and `SeverityPredictionAgent` analyze fused signals to confirm incidents and predict spatial-temporal impact (severity, radius).
- **Action Planning**: `ResourceAllocationAgent` optimizes the dispatch of emergency units (ambulances, police) and `RecoveryAgent` drafts infrastructure restoration plans.
- **Simulated Response**: `SimulationAgent` evaluates the "before vs. after" states of the incident, providing response improvement metrics (e.g., 65% faster response time).
- **Outcome**: The `CrisisOrchestrator` centralizes the multi-agent results into a unified outcome sent to the dashboard in real-time.

### 2. Agent Trace / Logs (Antigravity Trace)
A dedicated `TraceService` captures the full reasoning chain of the AI models:
- **Reasoning Steps**: Agent "Thoughts" (e.g., "Analyzing incoming audio transcript for distress indicators").
- **Agent Decisions**: Agent "Actions" and "Observations" (e.g., "Fusing multi-modal signals: Confidence 0.88").
- **Action Execution**: Agent "Conclusions" (e.g., "Allocated 3 units to incident location").
*These are visualized live on the frontend Dashboard via the `TraceTimeline` component.*

### 3. Documentation Requirements
- **System Architecture**: Centralized Orchestrator Pattern. A main `CrisisOrchestrator` delegates tasks to specialized agents (SignalFusion, SeverityPrediction, Allocation, etc.), waiting for their JSON-structured output.
- **Antigravity Usage**: The multi-agent workflow acts as the "brain" of the Command Center, transforming unstructured crisis data (voice panics, weather anomalies) into structured, actionable response plans.
- **Tools/APIs Used**: 
  - **OpenRouter (Gemini 1.5 Flash, Claude 3, DeepSeek)**: Used as the core AI reasoning mesh with automatic fallbacks.
  - **PositionStack (Geocoding)**: Translates raw GPS into actionable street addresses.
  - **Twilio Voice & SMS**: Automated emergency dispatch.
  - **Google Maps JS API**: Real-time incident visualization.
- **Assumptions**: 
  - Real-world sensor APIs (weather, traffic) are mocked via `fusion.service.ts` for demo purposes.
  - Simulated units (ambulances, police) act instantly within the simulation logic.


## 📁 Project Structure

```
silentsiren-ai/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   └── lib/       # API client and utilities
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/           # Express API server
│       ├── src/
│       │   ├── routes/    # API routes
│       │   ├── middleware/# Auth, security, logging
│       │   └── index.ts   # Server entry point
│       ├── Dockerfile
│       └── package.json
├── packages/
│   ├── shared-types/      # TypeScript type definitions
│   ├── config/            # Environment validation
│   └── logger/            # Structured logging (Pino)
├── docker-compose.yml     # Local development setup
├── .env.example           # Environment variables template
└── package.json           # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)
- PostgreSQL 16 (if not using Docker)
- Redis 7 (if not using Docker)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd SilentSiren-AI
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_min_32_chars
```

4. **Start with Docker (Recommended)**

```bash
npm run docker:up
```

This starts:

- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 3000

5. **Or start manually**

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

6. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build            # Build all workspaces
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Code Quality
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking

# Docker
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers

# Cleanup
npm run clean            # Remove all build artifacts
```

### Workspace Commands

Run commands in specific workspaces:

```bash
npm run dev --workspace=apps/frontend
npm run build --workspace=packages/shared-types
npm run type-check --workspace=apps/backend
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevent abuse
- **JWT Authentication**: Secure user sessions
- **Input Validation**: Zod schema validation
- **CORS**: Configured for production
- **Encryption**: Sensitive data encryption
- **Security Middleware**: XSS, CSRF protection

## 📊 Logging

Structured logging with Pino:

```typescript
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('service-name');
logger.info({ userId: '123' }, 'User action');
logger.error({ error }, 'Operation failed');
```

## 🧪 Testing

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## 🚢 Deployment

### Railway Deployment

1. **Install Railway CLI**

```bash
npm i -g @railway/cli
```

2. **Login to Railway**

```bash
railway login
```

3. **Create new project**

```bash
railway init
```

4. **Add services**

```bash
# Add PostgreSQL
railway add --database postgres

# Add Redis
railway add --database redis
```

5. **Set environment variables**

```bash
railway variables set GEMINI_API_KEY=your_key
railway variables set JWT_SECRET=your_secret
railway variables set ENCRYPTION_KEY=your_key
```

6. **Deploy**

```bash
railway up
```

### Docker Production Build

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔑 Environment Variables

| Variable              | Description                          | Required |
| --------------------- | ------------------------------------ | -------- |
| `NODE_ENV`            | Environment (development/production) | Yes      |
| `PORT`                | Backend server port                  | Yes      |
| `DATABASE_URL`        | PostgreSQL connection string         | Yes      |
| `REDIS_URL`           | Redis connection string              | Yes      |
| `GEMINI_API_KEY`      | Google Gemini API key                | Yes      |
| `JWT_SECRET`          | JWT signing secret (min 32 chars)    | Yes      |
| `ENCRYPTION_KEY`      | Data encryption key (min 32 chars)   | Yes      |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID                   | No       |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token                    | No       |
| `TWILIO_PHONE_NUMBER` | Twilio phone number                  | No       |

## 📦 Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Axios
- Zustand

### Backend

- Node.js 20
- Express.js
- TypeScript
- PostgreSQL
- Redis
- Pino (logging)
- Helmet (security)
- JWT authentication

### AI & Services

- Google Gemini 1.5 Flash
- Twilio SMS
- Web Audio API
- MediaRecorder API

### DevOps

- Docker & Docker Compose
- Railway
- GitHub Actions (CI/CD)
- Husky (Git hooks)
- ESLint & Prettier

## 🎯 Roadmap

- [x] **Phase 1**: System Architecture & Monorepo Foundation ✅
- [x] **Phase 2**: Voice Detection Engine ✅
- [x] **Phase 3**: Gemini AI Intent & Distress Reasoning ✅
- [x] **Phase 4**: Safety Countdown & Biometric Verification ✅
- [x] **Phase 5**: Trusted Contacts & GPS Routing ✅
- [x] **Phase 6**: Community Validator & Cross-Verification ✅
- [x] **Phase 7**: Security, Abuse Prevention & Threat Hardening ✅
- [x] **Phase 8**: Final Production Deployment & Observability ✅

**🚀 Project Status: Production Ready (100% Complete)**

## 📚 Documentation

- **[Complete Project Overview](PROJECT_COMPLETE.md)** - Full project summary
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Railway, Vercel, Docker deployment
- **[Security Guide](docs/SECURITY.md)** - Authentication, encryption, RBAC
- **[Community Validator](docs/COMMUNITY_VALIDATOR.md)** - GPS clustering, consensus validation
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, testing, contributing

### Phase Documentation

- [Phase 1 Summary](PHASE_1_SUMMARY.md) - Architecture & Foundation
- [Phase 2 Summary](PHASE_2_SUMMARY.md) - Voice Detection
- [Phase 3 Summary](PHASE_3_SUMMARY.md) - AI Reasoning
- [Phase 4 Summary](PHASE_4_SUMMARY.md) - Safety Countdown
- [Phase 5 Summary](PHASE_5_SUMMARY.md) - Emergency Dispatch
- [Phase 6 Summary](PHASE_6_SUMMARY.md) - Community Validation
- [Phase 7 Summary](PHASE_7_SUMMARY.md) - Security & Hardening
- [Phase 8 Summary](PHASE_8_SUMMARY.md) - Production Deployment

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the maintainers for contribution guidelines.

## 📧 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for emergency response and safety**
