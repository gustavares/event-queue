# Event Queue

Guest-list and door-management platform for Brazilian nightlife venues. Managers create events, configure door-sale tiers, and (as the backlog lands) handle lists, check-ins, and reconciliation.

**Status:** early-stage MVP. Auth and Events CRUD are shipped; everything else is in [`docs/backlog.md`](docs/backlog.md).

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node 22 + TypeScript, GraphQL Yoga, Drizzle ORM, PostgreSQL 16 |
| Auth | JOSE (JWT) + Argon2 (password hashing) |
| Frontend | React Native + Expo Router, urql, Zustand, NativeWind |
| Tooling | pnpm workspace, Docker Compose |

Full stack decisions and version table: [`docs/tech.md`](docs/tech.md).

## Getting started

Prerequisites: Node 22 (see `.nvmrc`), pnpm 10, Docker Desktop.

```bash
pnpm install
cp backend/.env.example backend/.env   # then set a real JWT_SECRET
docker compose up -d postgres
cd backend && pnpm db:migrate
```

Then run the two dev servers in separate terminals:

```bash
cd backend && pnpm dev      # GraphQL API on :4000
cd rn-app  && pnpm dev      # Expo dev server on :8081
```

`pnpm dev:web` opens the web target directly. For a physical device or emulator, set `EXPO_PUBLIC_GRAPHQL_URL` to your machine's LAN address — `localhost` resolves to the device itself.

Setting up a fresh machine from scratch is walked through in [`BOOTSTRAP.md`](BOOTSTRAP.md).

## Repository layout

```
backend/     GraphQL API — domain services, repositories, Drizzle schema
rn-app/      Expo app — file-based routes under app/, shared UI in components/
docs/        Specs, plans, patterns, audits (see below)
go-app/      Abandoned pre-rewrite Go backend, kept for reference only
```

## How this project is built

Development runs through three Claude Code skills that own separate documents, so a feature is specified before it is written:

| Skill | Owns | Produces |
|-------|------|----------|
| `/po` | Product | `docs/features/<feature>/spec.md`, backlog, business rules |
| `/architect` | Technical | `docs/features/<feature>/plan.md`, `docs/patterns.md` |
| `/designer` | Visual | `docs/features/<feature>/screens.md`, `docs/design-system.md` |

Pipeline: `/po` → `/architect` → `/designer` → implementation → review by all three.

## Key documents

| What | Where |
|------|-------|
| Product vision | `docs/plans/2026-02-12-mvp-design.md` |
| Backlog | `docs/backlog.md` |
| Business rules | `docs/business-rules.md` |
| Coding patterns | `docs/patterns.md` |
| Design system | `docs/design-system.md` |
| Stack decisions | `docs/tech.md` |
| Audits | `docs/audits/` |
