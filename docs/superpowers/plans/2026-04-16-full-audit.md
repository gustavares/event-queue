# Full Project Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `docs/audits/2026-04-16-full-audit.md` — a consolidated findings report covering spec↔code alignment, code↔patterns compliance, and doc currency for the two shipped features (Auth, Events CRUD) plus the three agent skills.

**Architecture:** Five sequential passes, each appending findings to a single growing report file. Passes 1–4 reuse existing skills (`/po validate`, `/architect review`); pass 5 is a custom doc-currency walk with no existing skill. After all passes, two synthesis tasks produce a cross-cutting section and an executive summary.

**Tech Stack:** Existing agent skills (`.claude/skills/po/SKILL.md`, `.claude/skills/architect/SKILL.md`), markdown, git.

**Design doc:** `docs/superpowers/specs/2026-04-16-full-audit-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `docs/audits/2026-04-16-full-audit.md` | The single consolidated audit report — grows one section per task |

### Files read only (never modified by this plan)

- `docs/features/auth/spec.md`, `docs/features/auth/plan.md`
- `docs/features/events-crud/spec.md`, `docs/features/events-crud/plan.md`
- `docs/patterns.md`, `docs/business-rules.md`, `docs/design-system.md`, `docs/tech.md`, `docs/backlog.md`
- `.claude/skills/po/SKILL.md`, `.claude/skills/architect/SKILL.md`, `.claude/skills/designer/SKILL.md`
- Implementation files under `backend/src/` and `rn-app/`

---

## Finding Row Format (used in every task)

All findings across all sections use this exact row format:

```markdown
| 🔴/🟡/🟢 | Auth \| Events CRUD \| Cross-cutting \| Doc currency \| Agent skills | <description> | `path/to/file.ext:line` or `—` | <recommended action> | S \| M \| L |
```

- **Severity:** 🔴 critical (breaks feature / security / contradicts business rule) / 🟡 important (pattern violation / divergence risk) / 🟢 nice-to-have (cosmetic / minor staleness)
- **Effort:** S (< 30 min) / M (30 min – 2 h) / L (> 2 h)
- **Location:** `file:line` if specific, `—` if the finding is about absence or doc-level

---

## Task 1: Bootstrap audit report skeleton

**Files:**
- Create: `docs/audits/2026-04-16-full-audit.md`

- [ ] **Step 1: Create the report file with all section headers and empty finding tables**

Create `docs/audits/2026-04-16-full-audit.md` with exactly this content:

```markdown
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
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la docs/audits/2026-04-16-full-audit.md`
Expected: file exists with non-zero size.

- [ ] **Step 3: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs: scaffold full-audit report skeleton

Empty section tables to be populated pass-by-pass by the audit plan
at docs/superpowers/plans/2026-04-16-full-audit.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Pass 1 — `/po validate` on Auth

**Files:**
- Read: `docs/features/auth/spec.md`, `docs/features/auth/plan.md`, all files under `backend/src/domain/auth/`, `backend/src/graphql/handlers/auth/`, `backend/src/graphql/handlers/users/`, `rn-app/app/(auth)/`, `rn-app/stores/auth.store.ts`, `rn-app/hooks/useAuthGate.ts`, `rn-app/hooks/useRestoreSession.ts`, `rn-app/lib/graphql/`
- Modify: `docs/audits/2026-04-16-full-audit.md` (append to Auth table)

- [ ] **Step 1: Read the Auth spec and plan**

Read `docs/features/auth/spec.md` in full. Note each numbered Acceptance Criterion, Business Rule, Error Handling row, and Edge Case — these are the checklist the validation will score against.

Read `docs/features/auth/plan.md` in full to know which implementation files to check.

- [ ] **Step 2: Read every implementation file referenced by the Auth plan**

Read each file listed in the plan's "Files" section. Do not skim — the goal is to answer "does this code satisfy acceptance criterion N?" for every N.

- [ ] **Step 3: Score each acceptance criterion, business rule, error scenario, and edge case**

For each item in the Auth spec, classify as:
- ✅ Met — implementation clearly satisfies it
- ⚠️ Partial — implementation satisfies part but misses nuance (e.g., error message wording differs)
- ❌ Not met — implementation does not satisfy it or the behavior is missing

Capture every ⚠️ and ❌ as a finding. Every ✅ is silent.

- [ ] **Step 4: Convert findings into report rows**

For each ⚠️ / ❌, create a row using the Finding Row Format with:
- Area = `Auth`
- Severity = 🔴 if the gap breaks a user-facing flow or contradicts a business rule, 🟡 if it causes divergence or minor user-facing quirk, 🟢 if cosmetic
- Description = "AC-N: <gap description>" or "BR-N: <gap description>" or "Edge case N: <gap>"
- Location = file:line where the gap exists (or the file where the missing code should be)
- Recommended action = concrete fix (code change, not "consider refactoring")
- Effort = S / M / L

- [ ] **Step 5: Append rows to the Auth table in the report**

Edit `docs/audits/2026-04-16-full-audit.md`. Append every row from Step 4 to the table under `### Auth`. Do not add rows to any other section yet.

