# Coding Patterns & Conventions

> Maintained by `/architect`. Standards for the Event Queue codebase.

## Project Structure

```
backend/
  src/
    db/              — Drizzle schema and connection
    domain/          — Business logic services organized by feature
      <feature>/     — Feature directory (e.g., auth/)
        common/      — Shared utilities within the feature
    graphql/
      handlers/      — GraphQL handler functions organized by feature
        <feature>/   — One handler per query/mutation
      resolvers/     — Resolver maps wiring handlers to schema
      schema/        — GraphQL type definitions
    repositories/    — Data access layer (one per entity)

rn-app/
  app/
    (app)/           — Authenticated routes
    (auth)/          — Unauthenticated routes
  components/
    ui/              — Reusable UI primitives
  hooks/             — Custom React hooks
  lib/
    graphql/         — urql client, provider, operations
  stores/            — Zustand state stores
```

## Backend Patterns

### Repository Pattern
- One file per entity in `backend/src/repositories/`
- Exports a factory function or object with CRUD methods
- Uses Drizzle ORM query builder
- No business logic — only data access

### Service Pattern
- One file per use case in `backend/src/domain/<feature>/`
- Validates input with Zod schemas
- Calls repositories for data access
- Returns typed results
- Naming: `<action>.service.ts` (e.g., `signin.service.ts`)

### Handler Pattern
- One file per GraphQL operation in `backend/src/graphql/handlers/<feature>/`
- Receives GraphQL args and context
- Calls the appropriate service
- Returns GraphQL-typed response
- Naming: `<action>.handler.ts` (e.g., `signin.handler.ts`)

### Resolver Wiring
- `backend/src/graphql/resolvers/index.ts` maps operations to handlers
- Keep flat — no nested resolver objects unless needed for type resolution

## Frontend Patterns

### Store Pattern (Zustand)
- One file per domain in `rn-app/stores/`
- Naming: `<domain>.store.ts`
- Exports a `use<Domain>Store` hook
- Handles persistence where needed (SecureStore for sensitive data)

### Hook Pattern
- Custom hooks in `rn-app/hooks/`
- Naming: `use<Purpose>.ts`
- Encapsulate side effects and shared logic

### GraphQL Operations
- Organized by feature in `rn-app/lib/graphql/operations/`
- One file per feature: `<feature>.ts`
- Export named constants: `SIGN_IN_MUTATION`, `ME_QUERY`, etc.

### Routing
- Expo Router file-based routing
- `(auth)/` group for unauthenticated screens
- `(app)/` group for authenticated screens
- Auth gating via `useAuthGate` hook

## Naming Conventions
- Files: `kebab-case` for directories, `camelCase.ts` or `kebab-case.ts` for files (follow existing pattern in each area)
- Backend services: `<verb>.service.ts`
- Backend handlers: `<verb>.handler.ts`
- Frontend stores: `<domain>.store.ts`
- Frontend hooks: `use<PascalCase>.ts`
- GraphQL operations: `UPPER_SNAKE_CASE` constants

## Tech Stack
- Backend: Node.js, TypeScript, GraphQL Yoga, Drizzle ORM, PostgreSQL, JWT (JOSE + Argon2)
- Frontend: React Native, Expo, Expo Router, NativeWind, Zustand, urql
