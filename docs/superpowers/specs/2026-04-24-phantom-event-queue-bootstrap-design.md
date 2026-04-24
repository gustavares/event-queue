# Phantom + Event-Queue Bootstrap — Design

**Date:** 2026-04-24
**Status:** Design approved, pending implementation plan

## Goal

Stand up a locally-running Phantom instance as a read-only assistant and runtime-verification agent for the event-queue repo. Validate the "agent with its own computer" value proposition against a real project before committing to per-company VMs (Traact, Sentinelu). Lay the groundwork for Phantom to author code later, in parallel with Claude Code on the developer's laptop.

## Motivation

- The developer already uses Claude Code for event-queue with a mature workflow (`/po`, `/architect`, `/designer`, superpowers plugins). Phantom is being evaluated as a *complement*, not a replacement: an always-on agent with its own compute, reachable from Slack, that can verify work and — eventually — contribute code in parallel.
- The end-game is one Phantom per company (Traact, Sentinelu) running on Hetzner VMs, driven from Slack, with each Phantom's memory pointing at its respective `traact-memories` / `sentinelu-memories` repo.
- Event-queue is a personal project with a reasonably rich codebase (TypeScript monorepo, GraphQL backend, React Native app, Go service) and pre-existing Claude Code conventions, making it a realistic stress test before committing to the multi-VM rollout.
- Today the repo has essentially no automated tests (one Go test file, no backend unit tests, no E2E). The "runtime-verification" value of Phantom requires a test suite to run; building that suite is useful regardless of Phantom.

## Scope

### In scope

- Bring a local Phantom container online against the event-queue repo (web chat channel only for first pass)
- Phantom clones `github.com/gustavares/event-queue` into its own container workspace, reads the repo docs, and can boot the stack via `docker-compose up`
- Introduce a BDD test harness to the event-queue repo: Gherkin `.feature` files, `@cucumber/cucumber` + Playwright for API-level E2E, Vitest for backend unit tests covering business rules
- Encode existing prose specs (`docs/features/auth/spec.md`, `docs/features/events-crud/spec.md`) as plain-English Gherkin scenarios
- Backend unit tests covering the business rules enumerated in `docs/business-rules.md`
- First convergence test: Phantom runs the full test suite inside its container and reports pass/fail against acceptance criteria

### Out of scope

- Slack channel configuration (deferred until web chat loop is validated)
- MCP wiring back into Claude Code / Claude Desktop (deferred)
- Phantom writing or modifying event-queue code (explicitly phase 2 — Phantom is read-only + runtime in this phase)
- Porting `/po`, `/architect`, `/designer` skills into Phantom's skill system (phase 2, once Phantom is authoring code)
- rn-app E2E coverage (API-level is enough for the first pass; UI E2E can come after)
- Integration with `traact-memories` / `sentinelu-memories` repos (those are for the per-company VMs, not this personal-project test)
- Email-identity (`RESEND_API_KEY`), Telegram, Webhook channels
- Hetzner VM provisioning (the endgame — deferred until the local loop is proven)
- Phantom self-evolution config tuning (use defaults)

## Decisions locked during brainstorming

| Decision | Chosen option |
|----------|---------------|
| Phantom access scope | Read-only + runtime (can clone, read, run `docker-compose`, run tests — cannot push, commit, or open PRs) |
| Communication channel (first pass) | Phantom web chat at `http://localhost:3100/chat` |
| Auth for web chat | Operator token generated via `docker exec phantom bun run phantom token create --client web-chat --scope operator` |
| How Phantom gets the repo | `git clone` over HTTPS inside its container (repo is public, no credentials needed) |
| Memory integration | None — this personal-project Phantom is isolated from `traact-memories` / `sentinelu-memories` |
| LLM provider | Anthropic (default), existing `ANTHROPIC_API_KEY` in `.env` |
| BDD format | Gherkin `.feature` files, plain English, no framework gymnastics |
| Gherkin file location | `docs/features/<feature>/*.feature` alongside existing `spec.md` |
| E2E runner | `@cucumber/cucumber` + Playwright, hitting the GraphQL endpoint over HTTP |
| Backend unit-test runner | Vitest |
| Test-harness authorship | Done in Claude Code on the laptop (not in this Phantom session) — Phantom runs tests, doesn't write them in this phase |
| Validation target | Phantom can answer non-trivial architecture questions AND run the full test suite green AND report which acceptance criteria the current implementation satisfies |

## Streams

The work runs as three streams, two of which (A and B) are independent and can happen in parallel.

### Stream A — Phantom setup

1. Verify Phantom container health (`curl http://localhost:3100/health`, check logs).
2. Generate an operator token for the web chat, log in.
3. First-session onboarding: tell Phantom the role (read-only assistant + runtime verifier for event-queue).
4. Have Phantom `git clone https://github.com/gustavares/event-queue.git` into its workspace.
5. Have Phantom read `CLAUDE.md`, `BOOTSTRAP.md`, `docs/tech.md`, `docs/business-rules.md`, `docs/features/auth/spec.md`, `docs/features/events-crud/spec.md`.
6. Have Phantom start the stack via `docker-compose up -d` inside its container (Postgres + backend).
7. Smoke questions: "explain the event-queue data model in one paragraph", "what happens when a request hits the `signUp` mutation?", "which mutations require authentication and how is that enforced?".
8. **Exit criterion:** Phantom answers the smoke questions correctly AND the backend is up and responding to a GraphQL introspection query from within its container.

