# WSL → Windows Migration — Implementation Plan

> **Executor model (non-standard):** Most steps run in Windows PowerShell and cannot be executed by a subagent from this WSL session. The split is:
> - **Phase 0 (Task 1)** runs in WSL — Claude executes these steps directly.
> - **Phases 1–5 (Tasks 2–6)** run on Windows — the user (Gus) executes them manually in PowerShell or the Windows GUI, reporting back between tasks.
>
> Between each Windows-side task, the user posts the terminal output (or "done, no errors") back into the Claude Code CLI. Claude verifies, diagnoses any issues, and hands off the next task.

**Goal:** Move the event-queue dev environment from WSL Ubuntu to native Windows, driving Claude Code via the standalone Desktop app. WSL stays installed with its project copy intact as a rollback point.

**Architecture:** Sequential manual checklist: push pending work in WSL → install Windows tooling → copy `~/.claude/` to Windows → re-clone the project and recreate `backend/.env` → add `.gitattributes` → verify the full stack end-to-end (including the Wave 1 smoke test).

**Tech Stack:** PowerShell, `winget`, Git for Windows, `fnm`, `corepack`/`pnpm`, Docker Desktop for Windows, Claude Code Desktop.

**Design doc:** `docs/superpowers/specs/2026-04-20-wsl-to-windows-migration-design.md`

---

## File Structure

### Files modified in this plan

