# Project Context

A REST API built with Fastify, TypeScript, Prisma ORM, and PostgreSQL. Code quality enforced by Biome.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Fastify
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma + PostgreSQL
- **Validation**: Zod + `fastify-type-provider-zod`
- **Linter/Formatter**: Biome
- **Test**: Vitest

---

## Project Structure

```
src/
├── app.ts              # Fastify instance setup, plugins registration
├── index.ts           # Entry point (listen)
├── config/
│   └── env.ts          # Env vars validation (e.g. with @fastify/env or zod)
├── modules/
│   └── [feature]/
│       ├── route.ts    # Fastify route definitions
│       ├── schema.ts   # JSON Schema or Zod schemas for validation
│       ├── service.ts  # Business logic
│       └── repository.ts # Prisma queries
├── plugins/
│   └── prisma.ts       # Prisma client as Fastify plugin/decorator
├── types/
│   └── index.d.ts      # Global type augmentations
prisma/
├── schema.prisma
├── migrations/
tests/
└── [feature]/
    └── *.test.ts
```

---

## Commands

```bash
# Dev
npm run dev           # Start with tsx watch

# Build & Start
npm run build         # tsc
npm start             # node dist/server.js

# Database
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply migrations in production
npx prisma generate           # Regenerate Prisma client
npx prisma studio             # Open Prisma Studio

# Lint & Format (Biome)
npx biome check .             # Lint + format check
npx biome check --write .     # Auto-fix

# Tests
npm test              # vitest run
npm run test:watch    # vitest
```

---

## Code Style

- Use **ESM** (`import/export`), never CommonJS (`require`)
- Always use **TypeScript strict mode** — no `any`, no `@ts-ignore` without comment
- Prefer **explicit return types** on all functions and route handlers
- Use **async/await**, never raw `.then()/.catch()`
- Never use `try/catch` inside route handlers — use Fastify's built-in error handling (`reply.send(error)` or custom error classes)
- Use **Zod** for all request/response validation — never use raw JSON Schema
- All Prisma queries go in `repository.ts` files — never in routes or services directly
- Services must be pure business logic, no HTTP concerns (no `request`/`reply`)

---

## Fastify Conventions

- Register all plugins in `app.ts` using `fastify.register()`
- Use `fastify.decorate()` to expose Prisma client: `fastify.prisma`
- Define routes with full schema (body, params, querystring, response) for auto-validation and Swagger
- Use `preHandler` hooks for auth, never inline logic in routes
- Return data from handlers — do **not** call `reply.send()` unless needed for streaming

---

## Swagger Documentation

**Every route must be documented with Swagger.** Use `@fastify/swagger` + `@fastify/swagger-ui`.

Rules:
- Every route must have a `tags`, `summary`, and `description` in its schema
- Every `body`, `params`, `querystring`, and `response` must be defined (use Zod schemas)
- Always document all possible response codes (`200`, `201`, `400`, `404`, `409`, etc.)
- Never leave a route without a response schema — it prevents Swagger from generating the output type

```typescript
fastify.withTypeProvider<ZodTypeProvider>().post('/users', {
  schema: {
    tags: ['Users'],
    summary: 'Create a new user',
    description: 'Registers a new user account.',
    body: createUserBody,
    response: {
      201: createUserResponse,
      409: z.object({ message: z.string() }),
    },
  },
}, async (request) => {
  return userService.create(request.body)
})
```

### Zod Validation with `fastify-type-provider-zod`

`validatorCompiler` and `serializerCompiler` are set globally in `app.ts`.

Define schemas in `schema.ts` using Zod, then type routes with `ZodTypeProvider`:

```typescript
import { z } from 'zod'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

// schema.ts
export const createUserBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
})

export const createUserResponse = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

// route.ts
fastify.withTypeProvider<ZodTypeProvider>().post('/users', {
  schema: {
    tags: ['Users'],
    summary: 'Create a new user',
    description: 'Registers a new user account.',
    body: createUserBody,
    response: {
      201: createUserResponse,
      409: z.object({ message: z.string() }),
    },
  },
}, async (request) => {
  return userService.create(request.body) // fully typed
})
```

---

## Prisma Conventions

- Always use `select` or `include` explicitly — never return full model by default
- Use transactions (`prisma.$transaction`) for multi-step operations
- Never expose Prisma errors directly to the client — map them to HTTP errors
- Keep `schema.prisma` clean: one model per table, explicit `@@map` for table names

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

---

## Error Handling

- Use a custom error class extending `Error` with a `statusCode` field
- Register a global `setErrorHandler` in `app.ts`
- Map Prisma errors (`P2002` unique constraint, `P2025` not found, etc.) to proper HTTP codes

```typescript
// Prisma P2025 → 404
// Prisma P2002 → 409 Conflict
```

---

## Environment Variables

Required variables (validated at startup):

```env
POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/dbname
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
```

- Never hardcode secrets — always read from `process.env`
- Validate all env vars at startup with a schema (fail fast)

---

## Testing Guidelines

- Use **Vitest** for unit and integration tests
- Use `fastify.inject()` for route tests — no need for a real HTTP server
- Use a separate test database or reset with `prisma migrate reset` in CI
- Mock Prisma client in unit tests using `vitest.mock` or `prisma-mock`
- Test filenames: `*.test.ts` colocated with feature or in `/tests`

---

## SOLID Principles

- **S — Single Responsibility**: Each file/class/function has one reason to change. Routes handle HTTP, services handle business logic, repositories handle data access — never mix them.
- **O — Open/Closed**: Extend behavior via new modules or plugins, not by modifying existing stable code. Use Fastify plugins and decorators to add capabilities.
- **L — Liskov Substitution**: Abstractions (interfaces, types) must be respected by all implementations. A repository implementation must satisfy its interface contract fully.
- **I — Interface Segregation**: Define narrow, focused types and interfaces. Don't force a service to depend on methods it doesn't use — split large interfaces into smaller ones.
- **D — Dependency Inversion**: High-level modules (services) must not depend on low-level modules (Prisma, pg). Depend on abstractions. Pass dependencies via function parameters or plugin injection, not hardcoded imports where avoidable.

---

## Workflow Rules

- Always run `npx biome check --write .` before committing
- Always run `npx prisma generate` after modifying `schema.prisma`
- Typecheck after a series of changes: `npx tsc --noEmit`
- Prefer running a single test file over the whole suite during development
- When adding a new feature, follow the order: schema → repository → service → route → test