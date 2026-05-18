# Development Guide

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js 20+ (use `nvm` for version management)
- npm 10+
- Docker Desktop (for local development)
- Git
- VS Code (recommended) or your preferred IDE

### Initial Setup

1. **Clone and install**

```bash
git clone <repository-url>
cd SilentSiren-AI
npm install
```

2. **Setup environment**

```bash
cp .env.example .env
```

Edit `.env` with your credentials.

3. **Start development environment**

```bash
npm run docker:up
npm run dev
```

## Project Structure

### Monorepo Organization

```
silentsiren-ai/
├── apps/              # Applications
│   ├── frontend/      # Next.js app
│   └── backend/       # Express API
├── packages/          # Shared packages
│   ├── shared-types/  # TypeScript types
│   ├── config/        # Configuration
│   └── logger/        # Logging utility
└── docs/              # Documentation
```

### Adding New Packages

Create a new package:

```bash
mkdir -p packages/new-package/src
cd packages/new-package
npm init -y
```

Update `package.json`:

```json
{
  "name": "@silentsiren/new-package",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

Add to root `package.json` workspaces if needed.

## Code Style

### TypeScript

- Use strict mode
- Avoid `any` type
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Export types from `@silentsiren/shared-types`

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Components**: PascalCase (`EmergencyButton.tsx`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`User`, `APIResponse`)

### Code Organization

```typescript
// 1. Imports (grouped and sorted)
import { external } from 'external-package';
import { internal } from '@silentsiren/shared-types';
import { relative } from './relative-path';

// 2. Types/Interfaces
interface UserData {
  id: string;
  name: string;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main code
export function processUser(data: UserData) {
  // implementation
}
```

## Testing

### Unit Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Writing Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { processUser } from './user-service';

describe('processUser', () => {
  it('should process user data correctly', () => {
    const result = processUser({ id: '1', name: 'Test' });
    expect(result).toBeDefined();
  });
});
```

## Debugging

### Backend Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev:backend"],
  "skipFiles": ["<node_internals>/**"]
}
```

### Frontend Debugging

Use React DevTools and Next.js built-in debugging.

### Logging

```typescript
import { createLogger } from '@silentsiren/logger';

const logger = createLogger('my-service');

logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Operation failed');
logger.debug({ data }, 'Debug info');
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commits:

```
feat: add user authentication
fix: resolve memory leak in audio buffer
docs: update API documentation
refactor: simplify error handling
test: add unit tests for user service
```

### Pre-commit Hooks

Husky runs automatically:

- Prettier formatting
- ESLint linting
- TypeScript type checking

## Common Tasks

### Adding a New API Endpoint

1. Create route file in `apps/backend/src/routes/`
2. Add route to `apps/backend/src/routes/index.ts`
3. Add types to `packages/shared-types/src/index.ts`
4. Update API documentation in `docs/API.md`

### Adding a New Frontend Page

1. Create page in `apps/frontend/src/app/`
2. Add route in Next.js App Router
3. Create components in `apps/frontend/src/components/`
4. Add API calls in `apps/frontend/src/lib/api.ts`

### Updating Shared Types

1. Edit `packages/shared-types/src/index.ts`
2. Run `npm run build --workspace=packages/shared-types`
3. Types are automatically available in all workspaces

## Performance

### Backend Optimization

- Use Redis caching for frequent queries
- Implement database connection pooling
- Add request compression
- Use rate limiting

### Frontend Optimization

- Use Next.js Image component
- Implement code splitting
- Use React.memo for expensive components
- Lazy load heavy components

## Security

### Best Practices

- Never commit secrets to git
- Use environment variables
- Validate all user input
- Sanitize database queries
- Use HTTPS in production
- Implement rate limiting
- Add CSRF protection

### Security Checklist

- [ ] Environment variables configured
- [ ] JWT secret is strong (32+ chars)
- [ ] Database credentials are secure
- [ ] API endpoints have authentication
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Security headers are set

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Docker issues:**

```bash
docker-compose down -v
docker system prune -a
npm run docker:up
```

**Type errors:**

```bash
npm run clean
npm install
npm run build
```

**Module not found:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [Gemini API Docs](https://ai.google.dev/docs)
