# Auth — Implementation Plan

## Overview
JWT-based authentication with sign-up, sign-in, session persistence, and route guarding. Backend uses GraphQL Yoga + Drizzle + Argon2 + JOSE. Frontend uses Expo Router + Zustand + urql + SecureStore.

## Data Model Changes
User table (already exists in `backend/src/db/schema.ts`):
- `id` (CUID2), `email` (unique), `password` (Argon2 hash), `name`, `phone` (optional), `deleted`, timestamps

## Files

### Backend
| File | Responsibility |
|------|---------------|
| `backend/src/db/schema.ts` | User table schema |
| `backend/src/repositories/user.repository.ts` | User data access |
| `backend/src/domain/auth/common/password.service.ts` | Argon2 hash/verify |
| `backend/src/domain/auth/common/jwt.service.ts` | JWT sign/verify with JOSE |
| `backend/src/domain/auth/signup.service.ts` | Sign-up business logic |
| `backend/src/domain/auth/signin.service.ts` | Sign-in business logic |
| `backend/src/graphql/schema/` | GraphQL type definitions |
| `backend/src/graphql/handlers/auth/signup.handler.ts` | Sign-up mutation handler |
| `backend/src/graphql/handlers/auth/signin.handler.ts` | Sign-in mutation handler |
| `backend/src/graphql/handlers/auth/me.handler.ts` | Me query handler |
| `backend/src/graphql/resolvers/index.ts` | Wire handlers to schema |
| `backend/src/index.ts` | JWT context extraction middleware |

### Frontend
| File | Responsibility |
|------|---------------|
| `rn-app/stores/auth.store.ts` | Auth state + token persistence |
| `rn-app/lib/graphql/client.ts` | urql client with auth exchange |
| `rn-app/lib/graphql/provider.tsx` | GraphQL provider wrapper |
| `rn-app/lib/graphql/operations/auth.ts` | Auth queries and mutations |
| `rn-app/hooks/useAuthGate.ts` | Route guard hook |
| `rn-app/hooks/useRestoreSession.ts` | Token restore on app load |
| `rn-app/app/_layout.tsx` | Root layout with providers |
| `rn-app/app/(auth)/_layout.tsx` | Auth group layout |
| `rn-app/app/(auth)/sign-in.tsx` | Sign-in screen |
| `rn-app/app/(auth)/sign-up.tsx` | Sign-up screen |
| `rn-app/app/(app)/_layout.tsx` | App group layout |
| `rn-app/app/(app)/index.tsx` | Home screen |
| `rn-app/components/ui/input.tsx` | Text input component |

## Status
✅ Implemented — this plan documents the existing implementation for reference.
