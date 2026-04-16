# Events CRUD

## Overview
Managers create and manage events — the central entity of the platform. An event has a name, date, location (either a saved Venue or inline address), optional door sales configuration with tiers, and a status lifecycle. The event creator is automatically assigned the Manager role. This feature also covers basic Venue creation and listing, since Venues are tightly coupled with event creation.

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

1. Creating an event automatically assigns the creator as Manager (via EventTeamMember with role=MANAGER)
2. Events must have: name, start date, and either a venueId OR inline locationName + locationAddress
3. If venueId is provided, locationName and locationAddress are ignored
4. If venueId is not provided, locationName and locationAddress are both required
5. endDate is optional; if not provided, defaults to startDate + 12 hours
6. endDate must be after startDate
7. startDate cannot be in the past at creation time (edit allows past dates for historical corrections)
8. Status lifecycle: `DRAFT → ACTIVE → FINISHED → CANCELLED`
9. Status transitions allowed:
   - DRAFT → ACTIVE (publish)
   - ACTIVE → FINISHED (close)
   - FINISHED → ACTIVE (reopen)
   - DRAFT → CANCELLED
   - ACTIVE → CANCELLED
10. Events auto-transition to FINISHED when current time passes endDate (background job or lazy check on read)
11. Only the event's Manager can edit, change status, or delete the event
12. Only the event's Manager can enable/disable door sales and configure tiers
13. Door sales tiers require: name (non-empty) and price (positive decimal)
14. Disabling door sales does not delete existing tier configuration (preserved for reactivation)
15. Venues are globally readable — any authenticated user can list all venues
16. Any authenticated user can create a venue
17. Venues require: name and address; capacity is optional
18. Events are soft-deleted (deleted flag + deletedAt timestamp), not hard-deleted
19. A Manager sees only events they created (MVP scope; extended in Team Management feature)

## Acceptance Criteria

### Events
1. Authenticated user can create an event with name, startDate, and venueId → receives event with status=DRAFT and creator assigned as MANAGER
2. Authenticated user can create an event with name, startDate, locationName, and locationAddress → receives event with status=DRAFT
3. User can create event without endDate → endDate defaults to startDate + 12 hours
4. User can create event with explicit endDate → endDate is stored as provided
5. Creating an event with both venueId and inline location ignores inline location fields
6. Creating an event with neither venueId nor inline location returns validation error
7. Creating an event with endDate before startDate returns validation error
8. Creating an event with startDate in the past returns validation error
9. Manager can update their event's name, dates, location, and description
10. Manager can publish a DRAFT event (DRAFT → ACTIVE)
11. Manager can close an ACTIVE event (ACTIVE → FINISHED)
12. Manager can reopen a FINISHED event (FINISHED → ACTIVE)
13. Manager can cancel a DRAFT or ACTIVE event (→ CANCELLED)
14. Invalid status transitions return error without changing state
15. Manager can soft-delete their event (deleted flag set, endpoint no longer returns it)
16. Reading an event with endDate in the past and status=ACTIVE returns status=FINISHED (lazy auto-close)
17. Non-manager user attempting to edit/delete/transition returns authorization error
18. User can list their own events (events they created)
19. User can fetch a single event by id if they are its Manager

### Venues
20. Authenticated user can create a venue with name and address → receives venue
21. Authenticated user can create a venue with name, address, and capacity → receives venue
22. Creating a venue without name or address returns validation error
23. Creating a venue with capacity ≤ 0 returns validation error
24. Any authenticated user can list all venues
25. Any authenticated user can fetch a single venue by id

### Door Sales Configuration
26. Manager can enable door sales on their event (doorSalesEnabled = true)
27. Manager can disable door sales on their event (doorSalesEnabled = false)
28. Manager can add a door sale tier with name and price
29. Manager can update a tier's name or price
30. Manager can remove a tier
31. Non-manager user attempting to modify tiers returns authorization error
32. Adding a tier with empty name or non-positive price returns validation error
33. Disabling door sales preserves existing tiers (they remain but are inactive)

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| Missing required event field (name, startDate) | "Please fill in all required fields" | Stay on form, highlight missing fields |
| No venue selected and no inline location | "Please select a venue or provide a location" | Stay on form |
| endDate before startDate | "End time must be after start time" | Stay on form, highlight dates |
| startDate in the past (create) | "Start time cannot be in the past" | Stay on form |
| Non-manager attempts edit | "You do not have permission to edit this event" | No state change |
| Invalid status transition | "This event cannot be changed to that status" | No state change |
| Event not found | "Event not found" | Redirect to events list |
| Venue missing name or address | "Venue name and address are required" | Stay on form |
| Invalid tier (empty name, non-positive price) | "Please provide a tier name and a price greater than zero" | Stay on form |
| Network error during any operation | "Something went wrong. Please try again." | Keep user on current screen |

## Edge Cases

1. **Event passes endDate while user is viewing it** — on next fetch, event returns status=FINISHED even if the DB still has ACTIVE. A background reconciliation job can persist the change, but the read path is authoritative.
2. **Manager edits an event to set endDate in the past** — allowed (historical correction); event immediately shows as FINISHED on next read.
3. **Manager cancels an ACTIVE event** — allowed; transitions to CANCELLED. Reversal not supported (CANCELLED is terminal).
4. **Manager tries to reopen a CANCELLED event** — not allowed. Error: "Cancelled events cannot be reopened."
5. **Venue is referenced by events, then someone tries to delete the venue** — out of scope for MVP (no venue deletion endpoint in this feature).
6. **Manager soft-deletes an event that had team members** — cascade behavior deferred until Team Management feature exists. For this feature, deleted events are simply excluded from all reads.
7. **Manager disables door sales after configuring tiers** — tiers are preserved but inactive. Re-enabling restores the same tiers.
8. **Duplicate venue names** — allowed. Venue uniqueness is by id only; two venues can share a name.
9. **Event with venueId where venue was created by another user** — allowed. Venues are globally shared (MVP).
10. **startDate and endDate in different time zones** — stored as UTC; client sends/receives ISO 8601. All validation uses UTC comparison.

## Dependencies

- **Depends on:** Auth (feature #1) — requires authenticated user context
- **Depended on by:**
  - Event Team Management (#3) — extends visibility to team members
  - Lists & Guests (#4) — lists belong to events
  - Door Sales (#6) — sales recording uses tiers configured here
  - Check-in Flow (#5), Notifications (#7), Analytics (#8) — all indirectly depend on events existing

## Out of Scope

- Inviting other users as team members (Managers, Promoters, Hosts) — covered by Event Team Management feature
- Visibility of events to non-Managers — covered by Team Management feature
- Creating or managing Lists on an event — covered by Lists & Guests feature
- Recording door sale entries — covered by Door Sales feature
- Venue editing or deletion — deferred (MVP: create + list only)
- Event discovery / public event browsing
- Event images, cover photos, or media
- Event categories or tags
- Recurring events or event templates
- Promoting other users to Manager role (mentioned in MVP doc but belongs to Team Management)
- Hard delete of events
- Event audit log / change history
- Background auto-close job (lazy check on read is sufficient for MVP)
