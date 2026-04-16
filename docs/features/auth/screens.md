# Auth — Screens

## Screen Flow
App Launch → [token exists?] → Yes → /(app) (home)
                              → No  → /(auth)/sign-in

/(auth)/sign-in ←→ /(auth)/sign-up
/(auth)/sign-in → success → /(app)
/(auth)/sign-up → success → /(app)
/(app) → sign out → /(auth)/sign-in

## Screens

### Sign In

**Route:** `/(auth)/sign-in`

**Layout:**
- Full-screen, centered content
- App title/logo at top
- Email input (full width)
- Password input (full width, secure entry)
- "Sign In" button (full width, primary color)
- "Don't have an account? Sign Up" link below button

**States:**
| State | Description |
|-------|-------------|
| Default | Empty form, button enabled |
| Loading | Button shows loading indicator, inputs disabled |
| Error | Error message displayed above button |

**Interactions:**
- Tap "Sign In" → call SIGN_IN_MUTATION → on success, setAuth + navigate to /(app)
- Tap "Sign Up" link → navigate to /(auth)/sign-up
- Error from mutation → display error message

### Sign Up

**Route:** `/(auth)/sign-up`

**Layout:**
- Full-screen, centered content
- App title/logo at top
- Name input (full width)
- Email input (full width)
- Password input (full width, secure entry)
- "Sign Up" button (full width, primary color)
- "Already have an account? Sign In" link below button

**States:**
| State | Description |
|-------|-------------|
| Default | Empty form, button enabled |
| Loading | Button shows loading indicator, inputs disabled |
| Error | Error message displayed above button |

**Interactions:**
- Tap "Sign Up" → call SIGN_UP_MUTATION → on success, setAuth + navigate to /(app)
- Tap "Sign In" link → navigate to /(auth)/sign-in

### Home (Events)

**Route:** `/(app)/index`

**Layout:**
- Header with "Events" title
- User greeting ("Hello, {name}")
- Sign Out button
- Placeholder content for events list

**States:**
| State | Description |
|-------|-------------|
| Default | Shows greeting and sign-out |

**Interactions:**
- Tap "Sign Out" → clearAuth → navigate to /(auth)/sign-in

## New Components Needed
| Component | Props | Description |
|-----------|-------|-------------|
| TextInput | `label`, `error`, `...TextInputProps` | Styled input with NativeWind |

## Status
✅ Implemented — this document captures the existing screens for reference.
