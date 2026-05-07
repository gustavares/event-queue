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
| 1 | Auth (Sign Up / Sign In) | 🟢 DONE | — | [spec](features/auth/spec.md) · [auth.feature](features/auth/auth.feature) |
| 2 | Events CRUD (incl. Venues) | 🟢 DONE | Auth | [spec](features/events-crud/spec.md) · [events.feature](features/events-crud/events.feature) · [venues.feature](features/events-crud/venues.feature) · [door-sales-config.feature](features/events-crud/door-sales-config.feature) — see [audit](audits/2026-04-16-full-audit.md) for known defects |
| 3 | Event Team Management | ⬚ TODO | Auth, Events | [spec](features/team-management/spec.md) · [team-management.feature](features/team-management/team-management.feature) |
| 4 | Lists & Guests | ⬚ TODO | Auth, Events, Team Management | [spec](features/lists-guests/spec.md) · [lists.feature](features/lists-guests/lists.feature) · [guests.feature](features/lists-guests/guests.feature) |
| 5 | Check-in Flow | ⬚ TODO | Auth, Events, Team Management, Lists & Guests | [spec](features/check-in/spec.md) · [check-in.feature](features/check-in/check-in.feature) |
| 6 | Door Sales Recording | ⬚ TODO | Auth, Events, Team Management | [spec](features/door-sales/spec.md) · [door-sales.feature](features/door-sales/door-sales.feature) |
| 7 | Notifications | ⬚ TODO | Lists & Guests, Events, Door Sales | [spec](features/notifications/spec.md) · [notifications.feature](features/notifications/notifications.feature) |
| 8 | Analytics | ⬚ TODO | Auth, Events, Team Management, Lists & Guests, Check-in, Door Sales | [spec](features/analytics/spec.md) · [analytics.feature](features/analytics/analytics.feature) |

## Notes

- Priority order follows MVP design doc: `docs/plans/2026-02-12-mvp-design.md`
- Each spec consists of a `spec.md` (prose: overview, business rules, ACs index, error handling, edge cases, dependencies, out-of-scope) and one or more `.feature` files (Gherkin scenarios that cover every AC, error row, and edge case)
- Status transitions:
  - 💡 IDEA → ⬚ TODO requires an approved spec.md + at least one .feature file (run `/po`)
  - ⬚ TODO → 🔵 IN PROGRESS requires an approved implementation plan (run `/architect`)
  - 🔵 IN PROGRESS → 🟢 DONE requires a passing validation report (`/po validate`) + code review (`/architect review`) + design review (`/designer review` if frontend changes shipped)
- All specs use Brazilian-context names and contexts (CPF, WhatsApp, R$ pricing) per the Brazilian-nightlife domain
