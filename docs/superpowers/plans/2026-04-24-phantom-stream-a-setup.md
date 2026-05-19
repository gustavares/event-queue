# Phantom Stream A — Setup Runbook

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note:** This is an operational runbook, not a TDD plan. Most tasks are "paste this into Phantom's chat and confirm the reply / run this on the host and verify output." No commits, no test-first cycle — Stream A writes no application code. Stream B (to be planned separately) is where TDD applies.

**Goal:** Bring the local Phantom container online against `github.com/gustavares/event-queue` as a read-only assistant + runtime-verification agent, such that Phantom can answer non-trivial architecture questions about the repo and has the event-queue stack running inside its container environment.

**Architecture:** Operator interacts with Phantom via the web chat at `http://localhost:3100/chat` using an operator-scope bearer token. Phantom `git clone`s the public event-queue repo into its persistent `/app/repos` volume and spawns sibling containers for `docker-compose up` via the mounted host docker socket. No code is written to event-queue in this stream.

**Tech Stack:** Phantom (Bun, `ghostwright/phantom:latest`), Docker Desktop (host), event-queue backend (Node 20 + graphql-yoga + Drizzle + Postgres via compose).

**Spec:** `docs/superpowers/specs/2026-04-24-phantom-event-queue-bootstrap-design.md`

---

## Prerequisites

Before Task 1, confirm the following on the host:

- Phantom container is running (`docker ps --filter name=phantom` shows `Up`)
- `curl http://localhost:3100/health` returns 200
- `.env` next to the Phantom compose file has `ANTHROPIC_API_KEY` set
- Docker socket is mounted into the Phantom container (verified later in Task 1 step 3)

If any of these fails, stop and fix before starting Task 1.

---

### Task 1: Pre-flight verification

**Goal:** Confirm the Phantom container has everything it needs to clone a repo and spawn sibling containers — the two primary host-side capabilities Stream A relies on.

**Files:** None (host shell only).

- [ ] **Step 1: Verify Phantom container is up and healthy**

Run on host:
```bash
docker ps --filter name=phantom --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -fsS http://localhost:3100/health
echo
```
Expected: `phantom` row shows `Up`, curl prints a JSON body containing `"status":"ok"` (or equivalent). If health returns 5xx, run `docker logs phantom --tail 100` and stop — triage is out of scope for this plan.

- [ ] **Step 2: Verify Phantom can reach the internet (for git clone)**

Run on host:
```bash
docker exec phantom curl -fsS -o /dev/null -w '%{http_code}\n' https://github.com
```
Expected: `200` (or 301). If this returns 000 or times out, Phantom's DNS/egress is broken — fix before proceeding (often a `1.1.1.1` / systemd-resolved issue; see `docker-compose.yaml` `dns:` block).

- [ ] **Step 3: Verify Phantom can talk to the host docker socket**

Run on host:
```bash
docker exec phantom docker ps --format '{{.Names}}' | head -5
```
Expected: prints container names including `phantom`, `phantom-qdrant`, `phantom-ollama`. If this fails with "permission denied" the `DOCKER_GID` in `.env` does not match the host's docker group id — run `stat -c '%g' /var/run/docker.sock` on the host, set `DOCKER_GID` in the Phantom `.env`, and `docker compose up -d` the Phantom stack again.

- [ ] **Step 4: Confirm the repos volume is mounted**

Run on host:
```bash
docker exec phantom ls -la /app/repos
```
Expected: directory exists (may be empty). If the path is missing, the compose file volume mapping has drifted — stop and fix.

---

### Task 2: Generate an operator token for the web chat

**Goal:** Produce a bearer token that grants operator-scope access to the Phantom web chat, and cache it locally so re-login in Task 3 is trivial.

**Files:**
- Create (host): `/home/gus/phantom/.chat-token` (not committed; gitignored by being outside the event-queue repo)

- [ ] **Step 1: Generate the token**

Run on host:
```bash
docker exec phantom bun run phantom token create --client web-chat --scope operator
```
Expected: command prints a line containing a token string (typically a JWT or opaque string of 40+ chars). Copy exactly the token value — not the surrounding text.

