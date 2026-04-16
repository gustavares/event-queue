# Auth (Sign Up / Sign In)

## Overview
Users can create an account and sign in to access the app. Authentication uses JWT tokens stored securely on the client. This is the MVP auth — minimal but functional.

## User Stories
- As a new user, I want to sign up with my name, email, and password so that I can access the app
- As a returning user, I want to sign in with my email and password so that I can resume where I left off
- As a signed-in user, I want my session to persist across app restarts so I don't have to sign in every time

## Business Rules
1. Email must be unique across all users
2. Password is hashed with Argon2 before storage
3. JWT token is issued on successful sign-up or sign-in
4. Token is stored in SecureStore (native) or localStorage (web)
5. App restores session on launch by validating stored token via `me` query

## Acceptance Criteria
1. User can sign up with name, email, and password → receives JWT token → lands on app home
2. User can sign in with email and password → receives JWT token → lands on app home
3. Unauthenticated user is redirected to sign-in screen
4. Authenticated user is redirected away from auth screens
5. Session persists across app restart if token is still valid
6. Sign-out clears token and redirects to sign-in

## Error Handling
| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| Duplicate email on sign-up | "An account with this email already exists" | Stay on sign-up form |
| Wrong email/password on sign-in | "Invalid email or password" | Stay on sign-in form |
| Expired/invalid token on restore | (silent) | Redirect to sign-in |

## Edge Cases
1. User signs up with an email that already exists → show error, don't create duplicate
2. User submits empty form → client-side validation prevents submission
3. Token expires while user is using the app → next GraphQL request fails → clear session, redirect to sign-in
4. Network error during sign-in → show network error message

## Dependencies
- None (first feature)

## Out of Scope
- Email verification
- Password reset / forgot password
- OAuth / social sign-in
- Rate limiting on sign-in attempts
- Password strength requirements (beyond basic length)
