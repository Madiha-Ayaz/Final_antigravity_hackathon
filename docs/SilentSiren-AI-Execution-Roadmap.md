# SilentSiren AI – Deep Execution Prompt Roadmap

This document contains a professional multi-phase execution roadmap for building the SilentSiren AI emergency-response platform using CLI-based AI coding agents such as Claude Code, Gemini CLI, Cursor Agent, OpenAI Codex CLI, or Qwen Code.

Each phase includes:

- Clear engineering goals
- Professional architecture objectives
- Deep implementation tasks
- Ready-to-use AI CLI prompts
- Expected output after completion

---

# Phase 1 – System Architecture & Monorepo Foundation

## Primary Goal

Create the production-grade project structure and engineering foundation.

## Deep Tasks

- Setup monorepo with frontend, backend, AI services, shared types, and docs.
- Configure Docker, environment variables, ESLint, TypeScript, Prettier, Husky, and Git hooks.
- Design scalable architecture for real-time audio streaming and AI inference.
- Prepare Railway-ready deployment configuration.

## CLI AI Prompt

You are a Senior Staff Software Architect.

Build a production-grade monorepo architecture for a project called “SilentSiren AI”.

### Tech Stack

- Frontend: Next.js 16 App Router + Tailwind CSS + TypeScript
- Backend: Node.js + Express + TypeScript
- AI Layer: Gemini 1.5 Flash multimodal audio reasoning service
- Database: PostgreSQL
- Deployment: Railway + Docker
- Realtime Audio APIs: MediaRecorder API + Web Audio API

### Requirements

1. Create clean folder structure.
2. Setup shared types package.
3. Add scalable API architecture.
4. Create Docker setup for all services.
5. Add environment variable validation.
6. Add structured logging.
7. Add security middleware.
8. Generate README with setup instructions.
9. Prepare for future microservice scaling.
10. Output clean production-ready code only.

Do NOT generate placeholder pseudocode.
Generate complete working setup.

---

# Phase 2 – Voice Detection Engine

## Primary Goal

Build the low-latency passive listening and trigger engine.

## Deep Tasks

- Implement passive audio listening using Web Audio API.
- Create wake phrase detection logic.
- Buffer recent audio in memory.
- Optimize browser performance and battery consumption.

## CLI AI Prompt

You are an Expert Audio Systems Engineer.

Build the complete frontend audio monitoring engine for SilentSiren AI.

### Requirements

1. Use Web Audio API.
2. Use MediaRecorder API.
3. Implement low-overhead continuous passive listening.
4. Maintain rolling 15-second encrypted audio buffer.
5. Detect emergency wake phrases:
   - “Help me”
   - “Emergency”
   - “Call police”

6. Add noise suppression.
7. Prevent unnecessary CPU usage.
8. Build reusable React hooks.
9. Ensure mobile browser compatibility.
10. Create modular TypeScript architecture.

Generate complete production-grade code.

---

# Phase 3 – Gemini AI Intent & Distress Reasoning

## Primary Goal

Implement multimodal AI reasoning pipeline.

## Deep Tasks

- Send audio clips to Gemini.
- Analyze emotional stress signals.
- Generate confidence scoring.
- Create JSON-safe response contracts.

## CLI AI Prompt

You are a Multimodal AI Systems Engineer.

Build the AI reasoning pipeline for SilentSiren AI using Gemini 1.5 Flash.

### Requirements

1. Accept uploaded audio clips.
2. Analyze:
   - screams
   - panic
   - impact sounds
   - emotional stress
   - breathing patterns

3. Ignore:
   - TV noise
   - music
   - jokes
   - casual conversation

4. Return structured JSON:

```json
{
  "confidence": number,
  "threatLevel": "LOW|MEDIUM|HIGH",
  "reasoning": "",
  "dispatchRecommended": boolean
}
```

5. Add prompt-injection defense.
6. Add hallucination safeguards.
7. Add retry handling.
8. Add logging and observability.
9. Make output deterministic.

Generate complete backend service code.

---

# Phase 4 – Safety Countdown & Biometric Verification

## Primary Goal

