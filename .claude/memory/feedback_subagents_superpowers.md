---
name: Subagents should use superpowers skills
description: When dispatching subagents, explicitly direct them to use relevant superpowers skills (verification-before-completion, systematic-debugging, etc.) so they leverage the same rigor the controller applies.
type: feedback
originSessionId: 725450fc-3761-4a38-a532-57aa50ac2d65
---
When dispatching any subagent (implementer, spec reviewer, code quality reviewer, fix subagent), include explicit guidance to use relevant `superpowers:*` skills for their role. Do not assume subagents will pick them up automatically.

Common mappings:
- **Implementer subagents** → `superpowers:verification-before-completion` (confirm tsc passes, commands succeed, before reporting DONE); `superpowers:systematic-debugging` if they hit a bug during the task.
- **Spec reviewers** → `superpowers:verification-before-completion` (evidence before assertions).
- **Code quality reviewers** → `superpowers:code-reviewer` agent type already uses its own skill chain; no extra prompt needed.

**Why:** Gus asked me (2026-04-17) to make general-purpose subagents use the superpower MCP to help them out. Without explicit instruction, subagents often report "tsc not runnable" or skip verification steps instead of invoking the systematic-debugging / verification-before-completion skills that would unblock them.

**How to apply:** In every implementer/reviewer prompt I construct, include a section: "Use these superpowers skills while working: <list>." For implementers: verification-before-completion at minimum. For spec/quality reviewers: verification-before-completion plus whatever domain skill fits the task.
