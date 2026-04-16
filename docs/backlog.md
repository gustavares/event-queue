# Product Backlog

> Maintained by `/po`. Prioritized list of features with status and dependencies.

## Status Legend
- 🟢 DONE — Implemented and validated
- 🔵 IN PROGRESS — Currently being worked on
- ⬚ TODO — Specified, ready for implementation
- 💡 IDEA — Needs specification

## Backlog

| # | Feature | Status | Dependencies | Spec |
|---|---------|--------|--------------|------|
| 1 | Auth (Sign Up / Sign In) | 🟢 DONE | — | [spec](features/auth/spec.md) |
| 2 | Events CRUD | 💡 IDEA | Auth | — |
| 3 | Event Team Management | 💡 IDEA | Events | — |
| 4 | Lists & Guests | 💡 IDEA | Events, Teams | — |
| 5 | Check-in Flow | 💡 IDEA | Lists & Guests | — |
| 6 | Door Sales | 💡 IDEA | Events | — |
| 7 | Notifications | 💡 IDEA | Lists & Guests | — |
| 8 | Analytics | 💡 IDEA | Check-in, Door Sales | — |

## Notes
- Priority order follows MVP design doc: `docs/plans/2026-02-12-mvp-design.md`
- Each feature must have a spec before moving to TODO