- [ ] **Step 6: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add /po validate findings for Auth

Pass 1 of 5 — spec-to-implementation alignment check for Auth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Pass 2 — `/architect review` on Auth

**Files:**
- Read: `docs/patterns.md`, `docs/features/auth/plan.md`, same Auth implementation files as Task 2
- Modify: `docs/audits/2026-04-16-full-audit.md` (append to Auth table)

- [ ] **Step 1: Read `docs/patterns.md` in full**

Note every stated convention: file naming, folder structure, import order, error handling pattern, handler-service-repository split, validation placement, GraphQL schema conventions, test conventions if any.

- [ ] **Step 2: Re-read the Auth implementation files with patterns fresh in mind**

For each file, check it line-by-line against patterns.md. Pay attention to:
- Service/handler/repository boundary respect
- Import order (libs before local, etc. — whatever patterns.md says)
- Error throwing vs returning vs `Result` types — whichever the codebase uses
- Input validation (Zod schemas, where they live)
- Naming conventions (PascalCase / camelCase / kebab-case rules)
- Side effects in constructors, hidden state, etc.

- [ ] **Step 3: For each pattern violation or new-pattern-detected case, capture a finding**

Classify:
- ❌ Violates a pattern → finding with recommended fix
- ⚠️ New pattern not documented → finding with recommendation "document in patterns.md" and effort S
- ✅ Follows pattern → silent

- [ ] **Step 4: Convert findings into report rows**

Same format as Task 2 Step 4. Area = `Auth`. Severity usually 🟡 for pattern violations unless the violation introduces a bug (then 🔴) or is purely cosmetic (🟢).

