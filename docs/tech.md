# Tech Reference

> Maintained by `/architect`. Stack decisions, infrastructure, environment setup, and API contracts.

## Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 22 | Backend runtime |
| Language | TypeScript | 5.x | Type safety across backend and frontend |
| Package Manager | pnpm | 10.8.0 | Monorepo dependency management |
| API | GraphQL Yoga | — | GraphQL server |
| ORM | Drizzle ORM | 0.42.0 | Type-safe SQL, schema-as-code |
| Database | PostgreSQL | 16 | Primary data store |
| Auth | JOSE + Argon2 | — | JWT signing/verification + password hashing |
| Validation | Zod | 3.24.4 | Input validation in services |
| Frontend | React Native + Expo | RN 0.76, Expo 52 | Cross-platform mobile + web |
| Routing | Expo Router | 4.x | File-based navigation |
| Styling | NativeWind | 4.1.23 | Tailwind CSS for React Native |
| State | Zustand | 4.4.7 | Client-side state management |
| GraphQL Client | urql | 4.2.2 | Lightweight GraphQL client with auth exchange |
| Animation | react-native-reanimated | 3.16.1 | Native animations |
| Secure Storage | expo-secure-store | 15.x | Token persistence on native |

## Infrastructure

### Local Development

```
Docker Compose → PostgreSQL 16 (port 5432)
Backend        → Express + GraphQL Yoga (port 4000)
Frontend       → Expo dev server (port 8081)
```

- **Database:** PostgreSQL 16 (Alpine) via Docker Compose. Credentials: `postgres/postgres`, database: `event_queue`
- **Backend:** Runs with `ts-node-dev` for hot reload. Entry: `backend/src/index.ts`
- **Frontend:** Expo dev server. Supports iOS simulator, Android emulator, and web browser

### Dev Commands (Makefile)

| Command | Action |
|---------|--------|
| `make up-d` | Start Docker services (detached) |
| `make down` | Stop Docker services |
| `make logs` | Tail Docker logs |
| `make start-rn` | Start Expo dev server |
| `make dev-rn` | Start Expo with tunnel |
| `make clean-rn` | Clean RN caches |

### Database Management

- Schema defined in `backend/src/db/schema.ts` (Drizzle)
- Push schema changes: `npx drizzle-kit push`
- Config: `backend/drizzle.config.ts` — reads `DATABASE_URL` from env, defaults to `postgres://postgres:postgres@localhost:5432/event_queue`

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | JOSE JWT signing secret (if used; currently derives from env) |

## API Architecture

### GraphQL Endpoint

`POST /graphql` — single endpoint for all queries and mutations. GraphiQL available in development.

### Authentication Flow

1. Client sends `signIn` or `signUp` mutation → receives JWT token
2. Client stores token in SecureStore (native) / localStorage (web)
3. All subsequent requests include `Authorization: Bearer <token>` header
4. Server middleware extracts token, verifies with JOSE, loads user into GraphQL context
5. Handlers check `context.user` for auth-required operations

### Context Shape

```typescript
interface AppGraphQLContext {
    db: Database;
    services: { /* all service instances */ };
    user?: UserEntity | null;  // null = unauthenticated
}
```

Services are instantiated once at server start and injected via context. Repositories are constructor-injected into services.

### Custom Scalars

| Scalar | Serialization | Purpose |
|--------|--------------|---------|
| `DateTime` | ISO 8601 string | All timestamps |

### Enums

| Enum | Values | Usage |
|------|--------|-------|
| `EventStatus` | DRAFT, ACTIVE, FINISHED, CANCELLED | Event lifecycle |
| `UserRole` | MANAGER, PROMOTER, HOST | Event team roles |
| `CheckInStatus` | PENDING, COMPLETED | Guest check-in state |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| GraphQL over REST | Single endpoint, client-driven queries, good for mobile where bandwidth matters |
| urql over Apollo Client | Smaller bundle, first-party RN offline support, cleaner Expo compatibility |
| Drizzle over Prisma | Type-safe SQL without heavy codegen, schema-as-code, faster runtime |
| Zustand over Redux | Minimal boilerplate, works well with React Native, easy SecureStore integration |
| NativeWind over StyleSheet | Tailwind utility classes, consistent with web patterns, rapid iteration |
| JOSE over jsonwebtoken | Edge-compatible, modern, smaller. jsonwebtoken is also installed but JOSE is primary for JWT |
| CUID2 for IDs | Collision-resistant, URL-safe, sortable, no sequential guessing |
| Soft delete | Events are never hard-deleted; preserves data for analytics and audit |
| Lazy auto-close | Events transition to FINISHED on read when past endDate, no background job needed for MVP |
