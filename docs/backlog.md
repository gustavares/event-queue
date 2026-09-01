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
| 3 | **Public Event Discovery** | ⬚ TODO | Auth, Events, Venues | [spec](features/public-discovery/spec.md) · [discovery.feature](features/public-discovery/discovery.feature) · [curation.feature](features/public-discovery/curation.feature) · [publishing.feature](features/public-discovery/publishing.feature) |
| 4 | Event Team Management | ⬚ TODO | Auth, Events | [spec](features/team-management/spec.md) · [team-management.feature](features/team-management/team-management.feature) |
| 5 | Lists & Guests | ⬚ TODO | Auth, Events, Team Management | [spec](features/lists-guests/spec.md) · [lists.feature](features/lists-guests/lists.feature) · [guests.feature](features/lists-guests/guests.feature) |
| 6 | Check-in Flow | ⬚ TODO | Auth, Events, Team Management, Lists & Guests | [spec](features/check-in/spec.md) · [check-in.feature](features/check-in/check-in.feature) |
| 7 | Door Sales Recording | ⬚ TODO | Auth, Events, Team Management | [spec](features/door-sales/spec.md) · [door-sales.feature](features/door-sales/door-sales.feature) |
| 8 | Notifications | ⬚ TODO | Lists & Guests, Events, Door Sales | [spec](features/notifications/spec.md) · [notifications.feature](features/notifications/notifications.feature) |
| 9 | Analytics | ⬚ TODO | Auth, Events, Team Management, Lists & Guests, Check-in, Door Sales | [spec](features/analytics/spec.md) · [analytics.feature](features/analytics/analytics.feature) |

### Before feature #3

Two pieces of groundwork come first. Neither is a product feature, so neither carries a spec — but Public Discovery adds an entire new API surface, and building it on unsettled conventions repeats the drift the [audit](audits/2026-04-16-full-audit.md) identified as the root cause of every recurring defect.

| Order | Work | Why first |
|-------|------|-----------|
| A | `/architect patterns` pass | Settles repositories, error handling, transactions and auth guards, and closes most of the 8 remaining 🔴 audit findings. Cheap, and makes everything after it cheaper |
| B | Test harness | Jest is installed but unconfigured and the repo has **zero tests**. Discovery introduces the first unauthenticated endpoints — the highest-risk surface in the product for data leakage — and BR-DISC-005 deserves a test that fails loudly, not a code review |

## Notes

- Priority order follows MVP design doc: `docs/plans/2026-02-12-mvp-design.md`, **extended 2026-08-31** with Public Event Discovery — the platform is no longer only a management tool for organizers, but a public, editorially curated listing of a city's nightlife, including events we do not sell tickets for. See `docs/features/public-discovery/spec.md`
- **Why Discovery sits ahead of Team Management:** Team Management unblocks door sales and promoter payouts, which are the strongest revenue lines — but they require venues already using the product, which requires distribution. Discovery is that distribution, and it is the only thing that differentiates us from the eight existing Brazilian guest-list apps. It is also largely additive (new tables, new public surface, new screens) where Team Management threads through auth and permissions, so it carries less regression risk
- Each spec consists of a `spec.md` (prose: overview, business rules, ACs index, error handling, edge cases, dependencies, out-of-scope) and one or more `.feature` files (Gherkin scenarios that cover every AC, error row, and edge case)
- Status transitions:
  - 💡 IDEA → ⬚ TODO requires an approved spec.md + at least one .feature file (run `/po`)
  - ⬚ TODO → 🔵 IN PROGRESS requires an approved implementation plan (run `/architect`)
  - 🔵 IN PROGRESS → 🟢 DONE requires a passing validation report (`/po validate`) + code review (`/architect review`) + design review (`/designer review` if frontend changes shipped)
- All specs use Brazilian-context names and contexts (CPF, WhatsApp, R$ pricing) per the Brazilian-nightlife domain
