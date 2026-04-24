# Phantom Stream A — Smoke Report

**Date:** 2026-04-24
**Plan:** `docs/superpowers/plans/2026-04-24-phantom-stream-a-setup.md`
**Phantom version:** 0.20.2 (`ghostwright/phantom:latest`)
**Model:** `claude-sonnet-4-6` (switched from `claude-opus-4-7` due to SDK incompatibility — see Finding 2)
**Effort:** `max`

## Exit criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Phantom container healthy, docker socket reachable | ✅ |
| 2 | Repo cloned to `/app/repos/event-queue` on `main @ 7a664fe` | ✅ |
| 3 | Phantom produced a grounded repo summary (9/9 quotes verified) | ✅ |
| 4 | Postgres up via docker compose, accepting connections on host:5432 | ✅ |
| 5 | Backend dev server up, responding to GraphQL introspection | ✅ |
| 6 | 3/3 smoke questions answered correctly | ✅ |

**Overall: Stream A PASSED.**

## Findings — behavior worth remembering before Streams B / C / VMs

### 1. Phantom overclaims memory writes then self-corrects when challenged

After the role-priming prompt, Phantom replied "Role confirmed and recorded." A memory-search verification showed zero Qdrant hits for the expected phrases. When re-prompted, Phantom said *"I stated 'Role confirmed and recorded' earlier, but I hadn't actually written it to Qdrant or to my file-based memory — that was inaccurate of me."*

It then wrote the role to file-based memory at `/home/phantom/.claude/projects/-app/memory/` — verified from the host: `MEMORY.md` and `project_event_queue_role.md` present with correct content.

**Lesson:** memory claims from Phantom are unreliable on first assertion. For critical invariants, always follow up with a verification step that asks Phantom to *show* the written memory, or verify from the host. Architecturally, Qdrant is populated only by the post-session reflection pipeline — file-based memory is the only mid-session-writable tier.

### 2. `claude-opus-4-7` incompatible with Phantom v0.20.2

First role-priming attempt returned `400 "thinking.type.enabled" is not supported for this model`. Phantom's default config pinned `model: claude-opus-4-7` but v0.20.2's wire format still emits the deprecated `thinking.type.enabled` field, which 4.7 rejects in favor of `thinking.type.adaptive` + `output_config.effort`.

Fix: changed `/app/config/phantom.yaml` model to `claude-sonnet-4-6`. Stream A ran entirely on Sonnet 4.6 at `effort: max` — adequate for all tasks, including the 9-file architecture synthesis.

**Lesson:** Before standing up a VM-hosted Phantom, pin `PHANTOM_MODEL=claude-sonnet-4-6` in `.env` (or update to a Phantom version that handles the 4.7 API). Bumping to Opus-4.7 is a config change to make later, not a default.

### 3. Bootstrap login has no maintenance path without Resend

Web-chat login requires a magic token sent via a configured channel. With neither `SLACK_*` nor `RESEND_API_KEY` configured, Phantom prints a first-run bootstrap token to stdout — one-time only. Container restart invalidates sessions. Getting a new token required clearing `first_run_state` in `/app/data/phantom.db` and restarting.

**Lesson:** for the Traact/Sentinelu VMs, set `RESEND_API_KEY` + `OWNER_EMAIL` on day one. Grepping container logs for bootstrap tokens across VM restarts is not a sustainable pattern.

### 4. `DOCKER_GID` defaults are wrong for most hosts

Phantom's compose defaults `DOCKER_GID=988`. Ubuntu/WSL hosts typically use `1001`. Without the override, Phantom cannot talk to the host docker socket — every Task 7/8 step would fail silently.

**Lesson:** `stat -c '%g' /var/run/docker.sock` and set `DOCKER_GID` in `.env` is a mandatory first-boot step. Add it to the VM setup script.

### 5. Phantom networks and sibling containers are isolated by default (my plan was wrong)

My plan Task 8 Step 2 predicted `DATABASE_URL=localhost` would fail because `localhost` resolves to Phantom's own loopback. I proposed `host.docker.internal` as the fix. **That would not have worked** — Phantom runs on `phantom_phantom-net` (`172.20.0.x`) and the `docker compose up` from Task 7 creates Postgres on `event-queue_default` (`172.19.0.x`). The two bridges don't route between each other, and `host.docker.internal` adds a layer of indirection that still fails on Linux hosts.

Phantom diagnosed this itself, ran `docker network connect event-queue_default phantom`, then set `DATABASE_URL=postgres://postgres:postgres@event-queue-postgres:5432/event_queue` using the sibling's service-name DNS. Backend connected cleanly.

**Lesson:** the Stream B/C plans (and VM setup) should bake in the network-join step as part of "start the stack." The expected DATABASE_URL pattern is `postgres://.../@<compose-service-name>:5432/...`, not `localhost`.

### 6. pnpm isn't installed in Phantom's container (Bun-shimmed Node, no corepack)

Phantom's container has Bun as the JS runtime. `npm`, `npx`, and `corepack` are either absent or shimmed in a way that doesn't work for corepack-activated package managers. Phantom fell back to the official standalone installer `get.pnpm.io/install.sh` → `~/.local/share/pnpm/`.

**Lesson:** any pnpm-based project will need the installer step on first clone. For the VMs, bake `pnpm` into the image (or a project-specific init script) so fresh containers aren't blocked.

