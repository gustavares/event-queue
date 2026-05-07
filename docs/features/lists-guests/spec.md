# Lists & Guests

## Overview
Lists organize the people invited or expected at an event. Managers create OFFICIAL lists (the venue's own lists, e.g., "VIP", "Free before midnight"); Promoters create one or more PROMOTER lists for their personal guests. Once a list exists, its owner adds Guests — each addition produces a ListEntry with a unique QR code that can later be scanned at the door. Guests are people, not app users: the same person can appear on several lists at the same event, and each appearance is an independent ListEntry with its own QR and check-in state. Documents (CPF or Passport) are optional at add-time and only become required at check-in (covered by the Check-in feature). DOOR_SALES lists are auto-provisioned by the Door Sales feature and are visible here for read paths but are not created or edited from this feature.

## User Stories

### Lists
- As a Manager, I want to create OFFICIAL lists on my event so that I can organize venue-controlled guest groups
- As a Manager, I want to rename or delete the OFFICIAL lists I own so that I can fix mistakes or retire a list
- As a Promoter, I want to create my own PROMOTER list on an event so that I can collect my personal guests
- As a Promoter, I want to rename or delete my own PROMOTER list so that I can fix mistakes or retire it
- As a Manager, I want to see every list on my event (OFFICIAL, every PROMOTER list, DOOR_SALES if enabled) so that I have a complete view of the door
- As a Promoter, I want to see only my own lists on an event so that I focus on what I control
- As a Host, I want to read every list on the events I'm working so that I can search across all of them at the door

### Guests & List Entries
- As a Promoter, I want to add a guest (name + optional contact) to my own list so that they can be checked in at the door
- As a Manager, I want to add a guest to one of my OFFICIAL lists so that I can populate venue lists directly
- As a Promoter or Manager, I want adding a guest to be possible without a document so that I can register them when only the name is known
- As a Promoter, I want to remove an entry from my own list (if not yet checked in) so that I can correct mistakes
- As a Manager, I want to remove an entry from any list on my event (if not yet checked in) so that I can correct mistakes anywhere
- As a Promoter, I want to view the entries on my own list with their check-in status so that I can track who showed up
- As a Manager, I want to view the entries on any list with check-in status and promoter attribution so that I can audit the door
- As a Promoter or Manager, I want to edit a guest's name or contact info before they check in so that I can correct typos or add a phone number captured later

## Business Rules

### Lists
| ID | Rule |
|----|------|
| BR-LST-001 | Lists belong to an event. Three types: OFFICIAL (Manager), PROMOTER (Promoter), DOOR_SALES (system) |
| BR-LST-002 | OFFICIAL lists are created by the Manager of the event |
| BR-LST-003 | PROMOTER lists are created by Promoters for their own guests |
| BR-LST-004 | DOOR_SALES lists are auto-created when door sales are enabled (one per tier) — owned by the Door Sales feature, not editable here |
| BR-LST-005 | A list requires a non-empty `name` (trimmed); duplicate names within the same event are allowed |
| BR-LST-006 | OFFICIAL lists can be renamed only by the event's Manager; PROMOTER lists can be renamed only by their owning Promoter |
| BR-LST-007 | The list `type` is set at creation and is immutable thereafter |
| BR-LST-008 | A Manager can delete an OFFICIAL list they own; a Promoter can delete only their own PROMOTER list |
| BR-LST-009 | DOOR_SALES lists cannot be created, renamed, or deleted from this feature (managed by Door Sales) |
| BR-LST-010 | Deleting a list cascades to its ListEntries; ListEntries with `status = CHECKED_IN` block the delete |
| BR-LST-011 | A Manager reads every list on their event (OFFICIAL, every PROMOTER list, DOOR_SALES) |
| BR-LST-012 | A Promoter reads only the PROMOTER lists they own on a given event |
| BR-LST-013 | A Host reads every list on the events where they are assigned as Host |
| BR-LST-014 | Lists can only be created or modified on events with status `DRAFT` or `ACTIVE`; `FINISHED` and `CANCELLED` events are read-only |

### Guests & List Entries
| ID | Rule |
|----|------|
| BR-GST-001 | A Guest is a person (name + optional contact), not an app user |
| BR-GST-002 | A ListEntry links a Guest to a List — has its own QR code and check-in status |
| BR-GST-003 | Entries on different lists are independent, even for the same person (separate QR codes, separate credit) |
| BR-GST-004 | Adding a guest to a list: document is optional |
| BR-GST-005 | At check-in: document is required. Host must capture it if missing. (Owned by Check-in feature) |
| BR-GST-006 | Supported document types: CPF (Brazilian national ID), Passport (foreigners) |
| BR-GST-007 | Adding a guest requires a non-empty `name` (trimmed); contact fields (email, phone) are optional |
| BR-GST-008 | Each ListEntry receives a unique unguessable `qrCode` token at creation |
| BR-GST-009 | A Promoter may add or remove entries only on PROMOTER lists they own |
| BR-GST-010 | A Manager may add or remove entries only on OFFICIAL lists on their own event |
| BR-GST-011 | An entry whose `status = CHECKED_IN` cannot be removed |
| BR-GST-012 | Adding the same person to a different list creates a new Guest record (or reuses none) and a new ListEntry — entries are not deduplicated across lists |
| BR-GST-013 | A guest's name and contact fields can be edited by the entry owner (Promoter for their list; Manager for OFFICIAL lists) only while `status = PENDING` |
| BR-GST-014 | If contact info is provided when an entry is created, a notification is dispatched (owned by Notifications feature; the trigger event lives here) |
| BR-GST-015 | List-entry views always include the entry's check-in status; Manager view also includes the owning Promoter (for PROMOTER lists) and a per-list summary count |

## Acceptance Criteria

### Lists

| ID | Criterion |
|----|-----------|
| AC-1 | Manager can create an OFFICIAL list on their event with a name → list is returned with `type = OFFICIAL` |
| AC-2 | Promoter can create a PROMOTER list on an event where they are a Promoter → list is returned with `type = PROMOTER` and ownership attributed to that Promoter |
| AC-3 | Creating a list with an empty or whitespace-only name returns a validation error |
| AC-4 | Two lists on the same event may share a name (uniqueness is by id) |
| AC-5 | Manager can rename an OFFICIAL list they own |
| AC-6 | Promoter can rename their own PROMOTER list |
| AC-7 | Non-owner attempting to rename a list returns an authorization error |
| AC-8 | Manager can delete an OFFICIAL list they own (no entries checked in) |
| AC-9 | Promoter can delete their own PROMOTER list (no entries checked in) |
| AC-10 | Deleting a list with PENDING entries cascades and removes the entries |
| AC-11 | Deleting a list with at least one CHECKED_IN entry returns an error and leaves the list intact |
| AC-12 | Non-owner attempting to delete a list returns an authorization error |
| AC-13 | Attempts to create, rename, or delete a DOOR_SALES list from this feature return an error |
| AC-14 | Manager listing the event's lists sees OFFICIAL, every PROMOTER list, and DOOR_SALES (if door sales enabled) |
| AC-15 | Promoter listing the event's lists sees only the PROMOTER lists they own |
| AC-16 | Host listing the event's lists sees every list on events where they are assigned as Host |
| AC-17 | Creating, renaming, or deleting a list on a FINISHED or CANCELLED event returns an error |
| AC-18 | A user with no role on an event cannot read, create, or modify lists for that event |

### Guests & List Entries

| ID | Criterion |
|----|-----------|
| AC-19 | Promoter adds a guest with name only to their own PROMOTER list → a Guest record and a ListEntry with a unique QR code are created |
| AC-20 | Promoter adds a guest with name + email + phone to their own PROMOTER list → contact info is stored on the Guest |
| AC-21 | Promoter or Manager adds a guest with an optional document (CPF or Passport) → document is stored on the Guest |
| AC-22 | Manager adds a guest to an OFFICIAL list on their event → ListEntry is created with the Manager attributed as the entry's creator |
| AC-23 | Adding a guest with an empty or whitespace-only name returns a validation error |
| AC-24 | Adding a guest with an invalid CPF format returns a validation error |
| AC-25 | Adding a guest with an unsupported document type returns a validation error |
| AC-26 | Adding the same person (same name + document) to two different lists produces two ListEntries with two distinct QR codes |
| AC-27 | Adding a guest with contact info triggers a notification dispatch (delegated to Notifications feature) |
| AC-28 | Promoter removes a PENDING entry from their own list → entry is removed; Guest record is unaffected if referenced by other entries |
| AC-29 | Manager removes a PENDING entry from any list on their event |
| AC-30 | Removing an entry with `status = CHECKED_IN` returns an error and leaves the entry intact |
| AC-31 | Promoter attempting to add or remove on a list they do not own returns an authorization error |
| AC-32 | Promoter views entries on their own list, each with its check-in status |
| AC-33 | Manager views entries on any list, each with its check-in status; PROMOTER lists also surface the owning Promoter on the entry |
| AC-34 | Promoter or Manager edits a PENDING entry's guest name and contact fields; the Guest record is updated |
| AC-35 | Editing a CHECKED_IN entry's guest fields returns an error |
| AC-36 | Adding, removing, or editing entries on a FINISHED or CANCELLED event returns an error |
| AC-37 | A user with no role on an event cannot read or modify entries for that event |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`lists.feature`](lists.feature) | AC-1..AC-18, Error rows 1-5 + 8-10, EDGE-1, EDGE-2, EDGE-3, EDGE-7 |
| [`guests.feature`](guests.feature) | AC-19..AC-37, Error rows 6-10, EDGE-4, EDGE-5, EDGE-6, EDGE-8, EDGE-9 |

