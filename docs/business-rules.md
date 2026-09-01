# Business Rules

> Maintained by `/po`. Consolidated reference of all business rules across features. Each rule has an ID for searchability. Rules are added or amended only when an approved spec covers them.

## Auth

| ID | Rule |
|----|------|
| BR-AUTH-001 | Email must be unique across all users |
| BR-AUTH-002 | Password is hashed with Argon2 before storage |
| BR-AUTH-003 | JWT token is issued on successful sign-up or sign-in |
| BR-AUTH-004 | Token is stored in SecureStore (native) or localStorage (web) |
| BR-AUTH-005 | App restores session on launch by validating stored token via `me` query |
| BR-AUTH-006 | Expired or invalid token on restore silently redirects to sign-in |

## Users & Roles

| ID | Rule |
|----|------|
| BR-ROLE-001 | There are no global roles — roles are per-event, assigned via EventTeamMember |
| BR-ROLE-002 | Three event roles: Manager (full control), Promoter (own lists), Host (check-in/door sales) |
| BR-ROLE-003 | Creating an event makes the creator its Manager |
| BR-ROLE-004 | A user can have different roles on different events |
| BR-ROLE-005 | A Manager can promote other users to Manager (Team Management feature) |

## Event Team Management

| ID | Rule |
|----|------|
| BR-TEAM-001 | Only a Manager of the event can add, remove, or change the role of a team member |
| BR-TEAM-002 | Team members are added by email — the email must match an existing User account |
| BR-TEAM-003 | A user may hold only one role per event at a time; adding the same user a second time on the same event is rejected |
| BR-TEAM-004 | A Manager cannot remove themselves from the event (self-removal is out of scope for MVP) |
| BR-TEAM-005 | The event creator's Manager assignment cannot be removed (the original creator always remains a Manager) |
| BR-TEAM-006 | An event must always have at least one Manager — operations that would leave it with zero Managers are rejected |
| BR-TEAM-007 | A team member's role can be changed in place; the change must satisfy BR-TEAM-006 |
| BR-TEAM-008 | A Promoter or Host on an event sees that event in their events list and can fetch it by id (extends BR-EVT-009) |
| BR-TEAM-009 | A Promoter or Host on an event has no edit, status, or delete permission — those remain Manager-only (per BR-EVT-008) |
| BR-TEAM-010 | When an event is soft-deleted, its team membership records remain but the event is excluded from all team members' reads |

## Venues

| ID | Rule |
|----|------|
| BR-VEN-001 | Venues are globally readable — any authenticated user can list all venues |
| BR-VEN-002 | Any authenticated user can create a venue |
| BR-VEN-003 | Venues require: name and address; capacity is optional |
| BR-VEN-004 | Capacity must be a positive integer if provided |
| BR-VEN-005 | Duplicate venue names are allowed — uniqueness is by id only |
| BR-VEN-006 | Venue editing and deletion are deferred (MVP: create + list only) |

## Events

| ID | Rule |
|----|------|
| BR-EVT-001 | Events must have: name, startDate, and either a venueId OR inline locationName + locationAddress |
| BR-EVT-002 | If venueId is provided, locationName and locationAddress are ignored |
| BR-EVT-003 | If venueId is not provided, locationName and locationAddress are both required |
| BR-EVT-004 | endDate is optional; defaults to startDate + 12 hours |
| BR-EVT-005 | endDate must be after startDate |
| BR-EVT-006 | startDate cannot be in the past at creation time (edit allows past dates for historical corrections) |
| BR-EVT-007 | Events are soft-deleted (deleted flag + deletedAt), not hard-deleted |
| BR-EVT-008 | Only the event's Manager can edit, change status, or delete the event |
| BR-EVT-009 | A Manager sees only events they created (MVP; extended via BR-TEAM-008 when Team Management lands) |
| BR-EVT-010 | Non-manager attempts to edit, delete, or transition an event return `"You do not have permission to edit this event"` |

## Event Status Lifecycle

| ID | Rule |
|----|------|
| BR-STS-001 | Status lifecycle: DRAFT → ACTIVE → FINISHED → CANCELLED |
| BR-STS-002 | DRAFT → ACTIVE (publish) |
| BR-STS-003 | ACTIVE → FINISHED (close) |
| BR-STS-004 | FINISHED → ACTIVE (reopen) |
| BR-STS-005 | DRAFT → CANCELLED |
| BR-STS-006 | ACTIVE → CANCELLED |
| BR-STS-007 | CANCELLED is terminal — no transitions out |
| BR-STS-008 | Events auto-transition to FINISHED when endDate passes (lazy check on read) |