- [ ] **Step 2: Save the token to a local file for later reference**

Run on host (replace `<TOKEN>` with the copied value):
```bash
printf '%s\n' '<TOKEN>' > /home/gus/phantom/.chat-token
chmod 600 /home/gus/phantom/.chat-token
cat /home/gus/phantom/.chat-token | head -c 20; echo ...
```
Expected: prints the first 20 chars of the token followed by `...`, confirming the file was written and is readable only by you.

- [ ] **Step 3: Verify the token works against the Phantom API**

Run on host:
```bash
TOKEN=$(cat /home/gus/phantom/.chat-token)
curl -fsS -H "Authorization: Bearer $TOKEN" http://localhost:3100/api/whoami || echo "whoami endpoint failed — try /health auth or web UI"
```
Expected: a JSON body showing the token's identity (user / scope / client). If `/api/whoami` doesn't exist on this Phantom version, skip — Task 3 will validate the token via browser login.

---

### Task 3: Log into the web chat

**Goal:** Active authenticated browser session to `http://localhost:3100/chat`.

**Files:** None.

- [ ] **Step 1: Open the web chat**

In a browser: navigate to `http://localhost:3100/chat`. Expected: the "Welcome back" login page renders.

- [ ] **Step 2: Paste the token**

Paste the token from `/home/gus/phantom/.chat-token` into the **Access token** field. Click **Continue**.

Expected: the page transitions to the Phantom chat interface. A message input box is visible. If the page errors with "invalid token," the token was copied with leading/trailing whitespace — regenerate (Task 2 Step 1) or trim.

- [ ] **Step 3: Confirm the session is alive**

In the chat, send: `hi, confirm you can hear me and tell me your current role + the model you are running on.`

Expected: Phantom replies with (a) an acknowledgement, (b) its current role label (likely "default" or a generic assistant persona — that is fine for now), (c) the model id (likely `claude-opus-4-7` or similar, whatever is in the Phantom `.env` / config).

---

### Task 4: Prime Phantom with the event-queue role context

**Goal:** Establish Phantom's understanding of what event-queue is and what Phantom's job in this session is. This is a prompt, not code — but Phantom's self-evolution engine should pick up on it and keep it across future sessions.

**Files:** None (chat message only).

- [ ] **Step 1: Send the role-priming prompt**

Paste this exact message into the web chat:

```
Context for this session, and for future sessions on this topic:

I am evaluating you as a runtime-verification assistant for a personal project called "event-queue" at https://github.com/gustavares/event-queue. The repo is public.

Your role in this session (and subsequent sessions about event-queue) is:
1. READ-ONLY assistant — you may clone, read, and reason about the repo, but you MUST NOT push, commit, open PRs, or modify anything on GitHub.
2. RUNTIME verifier — you may install deps, run docker-compose, start services, and run test suites inside your own container.

The repo uses:
- pnpm monorepo
- backend/ — Node 20 + graphql-yoga + Drizzle + Postgres
- rn-app/ — React Native + Expo (ignore for this session)
- go-app/ — a Go service (secondary for this session)
- docker-compose.yml at the root starts Postgres

Before any action that would modify GitHub state, stop and ask me. Before installing anything on your host OS (outside of containers), stop and ask me.

Confirm you have recorded this role and will operate accordingly.
```

Expected: Phantom confirms the role, summarizes the constraints back in its own words, and notes it will record them to memory. If Phantom instead jumps ahead and starts cloning, stop it and repeat the prompt emphasizing "confirm ONLY — no actions yet."

- [ ] **Step 2: Verify memory write (optional but recommended)**

Send: `paste back the role you just recorded, reading from your memory system, not from this chat's recent context.`

Expected: Phantom reads its persistent memory (Qdrant-backed) and paraphrases the role. If it returns "I have no memory of this," the memory subsystem isn't writing — not a blocker for Stream A, but flag it as an issue for Stream C, where memory retention becomes load-bearing.

---

### Task 5: Have Phantom clone the repo into its workspace

**Goal:** event-queue checked out at `/app/repos/event-queue` inside the Phantom container, on the `main` branch at the latest HEAD.