## Error Handling

| # | Scenario | Error Message | Behavior |
|---|----------|--------------|----------|
| 1 | Empty or whitespace-only list name | `Please provide a list name` | Stay on form, highlight name field |
| 2 | Non-owner renames or deletes a list | `You do not have permission to edit this list` | No state change |
| 3 | Delete a list with at least one CHECKED_IN entry | `This list has guests who have already checked in and cannot be deleted` | List and entries unchanged |
| 4 | Create / rename / delete a DOOR_SALES list from this feature | `Door-sale lists are managed by door-sales settings` | No state change |
| 5 | List action on a FINISHED or CANCELLED event | `This event is closed and can no longer be edited` | No state change |
| 6 | Empty or whitespace-only guest name | `Please provide a guest name` | Stay on form, highlight name field |
| 7 | Invalid CPF format | `Please enter a valid CPF` | Stay on form |
| 8 | Unsupported document type | `Document must be a CPF or a Passport` | Stay on form |
| 9 | Remove a CHECKED_IN entry | `This guest has already checked in and cannot be removed` | Entry unchanged |
| 10 | Edit a CHECKED_IN entry's guest fields | `This guest has already checked in and cannot be edited` | Entry unchanged |
| 11 | Non-owner adds, removes, or edits an entry | `You do not have permission to edit this list` | No state change |
| 12 | User with no role on the event reads or modifies lists/entries | `You do not have permission to view this event` | No data returned, no state change |
| 13 | Network error during any operation | `Something went wrong. Please try again.` | Keep user on current screen |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Two lists on the same event share an identical name | Allowed — uniqueness is by id only; both lists are returned in listings with their distinct ids |
| EDGE-2 | Deleting a PROMOTER list that has only PENDING entries | Cascade: entries are removed alongside the list; their QR codes become invalid |
| EDGE-3 | Manager deletes their own OFFICIAL list while a Host is viewing it | Allowed; the Host's next read returns "list not found" — Hosts handle gracefully (out-of-band UX) |
| EDGE-4 | Same person (same document) added to two different lists at the same event | Two ListEntries are produced, each with its own QR; the QR scanned at check-in determines which list/promoter gets credit |
| EDGE-5 | Guest is added without contact info | No notification is dispatched; the entry is still created and shows in the list |
| EDGE-6 | Guest is added with only a phone number (no email) | Notification dispatch is delegated to Notifications and may use WhatsApp or SMS; absence of email does not block creation |
| EDGE-7 | Promoter is removed from the event's team while their PROMOTER list has entries | List ownership/cascade behavior is delegated to Team Management; out of scope here |
| EDGE-8 | Guest record is shared across two entries and one entry is removed | The Guest record is preserved (referenced by another entry); only the removed entry's QR becomes invalid |
| EDGE-9 | Promoter edits a guest's phone number after the guest has been notified | Edit is allowed (entry is PENDING); resending the notification is delegated to Notifications and is out of scope |

