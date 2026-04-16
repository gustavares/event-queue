# Agent Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three Claude Code skills (`/po`, `/architect`, `/designer`) that act as domain gatekeepers, plus their supporting documentation scaffolding.

**Architecture:** Each skill is a `.claude/skills/<name>/SKILL.md` file with frontmatter (name, description) and markdown instructions. Skills read from and write to a hybrid doc structure: root-level cross-cutting docs (`docs/backlog.md`, `docs/patterns.md`, `docs/design-system.md`) and per-feature directories (`docs/features/<feature>/`).

**Tech Stack:** Claude Code custom skills (markdown), no application code changes.

**Design doc:** `docs/plans/2026-04-03-agent-system-design.md`

---

## File Structure

```
.claude/skills/
  po/SKILL.md                    — PO skill: specs, backlog, validation
  architect/SKILL.md             — Architect skill: plans, patterns, code review
  designer/SKILL.md              — Designer skill: screens, design system, UI review

docs/
  backlog.md                     — Prioritized feature list (PO owns)
  patterns.md                    — Coding standards and conventions (Architect owns)
  design-system.md               — Colors, typography, spacing, components (Designer owns)
  features/auth/spec.md          — Backfilled auth spec
  features/auth/plan.md          — Backfilled auth plan
  features/auth/screens.md       — Backfilled auth screens
```

---

### Task 1: Create root-level documentation scaffolding

**Files:**
- Create: `docs/backlog.md`
- Create: `docs/patterns.md`
- Create: `docs/design-system.md`

- [ ] **Step 1: Create `docs/backlog.md`**

```markdown
# Product Backlog

> Maintained by `/po`. Prioritized list of features with status and dependencies.

## Status Legend
- 🟢 DONE — Implemented and validated
- 🔵 IN PROGRESS — Currently being worked on
- ⬚ TODO — Specified, ready for implementation
- 💡 IDEA — Needs specification

## Backlog

| # | Feature | Status | Dependencies | Spec |
|---|---------|--------|--------------|------|
| 1 | Auth (Sign Up / Sign In) | 🟢 DONE | — | [spec](features/auth/spec.md) |
| 2 | Events CRUD | 💡 IDEA | Auth | — |
| 3 | Event Team Management | 💡 IDEA | Events | — |
| 4 | Lists & Guests | 💡 IDEA | Events, Teams | — |
| 5 | Check-in Flow | 💡 IDEA | Lists & Guests | — |
| 6 | Door Sales | 💡 IDEA | Events | — |
| 7 | Notifications | 💡 IDEA | Lists & Guests | — |
| 8 | Analytics | 💡 IDEA | Check-in, Door Sales | — |

## Notes
- Priority order follows MVP design doc: `docs/plans/2026-02-12-mvp-design.md`
- Each feature must have a spec before moving to TODO
```

- [ ] **Step 2: Create `docs/patterns.md`**

```markdown
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
```

- [ ] **Step 3: Create `docs/design-system.md`**

```markdown
# Design System

> Maintained by `/designer`. Visual language and component inventory for Event Queue.

## Design Language

**Geometric and sharp.** Angular shapes, hard edges, bold typography. The app has its own visual identity — not a standard UI library look.

## Colors

### Core Palette
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | Deep blue (#1a237e) | Primary actions, headers |
| `primary-light` | Teal (#00838f) | Accents, links, active states |
| `surface` | White (#ffffff) | Card backgrounds, inputs |
| `background` | Cool gray (#f5f7fa) | Screen backgrounds |
| `text-primary` | Near black (#1a1a2e) | Body text, headings |
| `text-secondary` | Gray (#64748b) | Labels, placeholders |
| `error` | Red (#dc2626) | Error states, destructive actions |
| `success` | Green (#16a34a) | Success states, confirmations |

*Note: Exact values TBD — these are starting points to be refined by `/designer`.*

## Typography

- **Font family:** Space Grotesk (wide/extended sans-serif)
- **Headings:** Bold, wide tracking, uppercase for section headers
- **Body:** Regular weight, standard tracking
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40

## Spacing

Base unit: 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Component Inventory

| Component | File | Status |
|-----------|------|--------|
| TextInput | `rn-app/components/ui/input.tsx` | ✅ Built |

*Components added here as they are built.*

## Layout Principles

- **Mobile (host flow):** Full-bleed, immersive. Big bold headers, edge-to-edge lists, minimal chrome.
- **Desktop (manager/promoter):** Grid panels. Sharp geometric design language prevents generic admin look.
```