- [ ] **Step 5: Append rows to the Auth table (after Task 2's rows)**

Edit `docs/audits/2026-04-16-full-audit.md`. Append new rows to the existing `### Auth` table — do not create a second Auth table.

- [ ] **Step 6: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add /architect review findings for Auth

Pass 2 of 5 — code-vs-patterns compliance check for Auth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Pass 3 — `/po validate` on Events CRUD

**Files:**
- Read: `docs/features/events-crud/spec.md`, `docs/features/events-crud/plan.md`, `backend/src/domain/events/`, `backend/src/domain/venues/`, `backend/src/graphql/handlers/events/`, `backend/src/graphql/handlers/venues/`, `backend/src/repositories/event.*`, `backend/src/repositories/venue.*`, `backend/src/repositories/door-sale-tier.*`, `backend/src/repositories/event-team-member.*`, `rn-app/app/(app)/events/`, `rn-app/components/ui/event-card.tsx`, `rn-app/components/ui/tier-row.tsx`, `rn-app/components/ui/status-badge.tsx`, `rn-app/lib/graphql/operations/events.ts`, `rn-app/lib/graphql/operations/venues.ts`
- Modify: `docs/audits/2026-04-16-full-audit.md` (append to Events CRUD table)

- [ ] **Step 1: Read the Events CRUD spec and plan**

Read `docs/features/events-crud/spec.md` (all sections — User Stories, Business Rules, Acceptance Criteria, Error Handling, Edge Cases, Dependencies, Out of Scope).

Read `docs/features/events-crud/plan.md` to know which implementation files to inspect.

- [ ] **Step 2: Read every implementation file referenced by the plan**

Same rigor as Task 2 Step 2. Events CRUD has more surface area (venues + events + door sale tiers + status lifecycle + team-member assignment) — budget accordingly.

- [ ] **Step 3: Score each acceptance criterion, business rule, error scenario, and edge case**

Same classification as Task 2 Step 3 (✅ / ⚠️ / ❌). Pay particular attention to:
- Status lifecycle enforcement (DRAFT → ACTIVE → FINISHED / CANCELLED transitions — are invalid transitions blocked?)
- Date rules (BR-6, BR-7 around startDate/endDate)
- Location XOR rule (BR-2, BR-3, BR-4 — venueId XOR inline location)
- Auto-assigning creator as Manager (BR-1 — does the code actually create the EventTeamMember?)

- [ ] **Step 4: Convert findings into report rows**

Same as Task 2 Step 4. Area = `Events CRUD`.

- [ ] **Step 5: Append rows to the Events CRUD table**

Edit `docs/audits/2026-04-16-full-audit.md`. Append to `### Events CRUD`.

- [ ] **Step 6: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add /po validate findings for Events CRUD

Pass 3 of 5 — spec-to-implementation alignment check for Events CRUD.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Pass 4 — `/architect review` on Events CRUD

**Files:**
- Read: `docs/patterns.md`, `docs/features/events-crud/plan.md`, same Events CRUD implementation files as Task 4
- Modify: `docs/audits/2026-04-16-full-audit.md` (append to Events CRUD table)

- [ ] **Step 1: Re-read `docs/patterns.md`**

Same patterns, different feature surface.

- [ ] **Step 2: Check each Events CRUD implementation file against patterns**

Same rigor as Task 3 Step 2. Additional areas to pay attention to on this feature:
- Drizzle schema conventions (column naming, defaults, `.notNull()` usage)
- Transaction handling when creating an event also writes to `event_team_members` and `door_sale_tiers`
- GraphQL resolver file organization (matches handler split in patterns.md?)
- Front-end screen component patterns (are screens self-contained or leaking state?)

- [ ] **Step 3: Capture findings**

Classify ❌ / ⚠️ / ✅. Silent on ✅.

- [ ] **Step 4: Convert to report rows**

Area = `Events CRUD`. Severity conventions same as Task 3.

- [ ] **Step 5: Append to the Events CRUD table**

Same table as Task 4 populated — append, do not duplicate.

- [ ] **Step 6: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add /architect review findings for Events CRUD

Pass 4 of 5 — code-vs-patterns compliance check for Events CRUD.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Pass 5 — Doc-currency audit

**Files:**
- Read: `docs/patterns.md`, `docs/business-rules.md`, `docs/design-system.md`, `docs/tech.md`, `docs/backlog.md`, `.claude/skills/po/SKILL.md`, `.claude/skills/architect/SKILL.md`, `.claude/skills/designer/SKILL.md`
- Cross-reference: shipped code under `backend/src/` and `rn-app/`
- Modify: `docs/audits/2026-04-16-full-audit.md` (append to Doc currency table and Agent skills table)

- [ ] **Step 1: Walk `docs/patterns.md` section-by-section**

For each claim (e.g., "services live in `backend/src/domain/<feature>/`"), check it against the actual codebase. Annotate mentally:
- ✅ accurate — still describes reality
- ⚠️ partially stale — mostly right but code has drifted in specific ways
- ❌ contradicted — code does the opposite

Every ⚠️ and ❌ becomes a Doc-currency finding.

- [ ] **Step 2: Walk `docs/business-rules.md` section-by-section**

Same approach. A rule is ❌ if the code lets users do the forbidden thing (or prevents the required thing); ⚠️ if the rule is enforced but the doc phrasing is ambiguous given what the code actually does.

- [ ] **Step 3: Walk `docs/design-system.md` section-by-section**

Check color tokens, typography, component inventory against `rn-app/` — do the documented components exist at the described paths? Are documented tokens actually used in the code (or is everything hardcoded)?

- [ ] **Step 4: Walk `docs/tech.md` section-by-section**

Check every tech/infrastructure claim against the actual stack. Specifically verify: Drizzle (config file, dialect), GraphQL server, urql client, zustand store, expo-router, expo-secure-store. Note anything in the doc that is not present in code, or present in code but not in the doc.

- [ ] **Step 5: Walk `docs/backlog.md`**

Verify each feature's status tag is accurate. Auth is marked DONE; Events CRUD was updated to IN PROGRESS in commit `698296b` — is that accurate given what's shipped, or should it be DONE? Flag inaccuracy as a finding.

- [ ] **Step 6: Walk each skill file**

Read `.claude/skills/po/SKILL.md`, `.claude/skills/architect/SKILL.md`, `.claude/skills/designer/SKILL.md`. For each:
- Are the document ownership claims accurate? (e.g., does PO actually own `business-rules.md` as claimed?)
- Are the listed commands still consistent with the current doc structure?
- Do references to doc paths resolve? (e.g., `docs/plans/2026-02-12-mvp-design.md` — still the right path?)

Findings here go to the **Agent skills** table (not Doc currency).

- [ ] **Step 7: Convert findings and append**

Edit `docs/audits/2026-04-16-full-audit.md`:
- Append rows to `### Doc currency` for findings from Steps 1–5
- Append rows to `### Agent skills` for findings from Step 6

For Doc currency, use the affected doc's path as `Location` (e.g., `docs/patterns.md:42`).

- [ ] **Step 8: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add doc-currency findings

Pass 5 of 5 — checks root docs and agent skill files against
reality of the shipped code.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Cross-cutting synthesis

**Files:**
- Read: `docs/audits/2026-04-16-full-audit.md` (its own state)
- Modify: `docs/audits/2026-04-16-full-audit.md` (populate Cross-cutting table)

- [ ] **Step 1: Read the populated Auth and Events CRUD tables**

Open the report. Read every row in `### Auth` and `### Events CRUD`.

- [ ] **Step 2: Look for recurring themes**

A cross-cutting finding is one that appears in both features — for example:
- Same pattern violation in both (e.g., both features put Zod schemas in handlers instead of services)
- Same class of spec gap (e.g., both specs have error-message wording that doesn't match the code)
- Same architectural smell (e.g., both features leak DB concerns into the GraphQL layer)

A finding is cross-cutting only if the **same** issue exists in both features. A similar but feature-specific nuance stays in its feature table.

- [ ] **Step 3: Write cross-cutting rows**

For each cross-cutting theme, write a row:
- Area = `Cross-cutting`
- Severity = highest severity among the underlying findings
- Description = the theme (e.g., "Input validation scattered across handlers and services — no consistent placement")
- Location = `—` (themes span multiple files)
- Recommended action = the overarching fix (e.g., "Document validation placement in patterns.md and refactor violators")
- Effort = sum of the underlying effort estimates, rounded to the nearest S/M/L

Do **not** remove the per-feature rows. Cross-cutting is additional, not replacement.

- [ ] **Step 4: Append to the Cross-cutting table**

Edit `docs/audits/2026-04-16-full-audit.md`. Append to `### Cross-cutting`.

- [ ] **Step 5: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add cross-cutting findings

Synthesizes themes appearing in both Auth and Events CRUD findings.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Executive summary + finalize

**Files:**
- Read: `docs/audits/2026-04-16-full-audit.md` (full report)
- Modify: `docs/audits/2026-04-16-full-audit.md` (populate Executive Summary, flip Status)

- [ ] **Step 1: Count findings by severity**

Count across every section's table (Auth + Events CRUD + Cross-cutting + Doc currency + Agent skills):
- 🔴 total
- 🟡 total
- 🟢 total

- [ ] **Step 2: Identify the top 5 takeaways**

Pick the 5 findings (or themes) that most matter to the user. Prioritize in this order:
1. Any 🔴 critical finding
2. Cross-cutting themes (they indicate systemic issues)
3. Findings that block the next phases (BDD adoption, Stitch redesign)
4. 🟡 important findings with low effort (quick wins)

Write each takeaway as one sentence.

- [ ] **Step 3: Replace the placeholder counts and takeaways in the Executive Summary**

Edit `docs/audits/2026-04-16-full-audit.md`. Replace:

```markdown
- 🔴 Critical: —
- 🟡 Important: —
- 🟢 Nice-to-have: —

### Top takeaways

_Populated in Task 8._
```

With actual counts and a numbered list of the 5 takeaways.

- [ ] **Step 4: Flip the Status line at the top of the report**

Change:
```markdown
**Status:** In progress
```

To:
```markdown
**Status:** Complete
```

- [ ] **Step 5: Verify every finding row has all six fields populated**

Grep the report for rows that contain `TBD`, `TODO`, empty cells (` \| `), or placeholder hyphens in places other than the Location column.

Run: `grep -nE 'TBD|TODO|\| *\|' docs/audits/2026-04-16-full-audit.md || echo "Clean"`
Expected: `Clean` (or only matches inside the Location column, where `—` is allowed).

If any row is incomplete, fill it in before moving on.

- [ ] **Step 6: Verify severity counts tally with detailed findings**

Count the 🔴 / 🟡 / 🟢 markers across every finding table (excluding the Executive Summary). Confirm the totals in the Executive Summary match.

Run: `grep -c '🔴' docs/audits/2026-04-16-full-audit.md`, `grep -c '🟡' ...`, `grep -c '🟢' ...`
(Remember to subtract 1 from each count — the Executive Summary itself also contains each emoji once.)

- [ ] **Step 7: Commit**

```bash
git add docs/audits/2026-04-16-full-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): add executive summary and mark audit complete

Counts by severity + top 5 takeaways to guide triage into the
subsequent BDD and Stitch redesign phases.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Final handoff

**Files:** none modified

- [ ] **Step 1: Present the final report to the user**

Surface, in the conversation:
- Path to the report: `docs/audits/2026-04-16-full-audit.md`
- The severity counts
- The top 5 takeaways
- Proposed next step: triage findings, then begin the BDD adoption brainstorming

- [ ] **Step 2: Ask whether to push to origin**

Do not push without explicit user confirmation. Present the commit range (`git log --oneline origin/main..HEAD`) and ask.

---

## Dependencies

- The design spec `docs/superpowers/specs/2026-04-16-full-audit-design.md` must be approved (it is, as of 2026-04-16).
- `.claude/skills/po/SKILL.md` and `.claude/skills/architect/SKILL.md` must exist (they do).
- Git working tree must be clean at the start (verify with `git status`).

## What this plan does NOT do

- It does not fix any finding. Every task captures, none remediate.
- It does not run `/designer review` (UI/UX scope is deferred to the Stitch redesign phase).
- It does not add tests (test coverage is an input to the BDD adoption phase, not an audit finding).
- It does not push to origin (explicit user confirmation in Task 9).