## Door Sales Configuration

| ID | Rule |
|----|------|
| BR-DSC-001 | Only the event's Manager can enable/disable door sales and configure tiers |
| BR-DSC-002 | Door sale tiers require: name (non-empty) and price (positive decimal) |
| BR-DSC-003 | Disabling door sales does not delete tier configuration (preserved for reactivation) |
| BR-DSC-004 | Tier with empty name or non-positive price is rejected with `"Please provide a tier name and a price greater than zero"` |
| BR-DSC-005 | Only the event's Manager can add, update, or remove tiers (specialization of BR-DSC-001) |

## Lists

| ID | Rule |
|----|------|
| BR-LST-001 | Lists belong to an event. Three types: OFFICIAL (Manager), PROMOTER (Promoter), DOOR_SALES (system) |
| BR-LST-002 | OFFICIAL lists are created by the Manager of the event |
| BR-LST-003 | PROMOTER lists are created by Promoters for their own guests |
| BR-LST-004 | DOOR_SALES lists are auto-created when door sales are enabled (one per tier) — owned by Door Sales feature |
| BR-LST-005 | A list requires a non-empty `name` (trimmed); duplicate names within the same event are allowed |
| BR-LST-006 | OFFICIAL lists can be renamed only by the event's Manager; PROMOTER lists can be renamed only by their owning Promoter |
| BR-LST-007 | The list `type` is set at creation and is immutable thereafter |
| BR-LST-008 | A Manager can delete an OFFICIAL list they own; a Promoter can delete only their own PROMOTER list |
| BR-LST-009 | DOOR_SALES lists cannot be created, renamed, or deleted from the Lists feature (managed by Door Sales) |
| BR-LST-010 | Deleting a list cascades to its ListEntries; ListEntries with `status = CHECKED_IN` block the delete |
| BR-LST-011 | A Manager reads every list on their event (OFFICIAL, every PROMOTER list, DOOR_SALES) |
| BR-LST-012 | A Promoter reads only the PROMOTER lists they own on a given event |
| BR-LST-013 | A Host reads every list on the events where they are assigned as Host |
| BR-LST-014 | Lists can only be created or modified on events with status `DRAFT` or `ACTIVE`; `FINISHED` and `CANCELLED` events are read-only |

## Guests & List Entries

| ID | Rule |
|----|------|
| BR-GST-001 | A Guest is a person (name + optional contact), not an app user |
| BR-GST-002 | A ListEntry links a Guest to a List — has its own QR code and check-in status |
| BR-GST-003 | Entries on different lists are independent, even for the same person (separate QR codes, separate credit) |
| BR-GST-004 | Adding a guest to a list: document is optional |
| BR-GST-005 | At check-in: document is required. Host must capture it if missing. |
| BR-GST-006 | Supported document types: CPF (Brazilian national ID), Passport (foreigners) |
| BR-GST-007 | Adding a guest requires a non-empty `name` (trimmed); contact fields (email, phone) are optional |
| BR-GST-008 | Each ListEntry receives a unique unguessable `qrCode` token at creation |
| BR-GST-009 | A Promoter may add or remove entries only on PROMOTER lists they own |
| BR-GST-010 | A Manager may add or remove entries only on OFFICIAL lists on their own event |
| BR-GST-011 | An entry whose `status = CHECKED_IN` cannot be removed |
| BR-GST-012 | Adding the same person to a different list creates a new ListEntry — entries are not deduplicated across lists |
| BR-GST-013 | A guest's name and contact fields can be edited by the entry owner only while `status = PENDING` |
| BR-GST-014 | If contact info is provided when an entry is created, a notification is dispatched (owned by Notifications) |
| BR-GST-015 | List-entry views always include the entry's check-in status; Manager view also includes the owning Promoter (for PROMOTER lists) and a per-list summary count |
| BR-GST-016 | CPF must be 11 numeric digits; Passport accepts any non-empty string (used at check-in and door-sale recording) |

## Check-in