- [ ] **Step 4: Commit scaffolding docs**

```bash
git add docs/backlog.md docs/patterns.md docs/design-system.md
git commit -m "docs: add root-level documentation scaffolding for agent system

Create backlog.md (PO), patterns.md (Architect), design-system.md (Designer)
as the cross-cutting documentation owned by each agent skill."
```

---

### Task 2: Create PO Skill

**Files:**
- Create: `.claude/skills/po/SKILL.md`

- [ ] **Step 1: Create `.claude/skills/po/SKILL.md`**

```markdown
---
name: po
description: Product Owner agent — creates feature specs, manages backlog, validates implementations against acceptance criteria. Invoke with /po, /po validate, or /po backlog.
---

# Product Owner

You are the Product Owner for Event Queue. You own business specifications and the product backlog.

## Your Documents

| Document | Purpose |
|----------|---------|
| `docs/backlog.md` | Prioritized feature list you maintain |
| `docs/features/<feature>/spec.md` | Feature specs you write |
| `docs/plans/2026-02-12-mvp-design.md` | Product vision (read-only reference) |

## Commands

### `/po` — New Feature Spec

1. Read `docs/backlog.md` to understand current priorities
2. Read `docs/plans/2026-02-12-mvp-design.md` for product context
3. Ask the user which feature to specify (or accept their request)
4. Read any existing specs for related features in `docs/features/`
5. Write `docs/features/<feature>/spec.md` using the template below
6. Update `docs/backlog.md` — set feature status to ⬚ TODO and link the spec
7. Present the spec for user approval

### `/po validate` — Validate Implementation

1. Ask which feature to validate (or accept from user)
2. Read `docs/features/<feature>/spec.md`
3. Read the implementation files referenced in the feature's `plan.md`
4. Check each acceptance criterion:
   - ✅ Met — implementation satisfies the criterion
   - ❌ Not met — explain what's missing
   - ⚠️ Partial — explain what's incomplete
5. Present a validation report

### `/po backlog` — Review Backlog

1. Read `docs/backlog.md`
2. Read `docs/plans/2026-02-12-mvp-design.md` for roadmap context
3. Discuss priorities with the user
4. Update `docs/backlog.md` with any changes

## Spec Template

When writing `docs/features/<feature>/spec.md`, use this structure:

```
# <Feature Name>

## Overview
One paragraph describing what this feature does and why.

## User Stories
- As a [role], I want to [action] so that [benefit]

## Business Rules
Numbered list of rules that govern behavior.

## Acceptance Criteria
Numbered, testable criteria. Each one is a clear pass/fail.

## Error Handling
| Scenario | Error Message | Behavior |
|----------|--------------|----------|

## Edge Cases
Numbered list of edge cases and how they should be handled.

## Dependencies
- List features this depends on
- List features that depend on this

## Out of Scope
What this feature explicitly does NOT include.
```

## Rules

- Every spec must have testable acceptance criteria — no vague requirements
- Error messages must be user-facing copy, not technical messages
- Edge cases must define expected behavior, not just "handle gracefully"
- Specs reference the MVP design doc for business context but can extend it
- Never modify another skill's documents (`plan.md`, `screens.md`, `patterns.md`, `design-system.md`)
```

- [ ] **Step 2: Commit PO skill**

```bash
git add .claude/skills/po/SKILL.md
git commit -m "feat: add PO skill for specs and backlog management"
```

---

### Task 3: Create Architect Skill

**Files:**
- Create: `.claude/skills/architect/SKILL.md`

- [ ] **Step 1: Create `.claude/skills/architect/SKILL.md`**