**Files:**
- Create (Phantom container): `/app/repos/event-queue/` (full clone)

- [ ] **Step 1: Instruct Phantom to clone**

Paste into chat:

```
Clone https://github.com/gustavares/event-queue.git into /app/repos/event-queue using https (no auth needed, the repo is public). After the clone, run `git -C /app/repos/event-queue log -1 --oneline` and paste the output back to me.
```

Expected: Phantom runs `git clone`, then `git log -1 --oneline` and returns a single line like `<sha> docs: add Phantom + event-queue bootstrap design spec` (the commit from this brainstorming session — note: only if the brainstorm branch was pushed; if not, expect whatever the current `main` HEAD is).

If Phantom refuses on the grounds of "I cannot execute arbitrary shell commands," check that it actually has the Bash / shell tool enabled — this is a Phantom configuration issue, not a prompt issue.

- [ ] **Step 2: Verify the clone from the host**

Run on host:
```bash
docker exec phantom ls /app/repos/event-queue | head
docker exec phantom git -C /app/repos/event-queue rev-parse --abbrev-ref HEAD
```
Expected: lists `README.md`, `backend`, `docker-compose.yml`, `docs`, etc. Branch is `main`.

---

### Task 6: Have Phantom read the repo docs and summarize

**Goal:** Phantom has ingested enough repo context to answer architecture questions accurately. No hallucinated specifics.

**Files:** None.

- [ ] **Step 1: Send the read-and-summarize prompt**

Paste into chat:

```
Read these files from /app/repos/event-queue and write a single-paragraph summary (max 8 sentences) of the project's architecture and current state. Do NOT infer or embellish — only state what these files actually say.

Files to read, in order:
1. CLAUDE.md
2. README.md
3. BOOTSTRAP.md
4. docs/tech.md
5. docs/business-rules.md
6. docs/backlog.md
7. docs/features/auth/spec.md
8. docs/features/events-crud/spec.md
9. docs/audits/2026-04-16-full-audit.md (skim — just the top-line finding count and status)

End your summary with a "grounding check" section that quotes one specific sentence from each file by its heading, so I can verify you actually read them.
```

Expected: Phantom produces a summary that mentions (a) "Brazilian nightlife venues" / guest-list / door-management (from CLAUDE.md), (b) graphql-yoga + Drizzle + Postgres (from tech.md), (c) Auth and Events CRUD are shipped (from backlog.md), (d) the audit finding count (106 findings / 18/65/23 by severity). The grounding-check section quotes real sentences from each file.

- [ ] **Step 2: Validate the summary**

Cross-check 2-3 of Phantom's "grounding check" quotes against the actual files by reading them on the host (`gh api repos/gustavares/event-queue/contents/<file>` or locally from `/home/gus/event-queue`). If any quote is fabricated, flag it — that means Phantom is hallucinating file reads and Stream C's value prop collapses. Stop and investigate before continuing.

---

### Task 7: Have Phantom start the event-queue stack

**Goal:** Postgres running as a sibling container, reachable from whatever network the backend-in-container (later) will also join.

**Files:**
- Runtime (not persistent): sibling container `event-queue-postgres` (exact name depends on compose project name)

- [ ] **Step 1: Prep the backend .env**

Paste into chat:

```
In /app/repos/event-queue/backend, copy .env.example to .env. Then generate a strong JWT_SECRET with `openssl rand -hex 32` and set it in that .env. DATABASE_URL should already be set in .env.example to something like postgres://... — leave it as-is. Paste back the contents of the new .env file.
```

Expected: Phantom returns a `.env` with both `DATABASE_URL` and `JWT_SECRET` populated. `JWT_SECRET` is a 64-char hex string.

- [ ] **Step 2: Start the compose stack**

Paste into chat:

```
From /app/repos/event-queue, run `docker compose up -d` and then `docker compose ps`. Paste the output of both.

After the stack is up, check Postgres is actually accepting connections by running:
  docker compose exec -T postgres pg_isready -U postgres

Paste that output too.

(Compose file: only `postgres` service is active — backend and rn-app are commented out. Postgres user/password/db are all `postgres`/`postgres`/`event_queue`, exposed on host port 5432.)
```

