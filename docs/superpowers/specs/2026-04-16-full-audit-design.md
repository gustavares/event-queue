# Full Project Audit — Design

**Date:** 2026-04-16
**Status:** Design approved, pending implementation plan

## Goal

Produce one consolidated audit report that identifies gaps between shipped code, feature specs, coding patterns, and root-level documentation for the two delivered features (Auth, Events CRUD), plus check whether cross-cutting docs still reflect reality.

The audit is **pure investigation** — findings are captured, not fixed. Triage and remediation happen in a separate pass.

## Motivation

The project is an early-stage MVP with two shipped features and a three-skill agent system (`/po`, `/architect`, `/designer`) that owns specs, plans, and design. Before introducing BDD (next initiative) and a Stitch-driven UI redesign (final initiative), we need a clear picture of current drift between intent (docs/specs) and reality (shipped code).

## Scope

### In scope

- **Auth feature** — backend (`backend/src/domain/auth/`, `backend/src/graphql/handlers/auth/`) and frontend (`rn-app/app/(auth)/`, `rn-app/stores/auth.store.ts`, `rn-app/hooks/useAuthGate.ts`, `rn-app/hooks/useRestoreSession.ts`, `rn-app/lib/graphql/`)
- **Events CRUD feature** — backend (`backend/src/domain/events/`, `backend/src/domain/venues/`, `backend/src/graphql/handlers/events/`, `backend/src/graphql/handlers/venues/`) and frontend (`rn-app/app/(app)/events/`, related UI components)
- **Root documentation** — `docs/patterns.md`, `docs/business-rules.md`, `docs/design-system.md`, `docs/backlog.md`, `docs/tech.md`
- **Agent skill files** — `.claude/skills/po/SKILL.md`, `.claude/skills/architect/SKILL.md`, `.claude/skills/designer/SKILL.md` (consistency with how the docs they govern have actually evolved)

### Out of scope (deferred)

- **UI/UX visual quality judgments** — handled in the subsequent Stitch redesign phase
- **Test coverage** — there are no tests yet; that is an input to the subsequent BDD phase, not an audit finding
- **Performance and security deep-dives** — only flagged if one of the skill reviews surfaces something

## Process

Five sequential passes:

1. `/po validate` on Auth — spec ↔ implementation alignment
2. `/architect review` on Auth — code ↔ patterns compliance
3. `/po validate` on Events CRUD
4. `/architect review` on Events CRUD
5. **Doc-currency pass** (no existing skill covers this) — walk each root doc and each agent-skill `SKILL.md`, mark each section ✅ accurate / ⚠️ partially stale / ❌ contradicted by code, and record what needs updating

## Deliverable

A single file: `docs/audits/2026-04-16-full-audit.md`

### Structure

- **Executive Summary** — counts by severity (🔴 critical / 🟡 important / 🟢 nice-to-have) and the top 5 takeaways
- **Findings by area**, in this order:
  1. Auth — spec-code gaps and pattern violations
  2. Events CRUD — spec-code gaps and pattern violations
  3. Cross-cutting — issues that span both features (e.g., inconsistent error handling, duplicated patterns)
  4. Doc currency — what is stale in `patterns.md`, `business-rules.md`, `design-system.md`, `tech.md`, `backlog.md`
  5. Agent skills — inconsistencies inside `.claude/skills/*/SKILL.md`

### Finding row format

| Field | Description |
|-------|-------------|
| Severity | 🔴 critical / 🟡 important / 🟢 nice-to-have |
| Area | Auth / Events CRUD / Cross-cutting / Doc currency / Agent skills |
| Description | What is wrong or missing |
| Location | `file:line` where applicable |
| Recommended action | Concrete next step |
| Effort | S / M / L estimate |

## Severity definitions

- **🔴 Critical** — breaks a user-facing feature, introduces a security risk, or contradicts a stated business rule
- **🟡 Important** — violates a documented pattern, causes developer friction, or risks divergence between specs and code
- **🟢 Nice-to-have** — cosmetic inconsistency, minor doc staleness, or quality-of-life improvement

## Non-goals of this audit

- We do **not** fix anything during the audit. Findings are captured and triaged in a follow-up pass.
- We do **not** judge UI aesthetics or propose redesigns — that is the Stitch phase.
- We do **not** add tests — that is the BDD phase.

## Success criteria

The audit is complete when:

1. All five passes have been executed
2. `docs/audits/2026-04-16-full-audit.md` exists and contains findings organized per the structure above
3. Every finding has all fields populated (severity, area, description, location where applicable, recommended action, effort)
4. The executive summary counts tally with the detailed findings
