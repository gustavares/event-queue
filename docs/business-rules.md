# Business Rules

> Maintained by `/po`. Consolidated reference of all business rules across features. Each rule has an ID for searchability.

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
| BR-EVT-009 | A Manager sees only events they created (MVP; extended when Team Management lands) |

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

## Lists (not yet implemented)

| ID | Rule |
|----|------|
| BR-LST-001 | Lists belong to an event. Three types: OFFICIAL (Manager), PROMOTER (Promoter), DOOR_SALES (system) |
| BR-LST-002 | OFFICIAL lists are created by the Manager |
| BR-LST-003 | PROMOTER lists are created by Promoters for their own guests |
| BR-LST-004 | DOOR_SALES lists are auto-created when door sales are enabled (one per tier) |

## Guests & List Entries (not yet implemented)

| ID | Rule |
|----|------|
| BR-GST-001 | A Guest is a person (name + optional contact), not an app user |
| BR-GST-002 | A ListEntry links a Guest to a List — has its own QR code and check-in status |
| BR-GST-003 | Entries on different lists are independent, even for the same person (separate QR codes, separate credit) |
| BR-GST-004 | Adding a guest to a list: document is optional |
| BR-GST-005 | At check-in: document is required. Host must capture it if missing. |
| BR-GST-006 | Supported document types: CPF (Brazilian national ID), Passport (foreigners) |

## Check-in (not yet implemented)

| ID | Rule |
|----|------|
| BR-CHK-001 | Three check-in methods: QR code scan, name search, door sale |
| BR-CHK-002 | QR scan → guest info → document capture if missing → confirm |
| BR-CHK-003 | Name search → matching entries across all lists → host selects → document if missing → confirm |
| BR-CHK-004 | Door sale → select tier → document required + optional name → record entry |

## Door Sales Recording (not yet implemented)

| ID | Rule |
|----|------|
| BR-DSR-001 | Door sales are recorded by Hosts |
| BR-DSR-002 | Each sale requires: tier selection and guest document (CPF or Passport) |
| BR-DSR-003 | Guest name is optional for door sales |

## Notifications (not yet implemented)

| ID | Rule |
|----|------|
| BR-NTF-001 | When a guest is added to a list and has contact info, they receive a notification with their QR code |
| BR-NTF-002 | Three channels: WhatsApp (most common in Brazil), SMS, Email |

## Analytics (not yet implemented)

| ID | Rule |
|----|------|
| BR-ANL-001 | Analytics are available to Managers only |
| BR-ANL-002 | Metrics: total check-ins, per-list breakdown, promoter performance, door sales by tier |