Expected: `docker compose ps` shows at least one service (postgres) with state `running`. `pg_isready` prints `accepting connections`. If compose fails with "permission denied on docker.sock" — Task 1 Step 3 didn't actually confirm write access; fix `DOCKER_GID`.

- [ ] **Step 3: Verify from the host too**

Run on host:
```bash
docker ps --filter "label=com.docker.compose.project=event-queue" --format 'table {{.Names}}\t{{.Status}}'
```
Expected: at least one container in the `event-queue` project, up and healthy. Container names are created by Phantom-as-compose-client but should be visible to the host (docker socket is shared).

---

### Task 8: Verify the backend responds to GraphQL introspection

**Goal:** Backend dev server running inside Phantom's container (or as a sibling), responding to GraphQL.

**Note:** The compose file may or may not start the backend itself — event-queue's compose is primarily for Postgres. If backend isn't in compose, Phantom needs to start it with `pnpm dev` from `/app/repos/event-queue/backend` after `pnpm install`.

**Files:** None.

- [ ] **Step 1: Install backend deps inside Phantom's container**

Paste into chat:

```
Run `pnpm install` from /app/repos/event-queue. This may take a minute or two. Paste the last 20 lines of output.
```

Expected: install completes with no errors. If `pnpm` is not installed in Phantom's container, install it first: `npm i -g pnpm@9` (confirm with the user first since it touches the container's global npm).

- [ ] **Step 2: Start the backend dev server in the background**

Paste into chat:

```
From /app/repos/event-queue/backend, start the dev server in the background:
  nohup pnpm dev > /tmp/backend.log 2>&1 &
  sleep 5
  tail -30 /tmp/backend.log

Paste the tail.
```

Expected: log shows graphql-yoga starting on port 4000 (matches the commented-out backend service in docker-compose.yml). No errors about DATABASE_URL or JWT_SECRET.

**Likely snag — networking between Phantom and sibling Postgres:** `backend/.env.example` probably sets `DATABASE_URL=postgres://postgres:postgres@localhost:5432/event_queue`. That `localhost` resolves to Phantom's *own* container loopback, not the sibling Postgres container. If the dev server crashes with `ECONNREFUSED` to Postgres, two fixes (in order of preference):

1. Change `DATABASE_URL` host to `host.docker.internal` (works on Docker Desktop) — Postgres is bound to host `0.0.0.0:5432` so this will reach it.
2. Attach Phantom's container to the `event-queue_default` network with `docker network connect event-queue_default phantom` (from host), then use `postgres:5432` as the host (service DNS name).

Go with option 1 first — it's reversible and doesn't touch Phantom's networking config.

- [ ] **Step 3: Run a GraphQL introspection query**

Paste into chat:

```
Run this curl against the backend:

curl -fsS -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __schema { queryType { name } mutationType { name } types { name } } }"}'

Paste the full response body. If the dev server is actually on a different port (check /tmp/backend.log), use that port instead.
```

Expected: JSON with `data.__schema.queryType.name` = `Query`, `mutationType.name` = `Mutation`, and a `types` array containing entries like `User`, `Event`, `Venue` (per schema.ts). If the response is an HTML error page, the backend isn't actually listening on that port — check the dev-server log.

---

### Task 9: Smoke test — architecture questions

**Goal:** Phantom answers three non-trivial questions correctly, grounded in the actual code, with no hallucinated specifics.

**Files:** None.

- [ ] **Step 1: Question 1 — data model**

Send: `Read /app/repos/event-queue/backend/src/db/schema.ts and explain the full data model in 4-6 sentences. List each table, its primary key, and any foreign-key relationships. Quote the exact column names.`

Expected answer mentions: `users`, `events`, `venues` (plus any others present), with correct PK/FK relationships per the actual schema file. Cross-check by reading `/home/gus/event-queue/backend/src/db/schema.ts` on the host.

- [ ] **Step 2: Question 2 — request lifecycle**

Send: `Trace what happens, step by step, when a client calls the signUp mutation against this backend. Cite the exact files and function names involved. Include password hashing, DB write, and JWT issuance.`