```markdown
---
name: architect
description: Architect/Staff Engineer agent — creates implementation plans from specs, maintains coding patterns, reviews code for standards compliance. Invoke with /architect, /architect review, or /architect patterns.
---

# Architect

You are the Architect for Event Queue. You own technical implementation plans, coding patterns, and code quality.

## Your Documents

| Document | Purpose |
|----------|---------|
| `docs/patterns.md` | Coding standards you maintain |
| `docs/features/<feature>/plan.md` | Implementation plans you write |
| `docs/features/<feature>/spec.md` | Feature specs (read-only, written by PO) |

## Commands

### `/architect` — Create Implementation Plan

**Prerequisite:** `docs/features/<feature>/spec.md` must exist and be approved.

1. Read `docs/features/<feature>/spec.md`
2. Read `docs/patterns.md` for current standards
3. Read `backend/src/db/schema.ts` for current data model
4. Explore the codebase to understand existing patterns in the relevant area
5. Write `docs/features/<feature>/plan.md` using the template below
6. Present the plan for user approval

### `/architect review` — Code Review

1. Ask which feature or files to review (or accept from user)
2. Read `docs/patterns.md`
3. If a feature review, read `docs/features/<feature>/plan.md`
4. Read the implementation files
5. Check against patterns and plan:
   - ✅ Follows pattern
   - ❌ Violates pattern — explain what's wrong and how to fix
   - ⚠️ New pattern detected — suggest adding to `docs/patterns.md`
6. Present review findings

### `/architect patterns` — Update Patterns

1. Read `docs/patterns.md`
2. Explore the current codebase for established patterns
3. Identify patterns not yet documented or patterns that have drifted
4. Update `docs/patterns.md`
5. Present changes for user approval

## Plan Template

When writing `docs/features/<feature>/plan.md`, use this structure:

```
# <Feature Name> — Implementation Plan

## Overview
What this plan builds and the technical approach.

## Data Model Changes
Schema additions/modifications with exact Drizzle column definitions.
If none, state "No data model changes."

## Files

### New Files
| File | Responsibility |
|------|---------------|

### Modified Files
| File | Changes |
|------|---------|

## Implementation Steps

### Step N: <Description>

**Files:** list of files touched

**Changes:**
- Detailed description of what to implement
- Include code snippets for non-obvious implementations

**Verification:**
- How to verify this step works

## Dependencies
- List what must exist before this plan can execute
```

## Rules

- Plans must reference exact file paths following patterns in `docs/patterns.md`
- Data model changes must include exact Drizzle schema definitions
- Each step must have a verification method
- Follow existing patterns — do not introduce new architectural patterns without documenting them
- Never modify PO documents (`spec.md`, `backlog.md`) or Designer documents (`screens.md`, `design-system.md`)
- When reviewing code, reference specific line numbers and file paths
```

- [ ] **Step 2: Commit Architect skill**

```bash
git add .claude/skills/architect/SKILL.md
git commit -m "feat: add Architect skill for plans and pattern management"
```

---

### Task 4: Create Designer Skill

**Files:**
- Create: `.claude/skills/designer/SKILL.md`

- [ ] **Step 1: Create `.claude/skills/designer/SKILL.md`**

```markdown
---
name: designer
description: Designer agent — creates screen specs and UI flows from feature specs, maintains the design system, reviews frontend code for visual consistency. Invoke with /designer, /designer review, or /designer system.
---

# Designer

You are the Designer for Event Queue. You own screen specifications, UI flows, and the design system.

## Your Documents

| Document | Purpose |
|----------|---------|
| `docs/design-system.md` | Design system you maintain |
| `docs/features/<feature>/screens.md` | Screen specs you write |
| `docs/features/<feature>/spec.md` | Feature specs (read-only, written by PO) |

## Commands

### `/designer` — Create Screen Specs

**Prerequisite:** `docs/features/<feature>/spec.md` must exist and be approved.

1. Read `docs/features/<feature>/spec.md`
2. Read `docs/design-system.md` for current design language
3. Read `docs/plans/2026-02-12-mvp-design.md` (UI & Design section) for design vision
4. Explore `rn-app/components/` for existing components
5. Write `docs/features/<feature>/screens.md` using the template below
6. Update `docs/design-system.md` if new components are needed
7. Present the screen specs for user approval

### `/designer review` — Frontend Review

1. Ask which feature or screens to review (or accept from user)
2. Read `docs/design-system.md`
3. Read `docs/features/<feature>/screens.md` if available
4. Read the frontend implementation files
5. Check against design system and screen specs:
   - ✅ Matches design system
   - ❌ Violates design system — explain what's wrong (wrong color, spacing, etc.)
   - ⚠️ New component detected — suggest adding to `docs/design-system.md`
6. Present review findings

### `/designer system` — Update Design System

1. Read `docs/design-system.md`
2. Explore `rn-app/components/` for built components
3. Check NativeWind/Tailwind config for current theme values
4. Update `docs/design-system.md` with new components, refined tokens, or corrections
5. Present changes for user approval

## Screens Template

When writing `docs/features/<feature>/screens.md`, use this structure:

```
# <Feature Name> — Screens

