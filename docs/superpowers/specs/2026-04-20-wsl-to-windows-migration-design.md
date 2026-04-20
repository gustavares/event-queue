# WSL → Windows Migration — Design

**Date:** 2026-04-20
**Status:** Design approved, pending implementation plan

## Goal

Transfer the event-queue dev environment from WSL Ubuntu to native Windows, driving Claude Code via the standalone Desktop app instead of the WSL CLI. WSL stays installed and untouched as a fallback for the first 1–2 weeks, after which the user decides whether to delete the WSL copy.

## Motivation

- The user prefers a native Windows workflow and the Claude Code Desktop app's dedicated UI.
- Recurring Docker-in-WSL friction (notably the proxy-config bug with `1.1.1.1:111` that blocks Docker Hub pulls) is disrupting daily work.
- Claude Code Desktop is not documented as reliably reading WSL-path projects; moving the code to Windows avoids that gap.
- The migration is pure infrastructure — no application code changes are in scope.

## Scope

### In scope

- Install all Windows-side tooling (Git, fnm/Node, pnpm, Docker Desktop, Claude Code Desktop)
- Copy `~/.claude/` from WSL to `%USERPROFILE%\.claude\`, including skills, plugins, MCP configs, and project auto-memory
- Re-clone the project from `git@github.com:gustavares/event-queue.git` to `%USERPROFILE%\projects\event-queue`
- Re-create `backend/.env` on Windows with the current (post-Wave-1) values (`JWT_SECRET`, `DATABASE_URL`)
- Add a `.gitattributes` (`* text=auto eol=lf`) and commit
- Verify the full stack works: Postgres in Docker, backend dev server, rn-app Expo, Claude Code Desktop + skills + memory + MCP
- Run the Wave 1 smoke test end-to-end on Windows

### Out of scope

- Native Postgres install on Windows (chose Docker Desktop instead)
- nvm-windows setup (chose fnm)
- WSL uninstall or deletion of the WSL project copy — explicitly deferred, WSL is the rollback
- Any application feature or code changes
- Migration of other projects on the machine

## Decisions locked during brainstorming

| Decision | Chosen option |
|----------|---------------|
| Postgres on Windows | Docker Desktop for Windows |
| `~/.claude/` migration | Straight copy from WSL to `%USERPROFILE%\.claude\` |
| Node version manager | `fnm` (Fast Node Manager) |
| WSL teardown | Keep WSL and the project copy untouched; delete later at user's discretion |
| Pre-migration commits | Push 9 Wave 1 commits to `origin/main` before touching Windows |
| Auto-memory preservation | Rename the project-memory directory on the Windows side to match Claude Code Desktop's new path key so memory carries over |
| `.gitattributes` | Add during migration (pre-empts future CRLF/LF commit drama) |
| Smoke test location | Run on Windows, skip the blocked local run in WSL |

## Phases

### Phase 0 — Pre-migration (in WSL)

1. Confirm working tree is clean (`git status`).
2. Push the 9 Wave 1 commits to `origin/main`.
3. Tag the push SHA as `pre-windows-migration` for a named rollback point.
4. Snapshot what's in `~/.claude/`: list `skills/`, `plugins/`, `projects/`, `settings.json`, MCP configs. No in-flight agents, no half-written memory files.

### Phase 1 — Install Windows tooling

Install in this order:

1. **Git for Windows** (`winget install Git.Git`). Configure `user.name` and `user.email` (the noreply GitHub address `4625862+gustavares@users.noreply.github.com`). Set up SSH key — either generate a fresh one and add to GitHub, or copy the existing WSL key from `\\wsl$\Ubuntu\home\gus\.ssh\id_*` to `%USERPROFILE%\.ssh\`.
2. **fnm** (`winget install Schniz.fnm`). Then `fnm install 20`, `fnm use 20`, `corepack enable` (enables `pnpm`).
3. **Docker Desktop for Windows** (`winget install Docker.DockerDesktop`). On first launch, open Settings → Resources → Proxies → set mode to "System" or disable the proxy. Verify no `1.1.1.1:111` appears in `docker info`.
4. **Claude Code Desktop** — download from `https://claude.ai/api/desktop/win32/x64/setup/latest/redirect` and sign in with the existing Anthropic account.
5. **VS Code** (optional): `winget install Microsoft.VisualStudioCode`.