### 7. `rn-app` postinstall fails inside Phantom because `npx` is absent

Phantom's `pnpm install` succeeded for the backend but the rn-app's postinstall hook (`npx tailwindcss -i ./global.css -o ./node_modules/.cache/nativewind/global.css`) errored with `sh: 1: npx: not found`. This does not affect the backend. For Stream B the rn-app is out of scope so this doesn't block, but **any future stream that touches the rn-app inside Phantom will need `npx` (i.e. Node installed alongside Bun)**.

### 8. Phantom self-imposes secret-handling constraints beyond the prompt

Asked to paste the contents of `backend/.env` including the newly-generated `JWT_SECRET`, Phantom refused: *"The JWT_SECRET is a credential, and the security rules I operate under prohibit including keys or secrets in my responses, even ones I generated myself."* It confirmed the key's length and format instead.

**Positive finding** — this is the behavior you want before giving a Phantom access to real company credentials on the Traact/Sentinelu VMs.

### 9. Phantom handles stop conditions correctly and offers parallelism

When a consolidated Tasks-8+9 prompt hit `pnpm: command not found`, Phantom stopped at the explicit stop condition, reported the blocker, and proactively offered to run the file-read-only sub-tasks (5a/b/c) in parallel while waiting for a decision. Good agentic behavior.

### 10. Turn-boundary stalls during extended thinking

Two separate times Phantom's reply ended mid-plan ("Let me fix that now by writing it properly:" and later "Running the three searches now to confirm the current Qdrant state:"), with no follow-through in the same turn. The chat-UI SSE connection also showed a stuck "Thinking..." spinner after one turn had actually completed server-side — a page refresh showed the final state.

**Lesson:** with `effort: max`, expect occasional chat-UI / turn-boundary weirdness. A simple "continue" nudge recovered both stalls. Worth noting if you script multi-turn automation around Phantom.

## Architecture answers — verified claims (5a / 5b / 5c)

Phantom's answers to the three smoke questions were spot-checked against `/home/gus/event-queue` on the host:

| Claim | Source file / line | Verdict |
|---|---|---|
| 5a — 5 tables, PKs are CUID2 varchar(24) | `backend/src/db/schema.ts` | ✅ exact (user, venue, event, event_team_member, door_sale_tier) |
| 5a — Composite unique index on (eventId, userId) | `backend/src/db/schema.ts:56` | ✅ exact |
| 5b — signUp resolver mapping | `backend/src/graphql/resolvers/index.ts:33` | ✅ exact |
| 5b — Argon2id, memoryCost 2^16, timeCost 3 | `backend/src/domain/auth/common/password.service.ts:7-10` | ✅ exact |
| 5b — JWT issuer/audience env-configurable, defaults `event-queue-app` / `event-queue-users` | `backend/src/domain/auth/common/jwt.service.ts:21-22,38-39` | ✅ exact |
| 5c — requireAuth throws GraphQLError with code `UNAUTHENTICATED` | `backend/src/graphql/handlers/common/require-auth.ts:14-17` | ✅ exact |
| 5c — 12 handlers call requireAuth (signUp/signIn/me public) | full grep across `backend/src/graphql/handlers/` | ✅ exactly 12 unique files |

## Observations that matter for Stream B

- `pnpm install` takes ~60-90s inside Phantom's container. Budget accordingly for Stream C CI-like runs (every test-suite invocation after a fresh clone pays this cost).
- Backend dev server binds `http://localhost:4000/graphql`. Test harness should point E2E at that URL from inside Phantom's container.
- DATABASE_URL pattern for Stream B's Gherkin/Vitest runs against live DB: `postgres://postgres:postgres@event-queue-postgres:5432/event_queue` (service-name DNS, not localhost). Phantom's container must be network-joined to `event-queue_default` first.
- `me` query has no `requireAuth` call — it returns `null` when unauthenticated. Any Gherkin scenario asserting "unauth sees null for me" should match that; scenarios asserting "unauth is blocked" should not include `me`.
- Events CRUD DoorSaleTier lifecycle invariant ("disable → tiers preserved but inactive, re-enable → same tiers restored") is stated in the events-crud spec — a high-value Gherkin scenario for Stream B since it's an invariant rather than a CRUD path.

## Open questions for Stream B plan

- Does Phantom's network-join to `event-queue_default` survive a Phantom container restart, or does it need to be re-applied each boot?
- Do we install `npx` in Phantom's image (unblocking rn-app tooling) or keep Stream B API-only and defer rn-app E2E permanently?
- Which SDK-version / Phantom-version bump unblocks `claude-opus-4-7`? Track upstream releases before Stream B's second iteration.

## Costs and budget

- Starting Anthropic credit: $50.00
- At-end remaining: $46.10
- Approximate cost of Stream A: **$3.90**

Breakdown (rough): ~$0.66 up through role-priming + clone + docs-read summary; ~$3.24 for the consolidated Tasks-8+9 prompt (pnpm install failure + network diagnosis + backend boot + GraphQL introspection + three architecture answers, all at `effort: max` with heavy Read usage).

Sonnet 4.6 at `effort: max` on a multi-file synthesis and a consolidated multi-step prompt burns noticeably. For Stream C, drop to `effort: medium` by default and reserve `max` for specific synthesis tasks. Budget ~$5 per Stream A equivalent if you rerun this from scratch on a VM.
