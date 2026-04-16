# Agent System Design — Claude Code Skills

## Overview

Three specialized Claude Code skills act as domain gatekeepers for the Event Queue project. Each skill owns a specific area of documentation, validates work within its domain, and can be invoked manually or as part of a sequential pipeline.

**Pipeline:** `/po` → `/architect` → `/designer` → implementation

## 1. Document Structure (Hybrid)

### Root-level docs (cross-cutting)

| File | Owner | Purpose |
|------|-------|---------|
| `docs/backlog.md` | PO | Prioritized feature list with status and dependencies |
| `docs/patterns.md` | Architect | Coding standards, naming conventions, file structure rules |
| `docs/design-system.md` | Designer | Colors, typography, spacing, component inventory |

### Per-feature docs

Each feature gets a directory under `docs/features/<feature>/`:

| File | Owner | Purpose |
|------|-------|---------|
| `spec.md` | PO | User stories, business rules, acceptance criteria, error messages, edge cases |
| `plan.md` | Architect | Files to create/modify, data model changes, step-by-step implementation order |
| `screens.md` | Designer | Screen flows, layout descriptions, component states, interactions |

## 2. PO Skill (`/po`)

**Scope:** Business specifications and backlog management.

### Responsibilities
- Write and maintain `docs/backlog.md` (prioritized feature list)
- Write `docs/features/<feature>/spec.md` for each feature
- Define user stories, acceptance criteria, business rules, error messages, edge cases
- Validate that implementations match spec requirements
- Track feature status and dependencies

### Commands
| Command | Action |
|---------|--------|
| `/po` | Start new feature spec (create feature dir + spec.md, update backlog) |
| `/po validate` | Check implementation against spec acceptance criteria |
| `/po backlog` | Review and update backlog priorities and status |

### Reads
- `docs/plans/2026-02-12-mvp-design.md` (source of truth for product vision)
- `docs/backlog.md` (current priorities)
- Existing `spec.md` files (context for related features)

### Writes
- `docs/backlog.md`
- `docs/features/<feature>/spec.md`

## 3. Architect Skill (`/architect`)

**Scope:** Technical design, patterns, and code quality.

### Responsibilities
- Write and maintain `docs/patterns.md` (coding standards, conventions)
- Write `docs/features/<feature>/plan.md` for each feature
- Define files to create/modify, data model changes, implementation order
- Review code for pattern compliance
- Record Architecture Decision Records when patterns change

### Commands
| Command | Action |
|---------|--------|
| `/architect` | Create implementation plan from an approved spec |
| `/architect review` | Review code against patterns and plan |
| `/architect patterns` | Update patterns doc based on current codebase |

### Reads
- `docs/features/<feature>/spec.md` (approved spec to plan against)
- `docs/patterns.md` (existing standards)
- Current codebase (to understand existing patterns)
- `backend/src/db/schema.ts` (data model)

### Writes
- `docs/patterns.md`
- `docs/features/<feature>/plan.md`

### Existing Patterns to Document
- **Repository pattern:** `backend/src/repositories/` — data access layer
- **Service pattern:** `backend/src/domain/<feature>/` — business logic with Zod validation
- **Handler pattern:** `backend/src/graphql/handlers/<feature>/` — GraphQL resolvers calling services
- **Store pattern:** `rn-app/stores/` — Zustand stores for client state
- **Hook pattern:** `rn-app/hooks/` — custom React hooks for shared logic
- **GraphQL operations:** `rn-app/lib/graphql/operations/` — queries and mutations

## 4. Designer Skill (`/designer`)

**Scope:** UI/UX specifications and design system.

### Responsibilities
- Write and maintain `docs/design-system.md` (colors, typography, spacing, components)
- Write `docs/features/<feature>/screens.md` for each feature
- Define screen flows, layouts, component states, interactions
- Review frontend code for design system compliance
- Maintain component inventory

### Commands
| Command | Action |
|---------|--------|
| `/designer` | Create screen specs from an approved spec |
| `/designer review` | Review frontend code against design system and screen specs |
| `/designer system` | Update design system doc |

### Reads
- `docs/features/<feature>/spec.md` (feature requirements)
- `docs/design-system.md` (current design language)
- `rn-app/components/` (existing components)
- `docs/plans/2026-02-12-mvp-design.md` (design language section)

### Writes
- `docs/design-system.md`
- `docs/features/<feature>/screens.md`

### Design Language (from MVP doc)
- **Shapes:** Geometric, sharp, angular, hard edges
- **Colors:** Cool bold — deep blues, teals, bright whites
- **Typography:** Wide/extended sans-serif (Space Grotesk, Outfit)
- **Mobile:** Full-bleed, immersive, big bold headers, edge-to-edge
- **Desktop:** Grid panels, sharp geometric, bold typography

## 5. Workflow & Invocation

### Default Pipeline (new features)

```
/po → writes spec.md + updates backlog
  ↓
/architect → reads spec.md → writes plan.md
  ↓
/designer → reads spec.md → writes screens.md
  ↓
implementation (using superpowers agents)
```

### Manual Invocation

Any skill can be invoked independently:
- `/po validate` — after implementation, check against spec
- `/architect review` — after implementation, check code quality
- `/designer review` — after implementation, check UI compliance
- `/po backlog` — anytime, to review priorities
- `/architect patterns` — after establishing new patterns

### Rules
1. **Dependency checking:** Architect requires an approved spec. Designer requires an approved spec. Implementation requires a plan.
2. **Approval gates:** Each skill presents its output for user approval before the next step proceeds.
3. **Document updates:** Skills update their root-level docs when they discover new patterns, rules, or components during feature work.