### Stream B — Test harness (authored in Claude Code on laptop)

1. Add `@cucumber/cucumber`, `playwright`, `vitest` to `backend/package.json` devDependencies.
2. Create `backend/vitest.config.ts` and wire `pnpm test` to invoke it.
3. Create Gherkin files derived from existing prose specs:
   - `docs/features/auth/auth.feature` — sign-up, sign-in, JWT issuance, password hashing constraints
   - `docs/features/events-crud/events-crud.feature` — create/read/update/delete event flows plus venue associations, per the existing spec
4. Create step-definitions under `backend/e2e/steps/` that translate Gherkin into GraphQL calls against a running backend.
5. Create `backend/e2e/cucumber.cjs` pointing at the steps directory; wire `pnpm e2e` to run cucumber against a backend started via `docker-compose.yml`.
6. Author Vitest unit tests for each rule in `docs/business-rules.md`, organised under `backend/src/domain/**/*.test.ts`.
7. Commit and push on a feature branch; merge to `main` once green.
8. **Exit criterion:** `pnpm test` and `pnpm e2e` both green on the laptop.

### Stream C — Convergence

Runs once A and B are both green.

1. In the Phantom chat, instruct Phantom to `git pull` the latest `main` (which now contains the test harness).
2. Phantom installs deps (`pnpm install`) and runs `pnpm test` and `pnpm e2e` inside its container.
3. Phantom reports: which feature files pass, which scenarios fail, which business-rule unit tests fail.
4. Phantom cross-references scenario names against the acceptance criteria listed in `docs/features/<feature>/spec.md` and reports which criteria are currently satisfied by the implementation.
5. **Exit criterion:** Phantom produces a report like "Auth: 8/8 scenarios pass, all acceptance criteria satisfied. Events CRUD: 12/14 scenarios pass, criteria X and Y unsatisfied" — grounded in actual test output, not hallucinated.

## Architecture (first pass)

```
Developer laptop                          Phantom container (Docker on laptop)
+----------------+                        +-----------------------------------+
| Claude Code    |                        | Phantom (Bun process)             |
|   /po          |                        |   - web chat on :3100             |
|   /architect   |     Stream B:          |   - operator token auth           |
|   /designer    |     writes tests       |   - Anthropic provider            |
|   superpowers  |     on `main`          |                                   |
+-------+--------+                        |   Workspace:                      |
        |                                 |   /workspace/event-queue          |
        | git push                        |     (cloned over HTTPS)           |
        v                                 |                                   |
+----------------+     Stream A clone,    |   Sibling containers (via         |
| github.com/    +------Stream C pull----->   docker socket mount):           |
| gustavares/    |                        |     postgres (from compose)       |
| event-queue    |                        |     backend (dev server)          |
+----------------+                        +-----------------------------------+
                                                  |
                                                  v
                                          Stream C: runs pnpm test + pnpm e2e,
                                          reports pass/fail against spec.md
                                          acceptance criteria in web chat.
```

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Phantom's container can't spawn sibling containers for `docker-compose` | Compose file already mounts `/var/run/docker.sock` per Phantom's default; verify in Stream A step 6 before going further. |
| Stream B bloats into rewriting business logic | Hard scope: tests only codify existing behavior specified in `spec.md` + `business-rules.md`; any divergence found is logged as a finding, not fixed in this stream. |
| Phantom "hallucinates" test results rather than running them | Stream C's exit criterion requires Phantom to paste the raw test output alongside its summary. |
| Gherkin in `docs/features/<feature>/` conflicts with existing `spec.md` convention | `.feature` files live *alongside* `spec.md`, not replace it. `spec.md` remains the canonical prose; `.feature` is the executable restatement. |
| Phantom chat session loses context mid-test | The self-evolution + persistent memory system is the native mitigation; verify memory is being written after the first session. |

## Out of this spec — pointers for phase 2

- Phantom authoring code requires: (a) write access to GitHub via a fine-grained PAT stored through Phantom's encrypted-secrets flow, (b) porting the `/po` `/architect` `/designer` skills into Phantom's `skills-builtin/` or a project-local skills dir, (c) deciding the coordination model when Claude Code and Phantom work the same repo in parallel (separate branches? Phantom-only labels?).
- Hetzner VM rollout for Traact / Sentinelu reuses this spec's patterns but swaps web chat for Slack and points memory at the `*-memories` repos.

## Open questions (answer during implementation planning, not now)

- Does Phantom's default operator-scope token allow `git clone` + `docker compose up` inside the container, or is a different scope required?
- Does the existing `docker-compose.yml` expose Postgres on a port that the backend-in-container can reach when spun up as a sibling under Phantom's docker socket, or do we need a compose override?
- Which Playwright transport — plain `fetch` against the GraphQL endpoint, or `@playwright/test` `request` context — gives the least-ceremony cucumber integration?
