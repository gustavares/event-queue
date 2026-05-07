# Door Sales Recording

## Overview

When door sales are enabled on an event, **Hosts** record walk-in entries at the door by selecting a configured tier, capturing the guest's document (CPF or Passport, required), and optionally entering a guest name. Each recorded sale persists as a `DoorSaleEntry` linked to the tier, the recording host, and a timestamp, and surfaces on a single auto-created `DOOR_SALES` list per tier (the recording stream is the source for that list's entries). This feature covers the recording flow only — tier configuration is owned by Events CRUD (#2), payment processing is post-MVP, and reconciliation reporting is owned by Analytics (#8).

## User Stories

- As a Host on an event with door sales enabled, I want to select a tier and capture a guest's document so that I can record a walk-in entry quickly at the door.
- As a Host, I want to optionally enter the guest's name when I have it so that the door record is more useful for later reconciliation, but I am not blocked when I don't.
- As a Host, I want to see a recent feed of door sales I (and my teammates) have recorded for this event so that I can confirm a sale went through and notice mistakes.
- As a Host, I want clear errors when door sales are misconfigured (disabled, no tiers, ended event) so that I don't get stuck staring at an empty screen.

## Business Rules

| ID | Rule |
|----|------|
| BR-DSR-001 | Door sales are recorded by Hosts (any user with the HOST or MANAGER role on the event) |
| BR-DSR-002 | Each sale requires: tier selection and guest document (CPF or Passport) |
| BR-DSR-003 | Guest name is optional for door sales |
| BR-DSR-004 | A door sale can only be recorded on an event whose status is `ACTIVE` and whose `doorSalesEnabled` is `true` |
| BR-DSR-005 | A door sale must reference a tier that belongs to the same event |
| BR-DSR-006 | A recorded `DoorSaleEntry` persists: `tierId`, `documentType`, `documentNumber`, optional `guestName`, `recordedBy` (the host's `userId`), and `createdAt` (server time) |
| BR-DSR-007 | Recording the same document twice on the same event is allowed — the host may be paying for multiple people, and the MVP does not attempt to deduplicate |
| BR-DSR-008 | Hosts can view a chronological feed of recent door sales for events they are on, with per-tier counts visible |
| BR-LST-004 | DOOR_SALES lists are auto-created when door sales are enabled (one per tier) — referenced from Lists & Guests |
| BR-GST-005 | At check-in (and door sale recording): document is required |
| BR-GST-006 | Supported document types: CPF (Brazilian national ID), Passport (foreigners) |
| BR-DSC-001..003 | Door-sales **configuration** rules — owned by Events CRUD (#2), referenced here |

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | A Host on an event with door sales enabled and at least one tier can record a sale by selecting a tier and entering a CPF → a `DoorSaleEntry` is persisted with that tier, document, `recordedBy = host`, and a server timestamp |
| AC-2 | A Host can record a door sale with a Passport document (foreign guest) |
| AC-3 | A Host can record a door sale with an optional guest name → name is stored on the entry |
| AC-4 | A Host can record a door sale without a guest name → entry is stored with no name |
| AC-5 | A Manager of the event (who also implicitly has door-recording authority) can record a door sale |
| AC-6 | After recording, the new entry appears at the top of the recent door-sales feed for the event |
| AC-7 | A Host can view a chronological feed of recent door sales for an event they are on, including per-tier counts |
| AC-8 | The tier picker only shows tiers that belong to the current event |
| AC-9 | Recording a sale on an event with `doorSalesEnabled = false` is rejected with `"Door sales are not enabled for this event"` |
| AC-10 | Recording a sale on a `FINISHED` event is rejected with `"This event has ended"` |
| AC-11 | Recording a sale on a `CANCELLED` event is rejected with `"This event has been cancelled"` |
| AC-12 | Recording a sale on a `DRAFT` event is rejected with `"This event has not started yet"` |
| AC-13 | A user who is not on the event's team attempting to record a sale is rejected with `"You do not have permission to record sales for this event"` |
| AC-14 | Recording a sale without a document is rejected with `"Document is required for door sales"` |
| AC-15 | Recording a sale with an invalid CPF / passport is rejected with `"Please enter a valid CPF or passport number"` |
| AC-16 | Recording a sale without selecting a tier is rejected with `"Please select a tier"` |
| AC-17 | Recording a sale with a tier that does not belong to the event is rejected with `"Selected tier is not available for this event"` |
| AC-18 | When the event has no tiers configured, the tier picker is empty and surfaces `"No tiers configured. Ask the manager to add tiers before recording sales."` |
| AC-19 | Recording the same document twice on the same event is allowed — both entries are persisted independently |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`door-sales.feature`](door-sales.feature) | AC-1..AC-19, Error rows 1..9, EDGE-1..EDGE-7 |

## Error Handling

| # | Scenario | Error Message | Behavior |
|---|----------|---------------|----------|
| 1 | Door sales disabled on the event | `Door sales are not enabled for this event` | Stay on screen, no entry persisted |
| 2 | Event status is `FINISHED` | `This event has ended` | Stay on screen, no entry persisted |
| 3 | Event status is `CANCELLED` | `This event has been cancelled` | Stay on screen, no entry persisted |
| 4 | Event status is `DRAFT` | `This event has not started yet` | Stay on screen, no entry persisted |
| 5 | User is not on the event's team | `You do not have permission to record sales for this event` | Stay on screen, no entry persisted |
| 6 | Document missing | `Document is required for door sales` | Stay on form, highlight field |
| 7 | Document format invalid | `Please enter a valid CPF or passport number` | Stay on form, highlight field |
| 8 | No tier selected at submit | `Please select a tier` | Stay on form, highlight tier picker |
| 9 | No tiers configured for the event | `No tiers configured. Ask the manager to add tiers before recording sales.` | Surface message in the tier picker, disable submit |
| 10 | Tier id from a different event | `Selected tier is not available for this event` | Stay on form, no entry persisted |
| 11 | Network error during any operation | `Something went wrong. Please try again.` | Keep user on current screen |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Event auto-transitions to `FINISHED` (endDate passes) while host has the recording form open | The next recording attempt is rejected with `"This event has ended"` (read-path is authoritative — see BR-STS-008) |
| EDGE-2 | Manager disables door sales while host is mid-form | The next recording attempt is rejected with `"Door sales are not enabled for this event"`; the form does not silently submit |
| EDGE-3 | Manager removes a tier while host is mid-form having selected it | The next recording attempt is rejected with `"Selected tier is not available for this event"` |
| EDGE-4 | Same document recorded twice on the same event by the same host (e.g., paying for a friend) | Allowed — both entries persist independently with their own timestamps; no deduplication in MVP |
| EDGE-5 | Same document recorded on the same event under two different tiers | Allowed — each entry references its own tier independently |
| EDGE-6 | Host who is also a Manager of the same event records a sale | Allowed — Manager implicitly has Host authority for door recording |
| EDGE-7 | Door sales enabled, but the manager has not yet added any tiers | Tier picker is empty; UI surfaces `"No tiers configured. Ask the manager to add tiers before recording sales."` and disables submit until tiers exist |

## Dependencies

- **Depends on:**
  - Auth (#1) — authenticated user context
  - Events CRUD (#2) — provides `Event`, `doorSalesEnabled`, and `DoorSaleTier` records this feature reads
  - Event Team Management (#3) — assigns the HOST role per event (recording permission flows through this)
- **Depended on by:**
  - Lists & Guests (#4) — DOOR_SALES lists (one per tier) are populated by entries recorded here (BR-LST-004)
  - Analytics (#8) — door-sales reconciliation reports aggregate the entries recorded here
  - Notifications (#7) — guest receipts (post-MVP) would consume these entries

## Out of Scope

- **Tier configuration** — adding, editing, removing tiers (covered by Events CRUD #2)
- **Enabling/disabling door sales on an event** — covered by Events CRUD #2
- **Payment processing** — Pix, credit card capture, change calculation (post-MVP per MVP design — MVP records only)
- **Refunds, voids, or editing a recorded sale** — post-MVP
- **Time-based pricing rules** (e.g., "R$30 before midnight, R$50 after") — post-MVP per MVP design
- **Gender-based pricing** — post-MVP per MVP design
- **Area-based pricing** (camarote, open bar, etc.) — post-MVP per MVP design
- **Reconciliation reports / per-tier revenue totals as a report** — covered by Analytics #8 (this feature surfaces only an in-flight recent feed for the recording host)
- **Guest receipt / WhatsApp confirmation** — covered by Notifications #7
- **Linking a door-sale entry to a future check-in / scanning a door-sale entry's QR** — the MVP records the sale but does not generate a QR for door-sale entries (that lives with Lists & Guests #4 if needed later)
- **Deduplicating repeat documents** — explicitly allowed (BR-DSR-007, EDGE-4, EDGE-5)
