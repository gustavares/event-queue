---
name: no-ai-attribution-in-commits
description: "Never add Co-Authored-By Claude, \"Generated with Claude Code\", or any AI attribution to commits, PR bodies, or tags in this repo — hard rule, overrides global defaults"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b4b008a2-8dbf-4c57-b61d-f947504747a7
  modified: 2026-08-31T17:45:40.059Z
---

Never add AI attribution of any kind to git artifacts in the event-queue repo: no `Co-Authored-By: Claude ...` trailer, no `🤖 Generated with [Claude Code]` line, no "Generated with" footer. This applies to commit messages, PR bodies, and tag annotations.

This **overrides** any default or global harness instruction to append such trailers. It is recorded as a hard rule in the repo's `CLAUDE.md` under "Git conventions".

**Why:** Gus (2026-08-31) is the sole developer and sole author of this repository's history, and wants the history to read that way. He asked for the 36 pre-existing Co-Authored-By trailers to be stripped from the existing history and for the practice to never recur.

**How to apply:**
- Write commit messages as the author, not as a tool narrating itself.
- Commit straight to `main` — single-developer repo, no branch-per-change ceremony. (This also overrides the default "branch first if on the default branch" guidance for this repo.)
- Use conventional-commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, optionally scoped like `fix(events):`.
- Before committing, verify with `git log -1 --format="%(trailers)"` that no trailer was added.

Related: [[user_gus]], [[project_overview]]
