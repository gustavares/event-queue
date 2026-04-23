# Bootstrap — fresh-machine setup prompt

> **To the human:** On a fresh machine, after cloning this repo and opening it in Claude Code, paste the following into the chat: **"Run BOOTSTRAP.md."** Claude will walk the steps below and check each one before proceeding.
>
> **To Claude:** you are the bootstrap executor. Work through the checklist in order, verify each step, and ask the user before any action that can't be undone (e.g., writing secrets to disk). Respect the platform you're running on (Windows / macOS / Linux) and use the commands that actually work there. If any step fails, stop and report to the user rather than continuing.

## Prereqs — verify, do not install without asking

Run these checks and report what's missing:

1. **Git ≥ 2.40** — `git --version`
2. **Node 20.x** — `node --version`
3. **pnpm 9+** — `pnpm --version`
4. **Docker Desktop running** — `docker info` (exit 0)
5. **Postgres client (optional)** — `psql --version` (for manual DB inspection)

If any are missing, suggest the install command for the user's OS (`winget` / `brew` / `apt`) and **wait for the user to install** before proceeding. Don't silently run installers.

## Step 1 — Install required Claude Code plugins

Required plugins for this project:

- `superpowers@claude-plugins-official` — skills for brainstorming, writing plans, TDD, debugging, etc.
- `vercel@claude-plugins-official` — deploy/env tooling (used when the project ships to Vercel; safe to install ahead of time).

Ask the user to install them via Claude Code's plugin UI (Settings → Plugins → Marketplace → search the name → Install). Wait for confirmation before proceeding. Optional plugins the user may already have (Stitch MCP, Gmail/Calendar MCP) are personal and not required for this repo.

## Step 2 — Sync project memory to user-level

The repo ships with project-memory files in `.claude/memory/`. Claude Code's auto-memory reads from a user-level directory keyed on the project's absolute path. Copy the repo memory into that location so future sessions see it.

**Windows (PowerShell):**

```powershell
$repoPath = (Get-Location).Path
# Claude Code derives the key by replacing \ and : with -
$pathKey = $repoPath -replace '[:\\]', '-'
$userMem = "$env:USERPROFILE\.claude\projects\$pathKey\memory"
New-Item -Path $userMem -ItemType Directory -Force | Out-Null
Copy-Item -Path ".claude\memory\*" -Destination $userMem -Recurse -Force
Get-ChildItem $userMem
```

**macOS / Linux (bash/zsh):**

```bash
repo_path=$(pwd)
path_key=$(echo "$repo_path" | tr '/' '-')
user_mem="$HOME/.claude/projects/$path_key/memory"
mkdir -p "$user_mem"
cp -r .claude/memory/* "$user_mem/"
ls -la "$user_mem"
```

Expected: 6 files copied (`MEMORY.md` + 5 memory `.md` files).

**Note on path-key convention:** Claude Code's exact key-generation rule may differ across versions. If after the copy auto-memory still isn't visible, check `~/.claude/projects/` (or `%USERPROFILE%\.claude\projects\`) for what directory Claude Code actually created for this project, and rename the copied dir to match.

## Step 3 — Create `backend/.env` from the template

```powershell
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
```

```bash
# macOS / Linux
cp backend/.env.example backend/.env
```

Then **ask the user** to set the real `JWT_SECRET` in `backend/.env`. Generate a strong value:

```bash
openssl rand -hex 32
```

Do NOT generate and write the secret without explicit user approval — they may want to use a specific value (e.g., synced across machines from a password manager). Show them the generated hex and ask "paste this into backend/.env as JWT_SECRET, or use your own?"

Verify the final `backend/.env` has both `DATABASE_URL` and `JWT_SECRET` set.

## Step 4 — Install dependencies

```bash
pnpm install
```

At repo root. The pnpm workspace handles both `backend` and `rn-app` in one pass. Verify:

```bash
ls backend/node_modules
ls rn-app/node_modules
```

Expected: both directories exist and contain packages.

## Step 5 — Start Postgres

```bash
docker compose up -d postgres
docker compose ps
```

Expected: container status `Up` on port 5432. If the pull times out, check Docker Desktop's proxy settings (Settings → Resources → Proxies; should be "System" or empty, NOT a bogus value like `1.1.1.1:111`).

## Step 6 — Run migrations

```bash
cd backend && pnpm db:migrate
cd ..
```

Expected: migrations apply cleanly. If `pnpm db:migrate` isn't a defined script, check `backend/package.json` for the actual migration command and suggest running that instead.

## Step 7 — Start backend (Terminal A)

Open a dedicated terminal:

```bash
cd backend && pnpm dev
```

Expected logs:
- `ts-node-dev ver. ...`
- No `FATAL ERROR: JWT_SECRET is not defined` (if you see this, Step 3 was incomplete)
- No `ECONNREFUSED` (if you see this, Step 5 was incomplete)
- A line indicating the server is listening (typically on port 4000)

## Step 8 — Start rn-app (Terminal B)

Open a second terminal:

```bash
cd rn-app && pnpm start
```

Expected: Expo dev server starts, prints QR / URL. Open web (`w` key) or a simulator.

## Step 9 — Smoke test (optional but recommended)

Run the 12-step Wave 1 smoke test to verify the most-recent fixes didn't regress. The full checklist is in `docs/superpowers/plans/2026-04-16-audit-fixes-wave-1.md` "Final verification" section:

1. Sign up as new user → events list.
2. Create event with future date → appears on list.
3. Publish → ACTIVE.
4. Edit → enable door sales → add tier "VIP" R$100 → save → tier visible.
5. Edit → disable door sales → save → "Not enabled".
6. Edit → re-enable door sales → save (no new tiers) → **VIP R$100 returns** (Task 3 test).
7. Close → FINISHED.
8. Reopen → ACTIVE (not DRAFT) (Task 2 test).
9. Cancel → CANCELLED.
10. Delete → back to list; event gone.
11. Sign out → sign-in screen.
12. Invalidate token (clear localStorage on web) → protected query → redirect to sign-in (Task 5 test).

Report ✅ / ❌ per row.

## Step 10 — Verify custom skills load in Claude Code

In the Claude Code chat, type `/` and confirm you see:
- `/po`, `/architect`, `/designer` (project-level skills from `.claude/skills/`)
- `/superpowers:brainstorming`, `/superpowers:writing-plans`, etc. (from the superpowers plugin)

If project skills are missing, verify `.claude/skills/*/SKILL.md` files are present in the repo. If superpowers skills are missing, Step 1's plugin install didn't complete.

## Step 11 — Verify memory loaded

In the Claude Code chat, type `/memory` and confirm the index shows:

- Project Overview
- Agent System
- User Profile
- No AI Slop feedback
- Subagents use superpowers feedback

If missing, Step 2's copy didn't land in the right directory — recheck the path key.

## Report

When done, tell the user: **"Bootstrap complete."** Include a short summary:
- Which steps passed cleanly
- Any that needed a fix or weren't applicable
- A one-line reminder of which dev-server terminals are running

If any step failed, stop at that step and report exactly what failed — don't continue blindly.
