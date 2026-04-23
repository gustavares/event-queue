---
name: Agent System Design
description: Three Claude Code skills (/po, /architect, /designer) as domain gatekeepers with hybrid doc structure — design approved 2026-04-02, implementation pending
type: project
---

Approved agent system with three skills as domain gatekeepers. Design doc at `docs/plans/2026-04-03-agent-system-design.md`.

- `/po` — business specs, backlog, validation
- `/architect` — technical plans, patterns, code review
- `/designer` — screen specs, design system, UI review

Pipeline: /po → /architect → /designer → implementation. Manual invocation also supported.

Hybrid doc structure: root-level cross-cutting docs (backlog.md, patterns.md, design-system.md) + per-feature dirs (docs/features/<feature>/ with spec.md, plan.md, screens.md).

**Why:** User wants structured process to ensure features are properly specified before implementation, catching missing details (error handling, edge cases) that were missed in the initial auth implementation.
**How to apply:** Use the pipeline for new features. Each skill validates its domain before passing to the next step.