### Phase 2 — Migrate Claude Code state

1. Copy `\\wsl$\Ubuntu\home\gus\.claude\` → `%USERPROFILE%\.claude\`. Preserves skills, plugins, MCP configs, project auto-memory, and any auth state that's file-based.
2. First open of the Windows-side project in Claude Code Desktop will create a new directory under `%USERPROFILE%\.claude\projects\` keyed on the Windows absolute path (something like `-C--Users-gus-projects-event-queue` — the exact name comes from the app's path-to-key convention). Rename the copied WSL-path directory (`-home-gus-projects-event-queue`) to match the new Windows-path key so auto-memory survives.
3. `settings.local.json` at the repo level is repo-local, not user-global — it travels with the re-clone automatically; do not touch it here.

### Phase 3 — Re-clone the project

1. Create `%USERPROFILE%\projects\` (if absent).
2. `git clone git@github.com:gustavares/event-queue.git` into `%USERPROFILE%\projects\event-queue`.
3. Copy `backend/.env` contents from the WSL path (`\\wsl$\Ubuntu\home\gus\projects\event-queue\backend\.env`) into the new Windows `backend\.env`. The file already contains `JWT_SECRET=...` (renamed in Wave 1 Task 6) and `DATABASE_URL=...`.
4. Add `.gitattributes` at the repo root with:
   ```
   * text=auto eol=lf
   ```
   Commit and push.
5. Install dependencies:
   - `pnpm install` at repo root
   - `cd backend && pnpm install` if the workspace config doesn't auto-handle
   - `cd rn-app && pnpm install` if needed

### Phase 4 — Verify on Windows

1. Start Docker Desktop. Confirm proxy is disabled / set to System.
2. `docker compose up -d postgres` — image pull should succeed cleanly.
3. `cd backend && pnpm dev` — backend boots, no FATAL ERROR about JWT or DB.
4. `cd rn-app && pnpm start` — Expo launches.
5. Open Claude Code Desktop → open the project → verify:
   - Custom skills visible: `/po`, `/architect`, `/designer`
   - Superpowers plugin loaded
   - Project auto-memory index (`MEMORY.md`) accessible — entries for project overview, agent system, user profile, feedback memories
   - MCP servers reconnect
6. Run the 12-step Wave 1 smoke test (per `docs/superpowers/plans/2026-04-16-audit-fixes-wave-1.md` "Final verification" section):
   - Sign up / sign in
   - Create event → Publish → Close → Reopen → Cancel → Delete
   - Edit event: enable door sales + add tier; disable door sales (tiers persist); re-enable (tiers return)
   - Token expiration → client redirects to sign-in (not blank screen)

### Phase 5 — Post-verification

- Keep WSL and its `/home/gus/projects/event-queue` copy intact. No cleanup in this spec.
- Make a mental note: if Windows causes no surprises over 1–2 weeks, the user can `rm -rf` the WSL copy and/or uninstall WSL entirely. That decision is out of scope here.

## Risks & rollback

| Risk | Mitigation |
|------|-----------|
| SSH key setup fails → `git clone` fails | Fallback to HTTPS with a Personal Access Token for the initial clone |
| `.claude/` copy hits permission errors | Retry with elevated PowerShell; or copy subdirs one at a time |
| Docker Desktop proxy bug repeats on Windows | Fix once in Settings → Resources → Proxies; document the setting for future reference |
| Auto-memory path-key mismatch | Rename the project-memory directory post-first-open; Phase 2 step 2 |
| Any breakage on Windows | WSL copy is intact and untouched; return to WSL and continue working while diagnosing |

## Success criteria

Migration is complete when all of these are true on Windows:

1. Claude Code Desktop opens the project, shows the custom skills, project auto-memory, and MCP servers are connected.
2. `docker compose up -d postgres` succeeds without proxy drama.
3. `pnpm dev` runs the backend server successfully (no JWT or DB errors).
4. `pnpm start` runs the Expo dev server successfully.
5. The 12-step Wave 1 smoke test passes end-to-end.
6. A `.gitattributes` file is committed at the repo root.
7. WSL still holds an intact fallback copy of the project at `/home/gus/projects/event-queue`.

## Non-goals

- Do not delete anything from WSL as part of this migration.
- Do not change project code, dependencies, or architecture.
- Do not install any non-essential Windows tooling.
- Do not migrate other projects on the machine.
