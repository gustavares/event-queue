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