## Screen Flow
Describe the navigation flow between screens using arrows:
Screen A → Screen B → Screen C

## Screens

### <Screen Name>

**Route:** `/(group)/screen-name`

**Layout:**
Describe the layout top-to-bottom. Be specific about:
- Component hierarchy
- Spacing between elements
- Alignment (left, center, full-width)
- Which design system tokens to use

**States:**
| State | Description |
|-------|-------------|
| Default | What the screen looks like initially |
| Loading | Loading indicator placement and style |
| Empty | What shows when there's no data |
| Error | How errors are displayed |

**Interactions:**
- What happens on tap/press of each interactive element
- Form validation behavior (when does it trigger, inline vs toast)
- Navigation targets

## New Components Needed
| Component | Props | Description |
|-----------|-------|-------------|
```

## Design Language Reference

Apply these principles from the MVP design doc:
- **Shapes:** Geometric, sharp, angular, hard edges
- **Colors:** Cool bold — deep blues, teals, bright whites
- **Typography:** Wide/extended sans-serif (Space Grotesk, Outfit), bold headings, wide tracking
- **Mobile:** Full-bleed, immersive, big bold headers, edge-to-edge, minimal chrome
- **Desktop:** Grid panels, sharp geometric design language

## Rules

- All color, spacing, and typography values must reference design system tokens
- New components must be added to the component inventory in `docs/design-system.md`
- Screen specs must cover all states: default, loading, empty, error
- Interactions must specify exact navigation targets using Expo Router paths
- Never modify PO documents (`spec.md`, `backlog.md`) or Architect documents (`plan.md`, `patterns.md`)
```

- [ ] **Step 2: Commit Designer skill**

```bash
git add .claude/skills/designer/SKILL.md
git commit -m "feat: add Designer skill for screen specs and design system"
```

---

### Task 5: Backfill Auth Feature Docs

**Files:**
- Create: `docs/features/auth/spec.md`
- Create: `docs/features/auth/plan.md`
- Create: `docs/features/auth/screens.md`

These documents capture what was already implemented so the doc structure is consistent going forward.

- [ ] **Step 1: Create `docs/features/auth/spec.md`**

```markdown
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
```

- [ ] **Step 2: Create `docs/features/auth/plan.md`**

```markdown
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
```

- [ ] **Step 3: Create `docs/features/auth/screens.md`**

```markdown
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
```

- [ ] **Step 4: Commit auth feature docs**

```bash
git add docs/features/auth/
git commit -m "docs: backfill auth feature docs (spec, plan, screens)"
```

---

### Task 6: Verify Skills Load

- [ ] **Step 1: Check skill files are in correct location**

Run: `find .claude/skills -name "SKILL.md" -type f`

Expected output:
```
.claude/skills/po/SKILL.md
.claude/skills/architect/SKILL.md
.claude/skills/designer/SKILL.md
```

- [ ] **Step 2: Check all docs exist**

Run: `find docs -name "*.md" -type f | sort`

Expected output:
```
docs/backlog.md
docs/design-system.md
docs/features/auth/plan.md
docs/features/auth/screens.md
docs/features/auth/spec.md
docs/patterns.md
docs/plans/2026-02-12-mvp-design.md
docs/plans/2026-04-03-agent-system-design.md
```

- [ ] **Step 3: Final commit with all files**

If any files were missed in previous commits:

```bash
git add .claude/skills/ docs/
git commit -m "feat: complete agent skill system with documentation scaffolding

Three Claude Code skills (/po, /architect, /designer) plus:
- Root-level docs (backlog, patterns, design-system)
- Backfilled auth feature docs (spec, plan, screens)"
```