## Dependencies

- **Depends on:**
  - Auth (#1) — requires authenticated user context
  - Events CRUD (#2) — lists belong to events; event status gates write operations
  - Event Team Management (#3) — Promoter and Host roles must be assigned for them to act on a given event
- **Depended on by:**
  - Check-in (#5) — uses ListEntry QR codes and status
  - Door Sales (#6) — auto-creates DOOR_SALES lists; this feature must surface them in read paths
  - Notifications (#7) — listens for the guest-add trigger to send WhatsApp/SMS/Email
  - Analytics (#8) — aggregates over ListEntry rows

## Out of Scope

- Check-in mechanics (QR scan, name search flow, document capture at the door) — owned by Check-in (#5)
- Door sale recording (capturing a paid walk-in) — owned by Door Sales (#6)
- DOOR_SALES list creation / mutation — owned by Door Sales (#6); this feature only surfaces them in read paths
- Notification dispatch (WhatsApp / SMS / Email send mechanics) — owned by Notifications (#7); this feature only fires the trigger when contact info is present
- Resending or re-triggering notifications after a guest edit
- Bulk guest import (CSV / Excel / Google Sheets paste) — post-MVP
- Guest → User account linking — post-MVP
- Reassigning entries between lists or transferring promoter credit
- Cascading list ownership when a Promoter is removed from the event team — owned by Team Management (#3)
- Per-list capacity / cap enforcement — post-MVP
- Per-list time-window rules (e.g., "Free before midnight" enforcement) — post-MVP, captured as a list name only
- Guest hard-delete (privacy / GDPR equivalent) — post-MVP
- Audit log of list / entry changes
