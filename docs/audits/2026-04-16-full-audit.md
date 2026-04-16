# Full Project Audit — 2026-04-16

**Status:** In progress
**Design:** [docs/superpowers/specs/2026-04-16-full-audit-design.md](../superpowers/specs/2026-04-16-full-audit-design.md)
**Plan:** [docs/superpowers/plans/2026-04-16-full-audit.md](../superpowers/plans/2026-04-16-full-audit.md)

## Executive Summary

_Populated in Task 8 after all findings are collected._

- 🔴 Critical: —
- 🟡 Important: —
- 🟢 Nice-to-have: —

### Top takeaways

_Populated in Task 8._

## Findings

### Auth

| Severity | Area | Description | Location | Recommended action | Effort |
|----------|------|-------------|----------|--------------------|--------|
| 🔴 | Auth | Edge case 3: Token-expires-mid-session flow is broken — `didAuthError` in the urql auth exchange checks for `extensions.code === 'UNAUTHENTICATED'` but the backend never emits that code; expired tokens silently result in `user = null` in context, so protected resolvers return null/empty data instead of triggering a session clear and redirect | `rn-app/lib/graphql/client.ts:21` and `backend/src/index.ts:81` | Have protected resolvers (e.g. `myEvents`, `me`) throw a GraphQL error with `extensions: { code: 'UNAUTHENTICATED' }` when `context.user` is null, so the urql `didAuthError` check actually fires and triggers `clearAuth()` | M |
| 🟡 | Auth | Error 1: Duplicate-email error message wording diverges from spec — spec requires `"An account with this email already exists"`, but `signup.service.ts` throws `"${email} already registered"`, which surfaces verbatim in the Alert | `backend/src/domain/auth/signup.service.ts:43` | Change the thrown message to `"An account with this email already exists"` | S |
| 🟡 | Auth | Edge case 2: Client-side empty-form guard is a truthy check, not a proper validation — `!email` passes whitespace-only strings through to the server; no format or minimum-length validation exists on the client before submission | `rn-app/app/(auth)/sign-in.tsx:18` and `rn-app/app/(auth)/sign-up.tsx:19` | Trim input values and add basic client-side checks (valid email format, password min length) before calling the mutation, matching the server-side Zod schema constraints | S |
| 🟡 | Auth | Edge case 4: Network error message shown raw — urql's `CombinedError.message` for network failures is a technical string (e.g. `"[Network] Failed to fetch"`); shown as-is in an `Alert`, which is not user-friendly and diverges from the spec intent of a "network error message" | `rn-app/app/(auth)/sign-in.tsx:25` | Inspect `result.error.networkError` separately and display a human-readable message such as `"Network error — please check your connection and try again"` | S |
| 🟡 | Auth | Pattern: Repository pattern — concrete class exported as `default`, interface as named export; patterns.md documents "factory function or object with CRUD methods" but implementation uses a class; the default/named split also makes import ergonomics inconsistent with every other module in the codebase | `backend/src/repositories/user.repository.ts:17` | Either align with the documented "factory function" shape, or update patterns.md to say "class or factory function"; also consolidate to named exports | S |
| 🟡 | Auth | Pattern: Module-level side effect — `dotenv.config()` runs at import time in `jwt.service.ts`, which means any module that imports this file triggers environment loading as a hidden side effect; also calls `process.exit(1)` at module scope if `JWT_SECRET_STRING` is missing, making the module untestable in isolation | `backend/src/domain/auth/common/jwt.service.ts:5` | Refactor to accept a config/secret argument in the exported functions, or initialise via an explicit `init()` call driven by the app entry point; document the convention in patterns.md under Backend Patterns | M |
| 🟢 | Auth | New pattern: Utility services named as nouns (`password.service.ts`, `jwt.service.ts`) — patterns.md specifies `<action>.service.ts` (verb) for use-case services; these are shared helper utilities living in `common/`, not use-case services, so the naming convention doesn't map cleanly | `backend/src/domain/auth/common/password.service.ts` and `backend/src/domain/auth/common/jwt.service.ts` | Document in patterns.md: files in `domain/<feature>/common/` are utility helpers and follow `<noun>.service.ts` naming to distinguish them from use-case services | S |
| 🟢 | Auth | New pattern: Store-level storage helpers — `auth.store.ts` defines `saveToken`, `getToken`, `deleteToken` as module-level functions co-located with the Zustand store; patterns.md Store Pattern says nothing about where persistence helpers live | `rn-app/stores/auth.store.ts:23-45` | Document in patterns.md that storage helpers may be co-located in the store file when they are used only by that store; consider flagging fire-and-forget `saveToken(token).catch(console.error)` at line 54 — a SecureStore failure silently diverges persisted vs in-memory state | S |
| 🟢 | Auth | New pattern: Entity type file co-located with repository — `user.entity.ts` sits alongside `user.repository.ts` in `repositories/`; patterns.md documents only "one file per entity" but doesn't describe entity type files or their `.entity.ts` suffix convention | `backend/src/repositories/user.entity.ts` | Document in patterns.md: entity type files use the `<entity>.entity.ts` suffix and live in `repositories/` alongside their repository file | S |
| 🟢 | Auth | New pattern: Error handling — services uniformly use `throw new Error(...)` and handlers re-throw with the same message; no error type hierarchy, no Result/Either types, no documented convention; patterns.md is silent on error handling strategy | `backend/src/domain/auth/signup.service.ts:35,42` and `backend/src/graphql/handlers/auth/signup.handler.ts:31` | Document the chosen convention in patterns.md ("services throw plain `Error`; handlers catch and re-throw to preserve the message to the GraphQL layer"); existing TODO comments in signup.service.ts also flag desire for custom domain errors — decide and document | S |

### Events CRUD

| Severity | Area | Description | Location | Recommended action | Effort |
|----------|------|-------------|----------|--------------------|--------|

### Cross-cutting

| Severity | Area | Description | Location | Recommended action | Effort |
|----------|------|-------------|----------|--------------------|--------|

### Doc currency

| Severity | Area | Description | Location | Recommended action | Effort |
|----------|------|-------------|----------|--------------------|--------|

### Agent skills

| Severity | Area | Description | Location | Recommended action | Effort |
|----------|------|-------------|----------|--------------------|--------|
