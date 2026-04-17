# Audit Triage — Design

**Date:** 2026-04-16
**Status:** Design approved, pending implementation plan
**Upstream:** [docs/audits/2026-04-16-full-audit.md](../../audits/2026-04-16-full-audit.md) (106 findings)
**Downstream:** fix-now plan + annotated audit

## Goal

Decide what happens to each of the 106 findings surfaced by the 2026-04-16 full audit and produce a concrete, runnable plan for the highest-priority fixes. Low-severity findings get routed to later phases via blanket rules rather than individually litigated.

## Motivation

We cannot fix 106 things at once, and most of them do not need to be fixed right now. The MVP direction has two upcoming phases (BDD adoption, Stitch-driven UI redesign) plus a natural architect-patterns rewrite that together absorb the bulk of non-critical findings. Walking all 106 rows is wasteful; walking all 18 🔴 rows is the right resolution.

## Scope

### In scope

- Bucket assignment for every 🔴 finding (18 total)
- Blanket rules that assign every 🟡 (65) and 🟢 (23) finding to a phase
- Deliverable artefacts: a fix-now implementation plan and a triage annotation on the audit itself

### Out of scope

- Actually executing the fix-now plan (next brainstorm / planning cycle)
- Detailed planning of the Architect patterns rewrite, BDD adoption, or Stitch redesign phases (each gets its own brainstorm)
- Re-scoring findings — the audit's severity assignments are taken as input

## Blanket rules for 🟡 / 🟢 findings (88 rows)

Every non-critical finding routes to one of four phases without per-row debate:

1. **Architect patterns rewrite** — all `patterns.md` drift / silence findings. A dedicated `/architect patterns` pass will rewrite `patterns.md` to match reality (or refactor code to match `patterns.md`). This pass is orthogonal to BDD and Stitch and prevents per-feature fixes from re-introducing drift.
2. **Stitch redesign phase** — all `design-system.md` drift findings. They define the contract Stitch will design against; they must be reconciled before Stitch can do meaningful work.
3. **BDD adoption phase** — all spec-vs-code wording, validation-nuance, and error-message gaps. BDD scenarios (Given/When/Then) will force alignment of exact behaviors and user-facing messages.
4. **Agent-skill housekeeping** — all `SKILL.md` drift findings. Bundled with the `/architect patterns` and `/po backlog` updates since the three skills all touch each other's documents.
5. **Fallback — fix now if trivial (< 10 min), else defer** — any small doc-currency fix not covered by 1–4.

## Bucket assignments for the 18 🔴 findings

### Fix now (10 findings → 7 work items)

All user-facing bugs or trivial doc fixes. Bundled into a single implementation plan that runs before the next phase starts.

| # | Work item | Covers findings (audit rows) | Effort |
|---|-----------|------------------------------|--------|
| 1 | Fix 4 broken client mutations — pass `{ id }` not `{ eventId }` / `{ tierId }` to match mutation definitions | 43 (transitionStatus), 44 (deleteEvent), 45 (tier update/remove) | S |
| 2 | Fix "Reopen" event transition — send `ACTIVE` not `DRAFT` and update dialog copy | 42 | S |
| 3 | Preserve tiers when disabling door sales — remove the delete-all branch; persist `doorSalesEnabled=false` flag alone | 46 | S |
| 4 | Wrap event + `EventTeamMember` creation in a Drizzle transaction | 47 | M |
| 5 | Add `requireAuth(context)` helper that throws `GraphQLError` with `extensions.code = 'UNAUTHENTICATED'`; refactor all 14 handlers to use it; document the pattern | 27 (Auth Edge 3), 86 (Cross-cutting root cause) | M |
| 6 | Reconcile env var name — rename `JWT_SECRET_STRING` → `JWT_SECRET` in code, or update `tech.md` to match code | 104 | S |
| 7 | Flip Events CRUD backlog status from `🔵 IN PROGRESS` → `🟢 DONE` with a note referencing the audit | 105 | S |

### Fold into Architect patterns rewrite phase (6 findings)

Architectural drift; not user-facing. Handled when we brainstorm the patterns rewrite.

- Row 63 — Events CRUD repositories (4 of them) are default-exported classes, not factory functions
- Row 64 — Venue handlers bypass the service layer (`list-venues`, `get-venue`)
- Row 65 — `Event.createdBy` type resolver hand-rolls a Drizzle `select()` query in `resolvers/index.ts`
- Row 87 — Cross-cutting: all 5 repositories drift identically from the documented factory pattern
- Row 102 — `patterns.md` Repository Pattern contradicts code
- Row 103 — `patterns.md` Handler Pattern contradicts code

### Fold into Stitch redesign phase (2 findings)

These define what Stitch will redesign against.

- Row 100 — `design-system.md` palette tokens do not exist in Tailwind / global.css; components hardcode hex values
- Row 101 — Space Grotesk font is documented but not loaded in the app

## Deliverables

### 1. Fix-now implementation plan

Written to `docs/superpowers/plans/2026-04-16-audit-fixes-wave-1.md`. Covers the 7 work items above, each broken into bite-sized TDD-style steps with exact file paths, code snippets, verification, and a commit step. The plan is produced by the writing-plans skill after this brainstorm is approved.

### 2. Annotated audit

A new **Triage** section added near the top of `docs/audits/2026-04-16-full-audit.md` (between Executive Summary and Findings) that records:

- The blanket rule set
- The bucket assignment for every 🔴 finding (by row number)
- A link to this design doc and to the fix-now plan

Per-row annotation inside the tables is **not** part of this design — it would inflate the tables and duplicate the Triage section's content. The Triage section references rows by number and keeps the finding tables clean.

## Success criteria

Triage is complete when:

1. `docs/superpowers/plans/2026-04-16-audit-fixes-wave-1.md` exists with 7 executable work items covering the "fix now" findings
2. `docs/audits/2026-04-16-full-audit.md` has a Triage section that maps every 🔴 finding to a bucket and states the blanket rule set
3. This design doc is committed
4. All changes are on `main` with clean history

## Non-goals

- Do not execute any of the fix-now work during triage; triage is pure decision work
- Do not re-triage any findings during the fix-now execution — the plan is the source of truth after this document is committed
- Do not modify severity or description of any finding — the audit is taken as input and treated as immutable
