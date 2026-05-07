# Events CRUD

## Overview
Managers create and manage events — the central entity of the platform. An event has a name, date, location (either a saved Venue or inline address), optional door-sales configuration with tiers, and a status lifecycle. The event creator is automatically assigned the Manager role. This feature also covers basic Venue creation and listing, since Venues are tightly coupled with event creation.

## User Stories

### Events
- As a user, I want to create an event so that I can manage its guest list and check-ins
- As a manager, I want to edit my event's details so that I can fix mistakes or update information
- As a manager, I want to publish a draft event so that it becomes active
- As a manager, I want to close an event so that no more changes can be made
- As a manager, I want to cancel an event so that it is clearly marked as not happening
- As a manager, I want to reopen a finished event so that I can correct records if needed
- As a user, I want to see my events so that I know what I'm managing

### Venues
- As a user, I want to create a venue so that I can reuse it across multiple events
- As a user, I want to see a list of venues so that I can pick one when creating an event

### Door Sales Configuration
- As a manager, I want to enable door sales on my event so that hosts can record walk-in entries
- As a manager, I want to configure door sale tiers (name + price) so that hosts can record the correct amount

## Business Rules

| ID | Rule |
|----|------|
| BR-EVT-001 | Creating an event automatically assigns the creator as Manager |
| BR-EVT-001 | Events must have: name, start date, and either venueId OR inline locationName + locationAddress |
| BR-EVT-002 | If venueId is provided, locationName and locationAddress are ignored |
| BR-EVT-003 | If venueId is not provided, locationName and locationAddress are both required |
| BR-EVT-004 | endDate is optional; defaults to startDate + 12 hours |
| BR-EVT-005 | endDate must be after startDate |
| BR-EVT-006 | startDate cannot be in the past at creation (edit allows past dates for historical correction) |
| BR-EVT-007 | Events are soft-deleted (deleted flag + deletedAt), not hard-deleted |
| BR-EVT-008 | Only the event's Manager can edit, change status, or delete the event |
| BR-EVT-009 | A Manager sees only events they created (MVP scope; extended in Team Management) |
| BR-EVT-010 | Non-manager attempts to edit/delete/transition return `"You do not have permission to edit this event"` |
| BR-STS-001..008 | Status lifecycle and transition rules (see `business-rules.md` Event Status Lifecycle) |
| BR-VEN-001..006 | Venue rules (see `business-rules.md` Venues) |
| BR-DSC-001..003 | Door-sales configuration rules (see `business-rules.md` Door Sales Configuration) |

## Acceptance Criteria

### Events

| ID | Criterion |
|----|-----------|
| AC-1 | Authenticated user can create an event with name, startDate, and venueId → receives event with status DRAFT and creator assigned as MANAGER |
| AC-2 | Authenticated user can create an event with name, startDate, locationName, and locationAddress → receives event with status DRAFT |
| AC-3 | User can create an event without endDate → endDate defaults to startDate + 12 hours |
| AC-4 | User can create an event with explicit endDate → endDate is stored as provided |
| AC-5 | Creating an event with both venueId and inline location ignores the inline location fields |
| AC-6 | Creating an event with neither venueId nor inline location returns a validation error |
| AC-7 | Creating an event with endDate before startDate returns a validation error |
| AC-8 | Creating an event with startDate in the past returns a validation error |
| AC-9 | Manager can update their event's name, dates, location, and description |
| AC-10 | Manager can publish a DRAFT event (DRAFT → ACTIVE) |
| AC-11 | Manager can close an ACTIVE event (ACTIVE → FINISHED) |
| AC-12 | Manager can reopen a FINISHED event (FINISHED → ACTIVE) |
| AC-13 | Manager can cancel a DRAFT or ACTIVE event (→ CANCELLED) |
| AC-14 | Invalid status transitions return error without changing state |
| AC-15 | Manager can soft-delete their event (deleted flag set, endpoint no longer returns it) |
| AC-16 | Reading an ACTIVE event with endDate already passed returns status FINISHED (lazy auto-close) |
| AC-17 | Non-manager user attempting to edit/delete/transition returns authorization error |
| AC-18 | User can list their own events (events they created) |
| AC-19 | User can fetch a single event by id if they are its Manager |

### Venues

| ID | Criterion |
|----|-----------|
| AC-20 | Authenticated user can create a venue with name and address → receives venue |
| AC-21 | Authenticated user can create a venue with name, address, and capacity → receives venue |
| AC-22 | Creating a venue without name or address returns a validation error |
| AC-23 | Creating a venue with capacity ≤ 0 returns a validation error |
| AC-24 | Any authenticated user can list all venues |
| AC-25 | Any authenticated user can fetch a single venue by id |