| File | Purpose |
|------|---------|
| (repo root) `.gitattributes` | Enforce LF line endings across future commits to avoid CRLF churn on Windows |
| `backend/.env` (Windows copy) | Mirror of WSL `backend/.env` containing `DATABASE_URL` and `JWT_SECRET` |
| `%USERPROFILE%\.claude\projects\<path-key>\` | Auto-memory directory renamed so project memory persists across the path-key change |

### Files read but not modified

- `\\wsl$\Ubuntu\home\gus\.claude\**` (source for the copy)
- `\\wsl$\Ubuntu\home\gus\projects\event-queue\backend\.env` (source for env recreation)

### Files NOT touched

- Anything under WSL's `/home/gus/projects/event-queue/**` (read-only source of truth; the WSL copy stays intact as fallback)
- Any application source code

---

## Handoff protocol (user ↔ Claude between tasks)

For each user-executed task, the user's feedback should be one of:

- `"Task N done"` — no issues, proceed to Task N+1
- `"Task N failed at step S: <paste of error output>"` — Claude diagnoses
- `"Task N step S unclear: <specific question>"` — Claude clarifies

Tasks are independent (no shared shell state between them), so if the user needs to pause mid-task, they can resume at the same step later.

---

## Task 1: Phase 0 — Pre-migration in WSL (Claude executes)

**Files:**
- Modify (via git): `origin/main` remote state; add tag `pre-windows-migration`

- [ ] **Step 1: Verify working tree is clean**

Run:
```bash
git status --porcelain
```
Expected: empty output (no uncommitted changes). If anything appears, investigate before proceeding.

- [ ] **Step 2: Confirm the 9 Wave 1 commits are ready to push**

Run:
```bash
git log --oneline origin/main..HEAD
```
Expected: 9 commits listed, starting with the migration design spec (`7557fe8` or later) down to `630ea9f docs: add audit triage design spec`.

- [ ] **Step 3: Push to origin**

Run:
```bash
git push origin main
```
Expected: `Writing objects: ... done` and a reference update line ending with `main -> main`. If this fails due to upstream changes, abort and resolve separately — do not force-push.

- [ ] **Step 4: Tag the pushed SHA as `pre-windows-migration`**

Run:
```bash
git tag -a pre-windows-migration -m "Rollback point before WSL→Windows migration"
git push origin pre-windows-migration
```
Expected: tag pushed; `git ls-remote --tags origin pre-windows-migration` shows the tag.

- [ ] **Step 5: Snapshot `~/.claude/` contents**

Run:
```bash
ls -la ~/.claude/
ls ~/.claude/skills/ 2>/dev/null
ls ~/.claude/plugins/ 2>/dev/null
ls ~/.claude/projects/ 2>/dev/null
```
Expected: list of skills, plugins, and project memory dirs. Save this mentally — it's the reference for the copy verification in Task 3.

- [ ] **Step 6: Report to user**

Announce to the user: "Task 1 complete. Push SHA `<actual-SHA>` tagged as `pre-windows-migration`. Ready to start Task 2 on Windows."

---

## Task 2: Phase 1 — Install Windows tooling (User executes in PowerShell)

**Files:** none in the repo; installs Windows system software.

Open **Windows Terminal** (or PowerShell) as your regular user (not elevated unless a step explicitly requires it).

- [ ] **Step 1: Install Git for Windows**

Run:
```powershell
winget install --id Git.Git --source winget
```
Expected: "Successfully installed" or "Package already installed".

After install, close and reopen PowerShell so the `git` command is on PATH.

Verify:
```powershell
git --version
```
Expected: `git version 2.x.x.windows.x`.

- [ ] **Step 2: Configure Git user identity**

Run:
```powershell
git config --global user.name "gus"
git config --global user.email "4625862+gustavares@users.noreply.github.com"
```
Verify:
```powershell
git config --global --get user.name
git config --global --get user.email
```
Expected: `gus` and the noreply email.

- [ ] **Step 3: Set up SSH key for GitHub**

**Option A — Copy existing key from WSL (preferred if you only use one dev machine):**

In PowerShell:
```powershell
mkdir $env:USERPROFILE\.ssh -Force
Copy-Item "\\wsl$\Ubuntu\home\gus\.ssh\id_ed25519" "$env:USERPROFILE\.ssh\id_ed25519"
Copy-Item "\\wsl$\Ubuntu\home\gus\.ssh\id_ed25519.pub" "$env:USERPROFILE\.ssh\id_ed25519.pub"
```
(Replace `id_ed25519` with `id_rsa` if you use RSA.)

Then fix permissions (Windows uses ACLs, not chmod; `icacls` is the equivalent):
```powershell
icacls "$env:USERPROFILE\.ssh\id_ed25519" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

**Option B — Generate a fresh key** (use if you want separate keys per machine):
```powershell
ssh-keygen -t ed25519 -C "gus@windows" -f $env:USERPROFILE\.ssh\id_ed25519
```
Press Enter through the prompts. Then add the public key to GitHub:
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```
Paste at `https://github.com/settings/ssh/new`.

- [ ] **Step 4: Test SSH to GitHub**

Run:
```powershell
ssh -T git@github.com
```
Expected: `Hi gustavares! You've successfully authenticated, but GitHub does not provide shell access.` Accept the host key fingerprint prompt (`yes`) the first time.

- [ ] **Step 5: Install fnm**

Run:
```powershell
winget install --id Schniz.fnm --source winget
```
Close and reopen PowerShell.

Verify:
```powershell
fnm --version
```
Expected: `fnm x.y.z`.

- [ ] **Step 6: Add fnm to your PowerShell profile so it auto-activates**

Run:
```powershell
if (-not (Test-Path $PROFILE)) { New-Item -Type File -Path $PROFILE -Force }
Add-Content -Path $PROFILE -Value "`nfnm env --use-on-cd | Out-String | Invoke-Expression"
. $PROFILE
```
This appends the fnm env hook to your PowerShell profile and reloads it for the current session.

- [ ] **Step 7: Install Node 20 via fnm**

Run:
```powershell
fnm install 20
fnm use 20
fnm default 20
```
Verify:
```powershell
node --version
```
Expected: `v20.x.x`.

- [ ] **Step 8: Enable corepack (provides pnpm)**

Run:
```powershell
corepack enable
```
Verify:
```powershell
pnpm --version
```
Expected: `9.x.x` or whatever the repo expects (it uses `pnpm-lock.yaml` which pins the major version).

- [ ] **Step 9: Install Docker Desktop for Windows**

Run:
```powershell
winget install --id Docker.DockerDesktop --source winget
```
After install, launch **Docker Desktop** from the Start menu. Accept the license and complete onboarding (skip tutorials).

- [ ] **Step 10: Fix Docker proxy settings (critical — this is the bug you hit in WSL)**

In Docker Desktop:
- Open **Settings** (gear icon)
- Go to **Resources** → **Proxies**
- Set mode to **"System"** (or **"None"**, but **not "Manual"** with the `1.1.1.1:111` value)
- Click **Apply & Restart**

Verify from PowerShell:
```powershell
docker info | Select-String -Pattern "Proxy"
```
Expected: no `Proxy` lines, OR lines showing your real system proxy (not `1.1.1.1:111`).

- [ ] **Step 11: Verify Docker can pull images**

Run:
```powershell
docker pull hello-world
```
Expected: successful pull with a digest hash. If this times out, the proxy is still misconfigured — return to Step 10.

- [ ] **Step 12: Install Claude Code Desktop**

Download the installer:
- Open in your browser: `https://claude.ai/api/desktop/win32/x64/setup/latest/redirect`
- Run the downloaded `.exe`
- Sign in with your Anthropic account (same account used in the WSL CLI)

Verify: the app launches, shows the welcome screen or your recent sessions.

- [ ] **Step 13: Report to Claude**

Reply with `"Task 2 done"` (or the step that failed + error output). Then proceed to Task 3 once Claude confirms.

---

## Task 3: Phase 2 — Copy `~/.claude/` from WSL to Windows (User executes)

**Files:**
- Create: `%USERPROFILE%\.claude\` (recursive copy of WSL `/home/gus/.claude/`)

- [ ] **Step 1: Close Claude Code Desktop** (if running) so no files are locked during copy.

- [ ] **Step 2: Run the copy in PowerShell**

```powershell
$src = "\\wsl$\Ubuntu\home\gus\.claude"
$dst = "$env:USERPROFILE\.claude"
if (Test-Path $dst) {
  Rename-Item $dst "$dst.backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
}
Copy-Item -Path $src -Destination $dst -Recurse -Force
```

This copies the entire directory. If a previous `.claude` already existed in `%USERPROFILE%\`, it's renamed to `.claude.backup-YYYYMMDD-HHMMSS` rather than overwritten.

Expected: no error output. Large skills/plugins dirs may take 30–60 seconds.

- [ ] **Step 3: Verify the copy**

```powershell
Get-ChildItem "$env:USERPROFILE\.claude\"
Get-ChildItem "$env:USERPROFILE\.claude\skills\" -ErrorAction SilentlyContinue | Measure-Object
Get-ChildItem "$env:USERPROFILE\.claude\plugins\" -ErrorAction SilentlyContinue | Measure-Object
Get-ChildItem "$env:USERPROFILE\.claude\projects\" -ErrorAction SilentlyContinue | Measure-Object
```

Expected:
- `.claude\` contains `skills\`, `plugins\`, `projects\`, and other files (mcp config, settings, etc.)
- Item counts for `skills/`, `plugins/`, `projects/` match what was in WSL

- [ ] **Step 4: Locate the existing project-memory directory**

```powershell
Get-ChildItem "$env:USERPROFILE\.claude\projects\"
```

Expected: a directory named `-home-gus-projects-event-queue`. This is the WSL-keyed name. It will be renamed in Task 5 Step 6 (after Claude Code Desktop generates the new Windows-keyed name on first open).

- [ ] **Step 5: Report to Claude**

Reply with `"Task 3 done"` plus the output of the `Get-ChildItem` commands so Claude can confirm nothing was lost.

---

## Task 4: Phase 3 — Re-clone the project on Windows (User executes)

**Files:**
- Create: `%USERPROFILE%\projects\event-queue\` (clone)
- Create: `%USERPROFILE%\projects\event-queue\backend\.env` (copied from WSL)
- Create: `%USERPROFILE%\projects\event-queue\.gitattributes` (new file)

- [ ] **Step 1: Create the projects directory and clone**

```powershell
mkdir $env:USERPROFILE\projects -ErrorAction SilentlyContinue
cd $env:USERPROFILE\projects
git clone git@github.com:gustavares/event-queue.git
cd event-queue
```

Expected: successful clone; cwd is `C:\Users\gus\projects\event-queue`.

- [ ] **Step 2: Verify the clone is at the tagged migration point**

```powershell
git log -1 --format="%h %s"
git tag -l pre-windows-migration
```

Expected: the HEAD matches the tag set in Task 1 Step 4. Tag `pre-windows-migration` exists locally.

- [ ] **Step 3: Copy `backend/.env` from WSL**

```powershell
Copy-Item "\\wsl$\Ubuntu\home\gus\projects\event-queue\backend\.env" "backend\.env"
```

Verify:
```powershell
Get-Content backend\.env | Select-String -Pattern "JWT_SECRET|DATABASE_URL"
```

Expected: two lines shown — `JWT_SECRET=...` and `DATABASE_URL=postgres://postgres:postgres@localhost:5432/event_queue`. If the JWT line reads `JWT_SECRET_STRING=`, Task 1's push was incomplete — investigate; the Wave 1 Task 6 fix should have already renamed it.

- [ ] **Step 4: Create `.gitattributes` at the repo root**

```powershell
Set-Content -Path .gitattributes -Value "* text=auto eol=lf" -NoNewline
```

Verify:
```powershell
Get-Content .gitattributes
```
Expected output: `* text=auto eol=lf`

- [ ] **Step 5: Commit and push the `.gitattributes`**

```powershell
git add .gitattributes
git commit -m "chore: enforce LF line endings via .gitattributes"
git push origin main
```

Expected: commit created, push succeeds.

- [ ] **Step 6: Install dependencies**

```powershell
pnpm install
cd backend
pnpm install
cd ..\rn-app
pnpm install
cd ..
```

Expected: each install completes. The root `pnpm install` may be sufficient if this is a pnpm workspace — but running the two inner installs is safe (will no-op if workspace is set up).

- [ ] **Step 7: Report to Claude**

Reply with `"Task 4 done"` plus `git log -1 --format="%h %s"` output and a confirmation the installs finished without errors.

---

## Task 5: Phase 4 — Verify the full stack on Windows (User executes, multi-terminal)

**Files:** none modified (unless the auto-memory dir rename in Step 6 counts).

- [ ] **Step 1: Start Docker Desktop and confirm proxy is clean**

If Docker Desktop isn't running, launch it from the Start menu.

```powershell
docker info | Select-String -Pattern "Proxy"
```
Expected: no `1.1.1.1:111` appears. Either no Proxy lines or system-inherited lines.

- [ ] **Step 2: Start Postgres**

```powershell
cd $env:USERPROFILE\projects\event-queue
docker compose up -d postgres
docker compose ps
```

Expected: image pulls, container starts, `docker compose ps` shows postgres as `Up` and port 5432 mapped.

- [ ] **Step 3: Start the backend in Terminal A**

Open a new PowerShell window.

```powershell
cd $env:USERPROFILE\projects\event-queue\backend
pnpm dev
```

Expected (in Terminal A output):
- `[INFO] ts-node-dev ver. ...`
- No `FATAL ERROR: JWT_SECRET is not defined`
- No `ECONNREFUSED` database error
- A line indicating the server is listening (likely `http://localhost:4000/graphql`)

Leave Terminal A running.

- [ ] **Step 4: Start the rn-app in Terminal B**

Open a second PowerShell window.

```powershell
cd $env:USERPROFILE\projects\event-queue\rn-app
pnpm start
```

Expected: Expo prints a QR code / URL / "Press w to open web". Open web (`w` key) or connect a device.

Leave Terminal B running.

- [ ] **Step 5: Open Claude Code Desktop and open the project**

- Launch **Claude Code Desktop**
- From the welcome screen / project picker, choose **Open Folder** (or equivalent)
- Navigate to `C:\Users\gus\projects\event-queue`
- Open it

Expected: Claude Code Desktop loads the project, the CLAUDE.md / MEMORY is accessible, skills appear in the slash-command autocomplete.

- [ ] **Step 6: Rename the auto-memory dir to match the Windows path key**

After Claude Code Desktop opens the project at `C:\Users\gus\projects\event-queue`, it creates a new project-memory directory under `%USERPROFILE%\.claude\projects\` keyed on that Windows path. The exact name depends on the app's key-generation convention, typically replacing `\` and `:` with `-` or similar (e.g., `-C--Users-gus-projects-event-queue` or `C--Users-gus-projects-event-queue`).

In PowerShell:
```powershell
Get-ChildItem "$env:USERPROFILE\.claude\projects\"
```

You should see two directories now:
- `-home-gus-projects-event-queue` (your copied-from-WSL memory, containing `MEMORY.md` and the feedback files)
- A new directory matching the Windows path (likely empty or with a freshly initialized MEMORY file)

Close Claude Code Desktop before renaming (to release any file locks):

```powershell
# Close Claude Code Desktop first (GUI close, not kill)

# Back up the freshly-created empty Windows-keyed dir
$newKey = "<paste-the-new-directory-name-from-the-ls-above>"
Rename-Item "$env:USERPROFILE\.claude\projects\$newKey" "$newKey.empty"

# Rename the WSL-keyed dir to the Windows key
Rename-Item "$env:USERPROFILE\.claude\projects\-home-gus-projects-event-queue" $newKey
```

Re-open Claude Code Desktop, re-open the project. Expected: the MEMORY.md index loads with all 5 entries (project overview, agent system, user profile, no-AI-slop feedback, subagents-superpowers feedback).

- [ ] **Step 7: Verify skills, plugins, MCP servers in Claude Code Desktop**

In the app:
- Type `/` in the prompt — autocomplete should list `/po`, `/architect`, `/designer`, plus superpowers skills (`/superpowers:brainstorming`, etc.)
- Check MCP server status (app-specific UI; should show connected servers)

Expected: all custom skills, the superpowers plugin's skills, and MCP servers load the same as in the WSL CLI.

- [ ] **Step 8: Run the 12-step Wave 1 smoke test**

(This is the full end-to-end test from `docs/superpowers/plans/2026-04-16-audit-fixes-wave-1.md` "Final verification" section.)

With backend + rn-app running:

1. Sign up as a new user → lands on events list.
2. Create event (future date, any venue) → appears on list.
3. Publish event → status ACTIVE.
4. Edit event → enable door sales → add tier "VIP" R$100 → save. Tier visible on detail.
5. Edit again → disable door sales → save. Detail shows "Not enabled".
6. Edit again → re-enable door sales → save (no new tiers). Previous "VIP" R$100 reappears. **This is the Task 3 test.**
7. Close event → status FINISHED.
8. Reopen event → status ACTIVE (not DRAFT). **Task 2 test.**
9. Cancel event → status CANCELLED.
10. Delete event → back to list; event gone.
11. Sign out → reopen app → lands on sign-in.
12. Delete `auth-token` from web localStorage (or invalidate backend-side) → trigger a protected query → redirected to sign-in (not blank screen). **Task 5 test.**

Mark each with ✅ or ❌.

- [ ] **Step 9: Report to Claude**

Reply with the smoke-test checklist (12 rows with ✅/❌) plus any anomalies. If everything passes, Claude confirms migration success.

---

## Task 6: Phase 5 — Post-verification (no actions today)

- [ ] **Step 1: Keep WSL copy untouched**

No commands. No deletions. Do not run `rm -rf` on `/home/gus/projects/event-queue` in WSL. Do not uninstall WSL. It sits as a fallback.

- [ ] **Step 2: Set a mental reminder** for 1–2 weeks from today (around 2026-05-04 at the earliest). If by then the Windows setup has run without forcing you back to WSL even once, you may delete the WSL project copy (and/or uninstall WSL) at your discretion — that is not part of this migration plan.

- [ ] **Step 3: Mark the migration complete**

Reply with `"Task 6 done; migration complete"`. Claude marks the overall todo complete.

---

## Dependencies

- User has admin rights on the Windows machine (for `winget install` and Docker Desktop).
- WSL instance remains running and accessible from Windows (`\\wsl$\Ubuntu\...` paths resolvable).
- GitHub account has at least one SSH key slot available if a new key is generated.
- Network allows Docker Hub pulls (after the proxy fix).
- The 9 Wave 1 commits have not been modified in WSL since being pushed (Task 1 locks the state by pushing + tagging).

## What this plan does NOT do

- Does not delete anything from WSL.
- Does not uninstall WSL.
- Does not move data to Windows native Postgres (chose Docker Desktop per the design).
- Does not change any application code or dependencies.
- Does not set up VS Code or the Claude Code VS Code extension (explicitly out of scope — standalone Desktop app is the target).
- Does not configure other Windows developer tools (WSL2, nvm-windows, etc.).

## Rollback

If anything goes seriously wrong during Tasks 2–5, the WSL copy is intact. Return to the WSL terminal:
```bash
cd /home/gus/projects/event-queue
git log -1  # confirm you're at the tagged state
```
Continue working from WSL while Claude diagnoses the Windows-side issue.
