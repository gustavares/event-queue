# Auth (Sign Up / Sign In)

## Overview
Users can create an account and sign in to access the app. Authentication uses JWT tokens stored securely on the client. This is the MVP auth — minimal but functional.

## User Stories
- As a new user, I want to sign up with my name, email, and password so that I can access the app
- As a returning user, I want to sign in with my email and password so that I can resume where I left off
- As a signed-in user, I want my session to persist across app restarts so I don't have to sign in every time
- As a signed-in user, I want to sign out so that I can hand the device to someone else without exposing my account

## Business Rules
1. Email must be unique across all users → `BR-AUTH-001`
2. Password is hashed with Argon2 before storage → `BR-AUTH-002`
3. JWT token is issued on successful sign-up or sign-in → `BR-AUTH-003`
4. Token is stored in SecureStore (native) or localStorage (web) → `BR-AUTH-004`
5. App restores session on launch by validating stored token via `me` query → `BR-AUTH-005`
6. Expired or invalid token on restore silently redirects to sign-in → `BR-AUTH-006`

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | User can sign up with name, email, and password → receives JWT token → lands on app home |
| AC-2 | User can sign in with email and password → receives JWT token → lands on app home |
| AC-3 | Unauthenticated user is redirected to sign-in screen |
| AC-4 | Authenticated user is redirected away from auth screens |
| AC-5 | Session persists across app restart if token is still valid |
| AC-6 | Sign-out clears token and redirects to sign-in |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`auth.feature`](auth.feature) | AC-1..AC-6, all Error Handling rows, EDGE-1..EDGE-4 |

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| Duplicate email on sign-up | `An account with this email already exists` | Stay on sign-up form |
| Wrong email/password on sign-in | `Invalid email or password` | Stay on sign-in form |
| Expired/invalid token on restore | _(silent)_ | Redirect to sign-in |
| Network error during sign-in | `Network error — please check your connection and try again` | Stay on sign-in form |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | User signs up with an email that already exists | Show error, don't create duplicate |
| EDGE-2 | User submits empty form | Client-side validation prevents submission, missing fields highlighted |
| EDGE-3 | Token expires while user is using the app | Next request fails → clear session → redirect to sign-in |
| EDGE-4 | Network error during sign-in | Show network error message; remain on form |

## Dependencies
- **Depends on:** None (first feature)
- **Depended on by:** Every other feature — all require an authenticated user context

## Out of Scope
- Email verification
- Password reset / forgot password
- OAuth / social sign-in
- Rate limiting on sign-in attempts
- Password strength requirements (beyond basic length)