### Door Sales Configuration

| ID | Criterion |
|----|-----------|
| AC-26 | Manager can enable door sales on their event (`doorSalesEnabled = true`) |
| AC-27 | Manager can disable door sales on their event (`doorSalesEnabled = false`) |
| AC-28 | Manager can add a door sale tier with name and price |
| AC-29 | Manager can update a tier's name or price |
| AC-30 | Manager can remove a tier |
| AC-31 | Non-manager user attempting to modify tiers returns an authorization error |
| AC-32 | Adding a tier with empty name or non-positive price returns a validation error |
| AC-33 | Disabling door sales preserves existing tiers (they remain but are inactive) |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`events.feature`](events.feature) | AC-1..AC-19, Error rows 1-7 + 10, EDGE-1, EDGE-2, EDGE-3, EDGE-4, EDGE-6, EDGE-10 |
| [`venues.feature`](venues.feature) | AC-20..AC-25, Error row 8, EDGE-8, EDGE-9 |
| [`door-sales-config.feature`](door-sales-config.feature) | AC-26..AC-33, Error row 9, EDGE-7 |

## Error Handling

| # | Scenario | Error Message | Behavior |
|---|----------|--------------|----------|
| 1 | Missing required event field (name, startDate) | `Please fill in all required fields` | Stay on form, highlight missing fields |
| 2 | No venue selected and no inline location | `Please select a venue or provide a location` | Stay on form |
| 3 | endDate before startDate | `End time must be after start time` | Stay on form, highlight dates |
| 4 | startDate in the past (create) | `Start time cannot be in the past` | Stay on form |
| 5 | Non-manager attempts edit/delete/transition | `You do not have permission to edit this event` | No state change |
| 6 | Invalid status transition (general) | `This event cannot be changed to that status` | No state change |
| 6a | Reopen of a CANCELLED event (specific) | `Cancelled events cannot be reopened.` | No state change |
| 7 | Event not found | `Event not found` | Redirect to events list |
| 8 | Venue missing name or address | `Venue name and address are required` | Stay on form |
| 9 | Invalid tier (empty name, non-positive price) | `Please provide a tier name and a price greater than zero` | Stay on form |
| 10 | Network error during any operation | `Something went wrong. Please try again.` | Keep user on current screen |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Event passes endDate while user is viewing | Next read returns status FINISHED (read-path is authoritative) |
| EDGE-2 | Manager edits an event to set endDate in the past | Allowed (historical correction); event immediately shows FINISHED on next read |
| EDGE-3 | Manager cancels an ACTIVE event | Allowed; transitions to CANCELLED. Reversal not supported (CANCELLED is terminal) |
| EDGE-4 | Manager tries to reopen a CANCELLED event | Rejected with `Cancelled events cannot be reopened.` |
| EDGE-5 | Venue is referenced by events, then someone tries to delete it | Out of scope — no venue deletion endpoint in MVP |
| EDGE-6 | Manager soft-deletes an event with team members | Cascade behavior deferred to Team Management feature; deleted events excluded from all reads |
| EDGE-7 | Manager disables door sales after configuring tiers | Tiers preserved but inactive; re-enabling restores them |
| EDGE-8 | Duplicate venue names | Allowed — uniqueness is by id only |
| EDGE-9 | Event uses a venue created by another user | Allowed — venues are globally shared in MVP |
| EDGE-10 | startDate and endDate in different time zones | Stored as UTC; client sends/receives ISO 8601; validation uses UTC |

## Dependencies

- **Depends on:** Auth (#1) — requires authenticated user context
- **Depended on by:**
  - Event Team Management (#3) — extends visibility to team members
  - Lists & Guests (#4) — lists belong to events
  - Door Sales recording (#6) — sales recording uses tiers configured here
  - Check-in Flow (#5), Notifications (#7), Analytics (#8) — all indirectly depend on events existing

## Out of Scope

- Inviting other users as team members (Managers, Promoters, Hosts) — covered by Event Team Management
- Visibility of events to non-Managers — covered by Team Management
- Creating or managing Lists on an event — covered by Lists & Guests
- Recording door sale entries — covered by Door Sales recording
- Venue editing or deletion — deferred (MVP: create + list only)
- Event discovery / public event browsing
- Event images, cover photos, or media
- Event categories or tags
- Recurring events or event templates
- Promoting other users to Manager role (mentioned in MVP doc but belongs to Team Management)
- Hard delete of events
- Event audit log / change history
- Background auto-close job (lazy check on read is sufficient for MVP)
