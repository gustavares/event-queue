# Analytics

## Overview
A Manager-only, per-event analytics view that surfaces the numbers produced by check-in and door-sale activity for a single event: total check-ins, per-list breakdown, promoter performance, and door-sale revenue by tier. Metrics are computed from the current state at read time, so the view is readable while the event is ACTIVE but designed primarily as a post-event report. Cross-event roll-ups, real-time feeds, charts, and exports are out of scope for the MVP.

## User Stories
- As a Manager, I want to see total check-ins for my event so that I know how many guests actually showed up
- As a Manager, I want a per-list breakdown so that I can compare turnout across OFFICIAL, PROMOTER, and DOOR_SALES lists
- As a Manager, I want a promoter-performance table so that I can see which promoters drove the most attendance
- As a Manager, I want door-sale counts and revenue by tier so that I can reconcile the night's takings
- As a Manager, I want analytics to be readable for any of my events regardless of status (DRAFT, ACTIVE, FINISHED, CANCELLED) so that I can review historical events and check live progress without a separate tool
- As a Promoter or Host, I should not see event-wide analytics so that performance data stays with the Manager

## Business Rules

1. Analytics are available to Managers only — Promoters and Hosts cannot read them → `BR-ANL-001`
2. The Analytics view exposes four metric groups: total check-ins, per-list breakdown, promoter performance, and door sales by tier → `BR-ANL-002`
3. Metrics are computed from the current state of the event at read time (no separate snapshot) → `BR-ANL-003` (new)
4. Analytics are scoped to a single event — there is no cross-event roll-up in MVP → `BR-ANL-004` (new)
5. Check-in rate is calculated as `checkedIn / totalGuests`; when `totalGuests` is `0` the rate is displayed as `—` (em dash) to make division-by-zero unambiguous → `BR-ANL-005` (new)
6. Per-list breakdown includes every list attached to the event, including DOOR_SALES lists and PROMOTER lists with zero entries → `BR-ANL-006` (new)
7. Promoter-performance rows include every team member with role Promoter on the event, even those who created no list entries → `BR-ANL-007` (new)
8. When door sales are not enabled for the event, the door-sales-by-tier section is hidden (or rendered as an explicit empty state) and does not raise an error → `BR-ANL-008` (new)
9. Door-sale revenue is the sum of `tier.price` across all `DoorSaleEntry` rows for that tier; quantities and revenue reflect entries recorded so far → `BR-ANL-009` (new)
10. Analytics are readable for events in any status (DRAFT, ACTIVE, FINISHED, CANCELLED); the view does not gate on status → `BR-ANL-010` (new)

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Manager opens the Analytics view for one of their events and sees the total check-in count for that event |
| AC-2 | Manager sees a per-list breakdown row for every list attached to the event, with `guests on list`, `checked in`, and `check-in rate %` |
| AC-3 | Manager sees a promoter-performance row for every Promoter on the event, with `guests added`, `checked in`, and `check-in rate %` |
| AC-4 | Manager sees a door-sales-by-tier breakdown with `sales count` and `revenue` per tier when door sales are enabled |
| AC-5 | Door-sales-by-tier section is hidden (or shown as an explicit empty state) when door sales are not enabled for the event |
| AC-6 | A Promoter or Host attempting to read analytics for an event receives a permission error and no metrics |
| AC-7 | Analytics for an event with no check-ins show all counts as `0` and all rates as `—` (zero-state) without errors |
| AC-8 | Analytics are readable for an event in any status — DRAFT, ACTIVE, FINISHED, or CANCELLED — using whatever data was recorded |
| AC-9 | A list with zero entries renders in the per-list breakdown with `0 / 0` and rate `—` |
| AC-10 | A Promoter who is on the team but added no guests still appears in the promoter-performance table with `0 / 0` and rate `—` |
| AC-11 | Cross-event analytics (totals across multiple events) are not available — there is no Manager-wide dashboard endpoint |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`analytics.feature`](analytics.feature) | AC-1..AC-11, all Error Handling rows, EDGE-1..EDGE-7 |

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| Promoter or Host attempts to view analytics | `You do not have permission to view analytics for this event` | No metrics returned; user remains on previous screen |
| Manager requests analytics for a non-existent event | `Event not found` | User redirected to events list |
| Manager requests cross-event analytics dashboard | _(no endpoint exposed)_ | Out of scope; not surfaced in the UI |
| Network error while loading analytics | `Something went wrong. Please try again.` | User remains on the analytics screen with a retry affordance |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Manager opens analytics for an event with no check-ins yet | Total = 0; every per-list row = `0 / 0` with rate `—`; every promoter row = `0 / 0` with rate `—`; no errors |
| EDGE-2 | Event has door sales disabled | Door-sales-by-tier section is hidden (explicit empty state allowed); no error |
| EDGE-3 | Event status is CANCELLED | Metrics still readable; whatever was recorded before cancellation is shown without warning banner |
| EDGE-4 | Event status is DRAFT | All metrics zero (no lists, no entries possible yet); no error |
| EDGE-5 | A list has zero entries | Row appears with `0 / 0`; rate displayed as `—` (not `0%`, to distinguish "no data" from "no one came") |
| EDGE-6 | A promoter is on the team but added no guests | Row appears with `0 / 0`; rate displayed as `—` (chosen over hiding so the Manager knows the promoter has nothing to show) |
| EDGE-7 | Manager opens analytics while the event is still ACTIVE | Metrics reflect current state; values may change on refresh; no warning banner |

## Dependencies

- **Depends on:**
  - Auth (#1) — Manager identity required
  - Events CRUD (#2) — events, statuses, door-sales-enabled flag, tier configuration
  - Team Management (#3) — Manager / Promoter role assignments drive who can read analytics and who appears in the promoter-performance table
  - Lists & Guests (#4) — list entries provide totals and which list each guest belongs to
  - Check-in (#5) — check-in status drives `checked in` counts and rates
  - Door Sales recording (#6) — `DoorSaleEntry` rows drive sales count and revenue per tier
- **Depended on by:** None in MVP. (Future post-MVP real-time dashboard and ticketing reconciliation will build on the same metric definitions.)

## Out of Scope

- Cross-event Manager dashboard / multi-event roll-ups
- Real-time live check-in feed, occupancy meter, running totals (post-MVP per MVP design)
- Promoter self-service analytics view — a Promoter sees their own list stats inside the Lists feature; analytics-as-a-feature stays Manager-only
- Host self-service analytics
- CSV / PDF / Excel export, share links, scheduled email reports
- Charts, graphs, or any visualization beyond simple numbers and tabular rows (visual treatment is the Designer's call)
- Time-series trends within a single event (e.g., check-ins per hour, peak-hour analysis)
- Revenue forecasting, pricing optimization, or A/B comparisons across past events
- Comparing this event to past events of the same Manager
- Drill-down from a metric to the underlying list of guests (handled by the Lists feature)
- Editing, voiding, or correcting check-in or door-sale records from the Analytics view
