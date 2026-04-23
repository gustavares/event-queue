# Event Queue — project context for Claude

> This file is auto-loaded into every Claude Code session for this repo. Keep it concise.

## What this is

**Event Queue** is a guest-list and door-management platform for Brazilian nightlife venues. Managers create events, configure door-sale tiers, and (eventually) handle lists, check-ins, and reconciliation. This repo is an **early-stage MVP** — Auth and Events CRUD are shipped; the rest of the backlog is in `docs/backlog.md`.

## Stack

- **Backend:** Node 20 (TypeScript), graphql-yoga, Drizzle ORM on Postgres, Argon2 passwords, JOSE JWT. Entry: `backend/src/index.ts`. Data models in `backend/src/db/schema.ts`.
- **Frontend:** React Native + Expo Router, urql (GraphQL client), Zustand stores, NativeWind (Tailwind). Entry: `rn-app/app/_layout.tsx`.
- **Infra:** pnpm monorepo. Postgres via `docker-compose.yml`.

## Custom skills in this repo

Invoke with `/po`, `/architect`, `/designer`:

- **`/po`** — Product Owner: writes specs (`docs/features/<feature>/spec.md`), maintains `docs/backlog.md` and `docs/business-rules.md`, validates implementations against acceptance criteria.
- **`/architect`** — Technical plans (`docs/features/<feature>/plan.md`), maintains `docs/patterns.md` and `docs/tech.md`, code reviews against patterns.
- **`/designer`** — Screen specs (`docs/features/<feature>/screens.md`), maintains `docs/design-system.md`, frontend review.

Each skill reads/writes only its own documents; see their `SKILL.md` files in `.claude/skills/`.

## Pipeline

`/po` (spec) → `/architect` (plan) → `/designer` (screens) → implementation → `/po validate` + `/architect review` + `/designer review`.

## Where things live

| What | Where |
|------|-------|
| Product vision | `docs/plans/2026-02-12-mvp-design.md` |
| Backlog | `docs/backlog.md` |
| Business rules | `docs/business-rules.md` |
| Coding patterns | `docs/patterns.md` (known-sparse — see latest audit) |
| Design system | `docs/design-system.md` |
| Stack decisions | `docs/tech.md` |
| Feature docs | `docs/features/<feature>/{spec,plan,screens}.md` |
| Audits | `docs/audits/YYYY-MM-DD-*.md` |
| Design specs (meta) | `docs/superpowers/specs/` |
| Implementation plans (meta) | `docs/superpowers/plans/` |
| Project memory | `.claude/memory/` (sync to user-level on first run — see BOOTSTRAP.md) |

## Most recent audit

`docs/audits/2026-04-16-full-audit.md` — 106 findings (18 🔴 / 65 🟡 / 23 🟢). Wave 1 fixes (the 7 most-critical 🔴) are implemented; the remaining architectural and design-system findings are routed to later phases.

## New machine setup

**First time cloning this repo?** See `BOOTSTRAP.md` at the repo root. It walks Claude through installing required plugins, copying memory to user-level, creating `.env`, starting Postgres, and running the stack end-to-end.