| ID | Rule |
|----|------|
| BR-CHK-001 | Three check-in methods: QR code scan, name search, door sale (door sale handled in Door Sales Recording feature) |
| BR-CHK-002 | QR scan → guest info → document capture if missing → confirm |
| BR-CHK-003 | Name search → matching entries across all lists → host selects → document if missing → confirm |
| BR-CHK-005 | Only Hosts and Managers on the event's team can perform check-in |
| BR-CHK-006 | Check-in is allowed only on events with status ACTIVE or FINISHED; CANCELLED events reject check-in (FINISHED is permitted for late-arrival corrections, with a non-blocking notice) |
| BR-CHK-007 | Re-checking a guest who is already CHECKED_IN is a no-op — original `checkedInAt` and `checkedInBy` are preserved |
| BR-CHK-008 | On a successful check-in, the entry's status flips to CHECKED_IN and the system records `checkedInAt` (now) and `checkedInBy` (the acting host) |
| BR-CHK-009 | Name search returns every matching ListEntry across every list on the event; entries on different lists for the same person appear as separate rows (reinforces BR-GST-003) |
| BR-CHK-010 | Reversing a check-in (un-check-in) is deferred to post-MVP |

## Door Sales Recording

| ID | Rule |
|----|------|
| BR-DSR-001 | Door sales are recorded by Hosts (any user with the HOST or MANAGER role on the event) |
| BR-DSR-002 | Each sale requires: tier selection and guest document (CPF or Passport) |
| BR-DSR-003 | Guest name is optional for door sales |
| BR-DSR-004 | A door sale can only be recorded on an event whose status is `ACTIVE` and whose `doorSalesEnabled` is `true` |
| BR-DSR-005 | A door sale must reference a tier that belongs to the same event |
| BR-DSR-006 | A recorded `DoorSaleEntry` persists: `tierId`, `documentType`, `documentNumber`, optional `guestName`, `recordedBy` (the host's `userId`), and `createdAt` (server time) |
| BR-DSR-007 | Recording the same document twice on the same event is allowed — MVP does not deduplicate |
| BR-DSR-008 | Hosts can view a chronological feed of recent door sales for events they are on, with per-tier counts visible |

## Notifications

| ID | Rule |
|----|------|
| BR-NTF-001 | When a guest is added to a list and has at least one contact channel populated, a notification is dispatched with their QR code |
| BR-NTF-002 | Three channels are supported: WhatsApp (most common in Brazil), SMS, Email |
| BR-NTF-003 | Channel selection: WhatsApp is attempted if phone is present; SMS is attempted only as fallback when WhatsApp delivery fails; Email is dispatched in addition (independently) if email is present |
| BR-NTF-004 | Notification dispatch is best-effort and asynchronous — a guest is added regardless of dispatch outcome |
| BR-NTF-005 | Notification failures are logged (per-channel) for the event's manager to review later |
| BR-NTF-006 | Notification content includes: guest name, event name, event date/time, venue/location, and the list entry's QR code |
| BR-NTF-007 | Notifications are dispatched only to Guests, never to Hosts or Managers themselves |
| BR-NTF-008 | Notification language is PT-BR (Brazilian Portuguese) — multi-language is post-MVP |
| BR-NTF-009 | The trigger is "list entry created with guest having contact info" — same dispatch logic regardless of who creates the entry |
| BR-NTF-010 | Notification dispatch implementation is provider-agnostic — the system depends on an abstract notification interface, not a specific provider |

## Analytics

| ID | Rule |
|----|------|
| BR-ANL-001 | Analytics are available to Managers only — Promoters and Hosts cannot read them |
| BR-ANL-002 | The Analytics view exposes four metric groups: total check-ins, per-list breakdown, promoter performance, and door sales by tier |
| BR-ANL-003 | Metrics are computed from the current state of the event at read time (no separate snapshot) |
| BR-ANL-004 | Analytics are scoped to a single event — there is no cross-event roll-up in MVP |
| BR-ANL-005 | Check-in rate = `checkedIn / totalGuests`; when `totalGuests = 0`, the rate is displayed as `—` (em dash) to make division-by-zero unambiguous |
| BR-ANL-006 | Per-list breakdown includes every list attached to the event, including DOOR_SALES lists and PROMOTER lists with zero entries |
| BR-ANL-007 | Promoter-performance rows include every team member with role Promoter on the event, even those who created no list entries |
| BR-ANL-008 | When door sales are not enabled for the event, the door-sales-by-tier section is hidden (or rendered as an explicit empty state) and does not raise an error |
| BR-ANL-009 | Door-sale revenue per tier is the sum of `tier.price` across all `DoorSaleEntry` rows for that tier |
| BR-ANL-010 | Analytics are readable for events in any status (DRAFT, ACTIVE, FINISHED, CANCELLED); the view does not gate on status |

## Public Discovery — Visibility

| ID | Rule |
|----|------|
| BR-DISC-001 | Every event has a visibility of PUBLIC or UNLISTED; the default is UNLISTED |
| BR-DISC-002 | Events that exist when public discovery ships are UNLISTED; nothing is published retroactively |
| BR-DISC-003 | Only PUBLIC events appear in public listings |
| BR-DISC-004 | The public listing surface requires no authentication, and is the only unauthenticated surface in the API |
| BR-DISC-005 | The public representation of an event exposes only: name, description, curator note, start and end time, venue name, address, city, genres, lineup, ticket destination, and price range. It never exposes team members, lists, guests, check-ins, door sale records, promoter attribution, or the creating user |
| BR-DISC-006 | An event has a source of FIRST_PARTY (sold through Event Queue) or CURATED (listed only) |
| BR-DISC-007 | A CURATED event must carry an external ticket URL; a FIRST_PARTY event must not |
| BR-DISC-008 | Every public event has a unique, stable, URL-safe slug; a slug stays reserved after unpublishing so old links never resolve to a different event |
| BR-DISC-009 | An event is listed under exactly one city, taken from its venue; an event with an inline location must have a city assigned explicitly, and one with no city is listed nowhere |
| BR-DISC-010 | Public listings show upcoming events only; an event whose start time has passed is no longer upcoming |
| BR-DISC-011 | Public listings are ordered by start time ascending and grouped by start date — an event crossing midnight belongs to its start date |
| BR-DISC-012 | A CANCELLED event stays visible with a cancelled marker until its start time passes |
| BR-DISC-013 | A DRAFT event can never be PUBLIC |
| BR-DISC-014 | A city has a name, a state (UF), and a unique slug |
| BR-DISC-015 | A venue belongs to exactly one city |

## Public Discovery — Artists & Lineup

| ID | Rule |
|----|------|
| BR-ART-001 | An artist has a name and an optional external link; artists are global, not per-event |
| BR-ART-002 | Artist names are unique case-insensitively; adding an existing name reuses the record rather than creating a duplicate |
| BR-ART-003 | An event's lineup is an ordered list of artists, in the order the curator sets |
| BR-ART-004 | A lineup entry may be marked as headliner |
| BR-ART-005 | Lineup is optional; an event with no lineup is valid and renders without a lineup section |

## Public Discovery — Curation

| ID | Rule |
|----|------|
| BR-CUR-001 | Only an operator with the curator capability can create or edit CURATED events |
| BR-CUR-002 | Curated ingestion takes a source URL, extracts structured facts, and presents them for human confirmation before saving |
| BR-CUR-003 | Nothing is saved or published from extraction without explicit human confirmation |
| BR-CUR-004 | Only factual fields are taken from a source: name, date and time, venue, address, lineup, price, ticket URL. Description prose and images are never copied — the description is written by Event Queue |
| BR-CUR-005 | Every curated event records the source URL it was derived from |
| BR-CUR-006 | The curator note is original editorial copy written by Event Queue |
| BR-CUR-007 | An event may be featured for a date window; featured events surface above the listing for their city, and a window that has passed has no effect |
| BR-CUR-008 | If extraction cannot determine a required field, the event is saved as a draft for manual completion, never published with a guessed value. A start date read as being in the past counts as missing |
| BR-CUR-009 | A source URL that has already been ingested is reported as a duplicate instead of creating a second listing |

## Public Discovery — Newsletter Capture

| ID | Rule |
|----|------|
| BR-SUB-001 | Anyone can subscribe to a city's list with an email address, without an account |
| BR-SUB-002 | Email is unique per city; re-subscribing is idempotent and does not create a duplicate |
| BR-SUB-003 | A subscriber record stores email, city, consent timestamp, and an unsubscribe token |
| BR-SUB-004 | No email is sent by this feature; capture only |
| BR-SUB-005 | Subscription requires explicit opt-in and records when consent was given (LGPD) |
