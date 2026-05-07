# Event Team Management

## Overview
Managers build the team that runs each of their events. They can add other registered users by email, assign one of three event roles (Manager, Promoter, Host), promote others to Manager, and remove team members. Once added, Promoters and Hosts see the event in their own events list — extending event visibility beyond the original creator. Roles are per-event: a user can be a Manager on one event and a Host on another. Invitations in the MVP are direct adds by email; if the email does not match an existing user, the operation fails. Email-validated invitation/acceptance flows, venue-level team templates, and audit logs are deferred.

## User Stories
- As a Manager, I want to add a Promoter to my event by email so that they can build their own guest list
- As a Manager, I want to add a Host to my event by email so that they can check guests in at the door
- As a Manager, I want to promote another user to Manager so that I can share full control of the event
- As a Manager, I want to remove a team member so that they no longer have access to the event
- As a Manager, I want to see everyone on my event's team so that I know who is helping run it
- As a Promoter, I want my events list to show events I am on so that I can manage my lists for them
- As a Host, I want my events list to show events I am working so that I can run check-in for them

## Business Rules

| ID | Rule |
|----|------|
| BR-ROLE-001 | There are no global roles — roles are per-event, assigned via EventTeamMember (mirrored from `business-rules.md`) |
| BR-ROLE-002 | Three event roles: Manager (full control), Promoter (own lists), Host (check-in/door sales) (mirrored from `business-rules.md`) |
| BR-ROLE-003 | Creating an event makes the creator its Manager (mirrored from `business-rules.md`) |
| BR-ROLE-004 | A user can have different roles on different events (mirrored from `business-rules.md`) |
| BR-ROLE-005 | A Manager can promote other users to Manager (mirrored from `business-rules.md`) |
| BR-TEAM-001 | Only a Manager of the event can add, remove, or change the role of a team member |
| BR-TEAM-002 | Team members are added by email — the email must match an existing User account |
| BR-TEAM-003 | A user may hold only one role per event at a time; adding the same user a second time on the same event is rejected |
| BR-TEAM-004 | A Manager cannot remove themselves from the event (self-removal is out of scope for MVP) |
| BR-TEAM-005 | The event creator's Manager assignment cannot be removed (the original creator always remains a Manager) |
| BR-TEAM-006 | An event must always have at least one Manager — operations that would leave it with zero Managers are rejected |
| BR-TEAM-007 | A team member's role can be changed in place (e.g., Promoter → Host, Promoter → Manager); the change must satisfy BR-TEAM-006 |
| BR-TEAM-008 | A Promoter or Host on an event sees that event in their events list and can fetch it by id (extends BR-EVT-009) |
| BR-TEAM-009 | A Promoter or Host on an event has no edit, status, or delete permission — those remain Manager-only (per BR-EVT-008) |
| BR-TEAM-010 | When an event is soft-deleted, its team membership records remain but the event is excluded from all team members' reads |

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Manager can add a registered user to their event as a Promoter by email — team member is created with role PROMOTER |
| AC-2 | Manager can add a registered user to their event as a Host by email — team member is created with role HOST |
| AC-3 | Manager can add a registered user to their event as a Manager by email — team member is created with role MANAGER (BR-ROLE-005) |
| AC-4 | Manager can change an existing team member's role (e.g., Promoter → Host, Promoter → Manager) |
| AC-5 | Manager can remove a non-creator team member — membership record is deleted |
| AC-6 | Manager can list everyone on their event's team, including roles, names, and emails |
| AC-7 | A Promoter added to an event sees the event in their events list and can fetch it by id |
| AC-8 | A Host added to an event sees the event in their events list and can fetch it by id |
| AC-9 | A user with role X on event A and role Y on event B sees both events with the correct role per event |
| AC-10 | Adding a team member with an email that has no matching User account returns a validation error |
| AC-11 | Adding a user who is already on the event's team returns a validation error |
| AC-12 | A non-Manager attempting to add, remove, or change a team member's role returns an authorization error |
| AC-13 | The event creator's Manager assignment cannot be removed |
| AC-14 | Demoting the only remaining Manager (so the event would have zero Managers) is rejected |
| AC-15 | Removing the only remaining Manager is rejected |
| AC-16 | A Manager cannot remove themselves from the team (self-removal is rejected) |
| AC-17 | A Promoter or Host attempting to edit, transition, or delete the event still gets the standard authorization error from Events CRUD |
| AC-18 | When the event is soft-deleted, it disappears from the events lists of every team member (Manager, Promoter, Host) |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`team-management.feature`](team-management.feature) | AC-1..AC-18, all Error Handling rows, EDGE-1..EDGE-7 |

## Error Handling

| # | Scenario | Error Message | Behavior |
|---|----------|--------------|----------|
| 1 | Adding a member by email that does not match a User | `No account found for that email` | Stay on add-member form |
| 2 | Adding a user who is already on the team | `This user is already on the team` | Stay on add-member form |
| 3 | Non-Manager attempts to add, remove, or change a team member | `You do not have permission to manage this event's team` | No state change |
| 4 | Manager attempts to remove themselves | `You cannot remove yourself from the team` | No state change |
| 5 | Attempt to remove the original event creator's Manager assignment | `The event creator must remain a Manager` | No state change |
| 6 | Removing or demoting would leave the event with zero Managers | `An event must have at least one Manager` | No state change |
| 7 | Network error during any team operation | `Something went wrong. Please try again.` | Stay on current screen |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Same email belongs to a user who already has a different role on another event | Allowed — the new event gets its own EventTeamMember; the other event is unaffected (BR-ROLE-004) |
| EDGE-2 | Adding the same user to the same event twice (any role) | Rejected with `This user is already on the team` (BR-TEAM-003) |
| EDGE-3 | Manager promotes a Promoter to Manager, then the original creator can no longer be removed but can be demoted | The new Manager has full Manager rights; creator's Manager role is locked (BR-TEAM-005) |
| EDGE-4 | A Promoter who was added is later removed | Event disappears from the Promoter's events list immediately on next read; existing lists/entries created by them are not affected by this feature |
| EDGE-5 | Manager soft-deletes the event while it has team members | Membership records remain but the event is excluded from all team members' reads (BR-TEAM-010) |
| EDGE-6 | Email lookup is case-insensitive | "Ana@Example.com" matches the existing user "ana@example.com" |
| EDGE-7 | Manager attempts to demote themselves while they are the only Manager | Rejected with `An event must have at least one Manager`; Manager keeps their role |

## Dependencies

- **Depends on:**
  - Auth (#1) — requires authenticated user context and the User entity for email lookup
  - Events CRUD (#2) — events must exist; extends `BR-EVT-009` to give Promoters and Hosts read access
- **Depended on by:**
  - Lists & Guests (#4) — Promoter lists belong to a Promoter who is on the event's team
  - Check-in Flow (#5) — Hosts perform check-ins for events they are on
  - Door Sales recording (#6) — Hosts record sales for events they are on
  - Analytics (#8) — Manager-only views remain Manager-only (BR-TEAM-009)

## Out of Scope

- Email-validated invitation / acceptance flow (MVP is direct add by email if the User exists)
- Inviting people who do not yet have an account (no pending-invite records)
- Self-removal by team members (a member who wants to leave must ask a Manager)
- Cross-event role inheritance (each event has its own team)
- Venue-level team templates (post-MVP per MVP design doc)
- Audit log of role changes / additions / removals
- Bulk add (CSV, multi-email) — MVP is one user at a time
- Notifying users when they are added to or removed from an event
- Restricting which roles can be promoted to which other roles beyond the rules above (e.g., no Promoter→Host throttle)