Create human-in-the-loop cancellation security layer.

## Deep Tasks

- Create 10-second emergency countdown UI.
- Add biometric unlock verification.
- Cancel false alarms safely.
- Create high-visibility emergency interface.

## CLI AI Prompt

You are a Senior Frontend Security Engineer.

Build the emergency verification workflow for SilentSiren AI.

### Requirements

1. Show full-screen emergency countdown modal.
2. Countdown duration = 10 seconds.
3. Add “I Am Safe” cancel flow.
4. Integrate browser-supported biometric/passcode verification.
5. Add emergency vibration + sound feedback.
6. Ensure accessibility compliance.
7. Prevent accidental dismissals.
8. Build polished mobile-first UI.
9. Use Tailwind CSS + Framer Motion.
10. Create reusable React components.

Generate complete frontend implementation.

---

# Phase 5 – Trusted Contacts & GPS Routing

## Primary Goal

Deliver verified emergency alerts to trusted contacts.

## Deep Tasks

- Integrate Twilio SMS.
- Send GPS coordinates.
- Attach audio evidence.
- Build emergency escalation workflow.

## CLI AI Prompt

You are a Backend Communications Engineer.

Build the emergency dispatch pipeline for SilentSiren AI.

### Requirements

1. Integrate Twilio SMS APIs.
2. Send alerts to 3 trusted contacts.
3. Attach:
   - GPS coordinates
   - timestamp
   - threat level
   - audio clip link

4. Add retry handling.
5. Add queue-based processing.
6. Prevent duplicate dispatches.
7. Add rate limiting.
8. Add delivery logs.
9. Encrypt sensitive user data.
10. Generate production-ready Express APIs.

Output complete implementation.

---

# Phase 6 – Community Validator & Cross-Verification

## Primary Goal

Implement decentralized consensus-based emergency validation.

## Deep Tasks

- Detect nearby simultaneous incidents.
- Compare GPS radius clusters.
- Cross-check audio stress patterns.
- Auto-confirm verified emergencies.

## CLI AI Prompt

You are a Distributed Systems Engineer.

Build the Community Validator system for SilentSiren AI.

### Requirements

1. Detect multiple emergency triggers in same GPS radius.
2. Compare timestamps.
3. Compare AI confidence scores.
4. Validate overlapping distress patterns.
5. Auto-confirm emergency if consensus threshold reached.
6. Add anti-spam protections.
7. Prevent Sybil attacks.
8. Build scalable geospatial architecture.
9. Add Redis caching.
10. Generate scalable backend implementation.

Generate complete architecture and code.

---

# Phase 7 – Security, Abuse Prevention & Threat Hardening

## Primary Goal

Protect platform from misuse and attacks.

## Deep Tasks

- Implement OTP verification.
- Blacklist malicious users.
- Add abuse analytics.
- Create defense-in-depth security.

## CLI AI Prompt

You are a Cybersecurity Architect.

Build the security and abuse-prevention layer for SilentSiren AI.

### Requirements

1. OTP verification via phone.
2. Device fingerprinting.
3. Temporary blacklist system.
4. Abuse scoring engine.
5. AI false-trigger analytics.
6. Add JWT authentication.
7. Add RBAC roles.
8. Add encrypted secrets handling.
9. Prevent replay attacks.
10. Generate enterprise-grade security architecture.

Generate complete implementation.

---

# Phase 8 – Final Production Deployment & Observability

## Primary Goal

Deploy scalable production MVP.

## Deep Tasks

- Deploy frontend and backend.
- Configure monitoring.
- Add CI/CD.
- Prepare demo-ready environment.

## CLI AI Prompt

You are a DevOps and Platform Reliability Engineer.

Deploy SilentSiren AI into production.

### Requirements

1. Deploy frontend to Vercel.
2. Deploy backend to Railway.
3. Configure PostgreSQL.
4. Configure Docker production builds.
5. Add GitHub Actions CI/CD.
6. Add uptime monitoring.
7. Add structured logs.
8. Add API health checks.
9. Add environment separation.
10. Generate deployment documentation.

Generate complete deployment pipeline and configuration.