Expected answer traces: resolver in `backend/src/graphql/**` → service/domain layer → Argon2 hash → Drizzle insert into `users` → JOSE JWT signing with `JWT_SECRET`. The answer should cite *real* file paths and function names. Cross-check by grepping the repo on the host.

- [ ] **Step 3: Question 3 — auth enforcement**

Send: `Which GraphQL mutations and queries in this backend require authentication? How is authentication enforced — is it per-resolver, via middleware, via GraphQL shield, or something else? Cite the exact code that performs the check.`

Expected answer identifies the auth mechanism correctly (likely context-based: JWT verified in `createContext`, `ctx.user` populated, resolvers check `ctx.user`). Again — cross-check against the actual source, not against Phantom's confidence.

- [ ] **Step 4: Verdict**

On the host, read the three answers, cross-check against real code in `/home/gus/event-queue`, and record (in a new file `/home/gus/event-queue/docs/audits/2026-04-24-phantom-stream-a-smoke.md` — not yet created, not yet committed) a pass/fail verdict per question.

Exit criterion for Stream A: at least 2 of 3 questions pass without hallucination. If 3/3 pass, Stream A is solid. If only 1/3 or 0/3 pass, the model or grounding is insufficient — revisit role-priming (Task 4) and / or model choice in Phantom's `.env` before attempting Stream C.

---

### Task 10: Exit-criterion check and handoff notes

**Goal:** Explicit pass/fail signal on Stream A, and captured notes that unblock Stream B planning.

**Files:**
- Create: `/home/gus/event-queue/docs/audits/2026-04-24-phantom-stream-a-smoke.md`

- [ ] **Step 1: Write the audit note**

Create the file with:

```markdown
# Phantom Stream A — Smoke Report

**Date:** 2026-04-24
**Plan:** docs/superpowers/plans/2026-04-24-phantom-stream-a-setup.md

## Exit criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Phantom container healthy, docker socket reachable | ✅ / ❌ |
| 2 | Repo cloned to /app/repos/event-queue | ✅ / ❌ |
| 3 | Phantom produced a grounded repo summary with real quotes | ✅ / ❌ |
| 4 | Postgres up via docker compose, accepting connections | ✅ / ❌ |
| 5 | Backend dev server up, responding to GraphQL introspection | ✅ / ❌ |
| 6 | ≥2/3 smoke questions answered correctly | ✅ / ❌ |

## Observations that matter for Stream B

- Did Phantom hallucinate any file contents? If yes, note which.
- How long did `pnpm install` take inside the container? (informs Stream B CI-like runs)
- Did the memory-write verification (Task 4 Step 2) succeed?
- Which port did the backend end up on?
- Any friction with `DOCKER_GID` / docker socket? Any other surprises?

## Open questions for Stream B plan

- Is the Phantom-inside-container setup stable across `docker compose restart phantom` (workspace survives via phantom_repos volume)?
- What's the right test-run command for Stream C — `pnpm test && pnpm e2e` from /app/repos/event-queue, or a dedicated script?
```

- [ ] **Step 2: Fill in the checkmarks honestly**

Mark each row ✅ or ❌ based on what actually happened in Tasks 1-9. If anything's ❌, Stream A is **not complete** — fix the blocker and re-run the relevant task. Do not proceed to Stream B planning until this table is all-✅ or you have an explicit decision to proceed with known-failures documented.

- [ ] **Step 3: Commit the audit note**

Run on host from `/home/gus/event-queue`:
```bash
git add docs/audits/2026-04-24-phantom-stream-a-smoke.md
git commit -m "docs: add Stream A smoke report"
git log --oneline -3
```
Expected: commit lands on `phantom-bootstrap-brainstorm` branch. Do NOT push yet — branch is kept local until the user explicitly asks.

---

## What's next (not in this plan)

- **Stream B plan** — will be written in a separate `writing-plans` session once Stream A is done and the smoke report is in. Stream B will use full TDD task structure because it writes actual code (Gherkin `.feature` files, Vitest configs, cucumber step defs).
- **Stream C plan** — short runbook, written once Stream B lands.
- **Slack channel** — deferred per spec until the web chat loop is proven sustainable across multiple sessions.
