# Check-in Flow (Host)

## Overview
Hosts working the door check guests into an event. There are two check-in methods covered here: scanning a guest's QR code, or searching by name across every list on the event. In both flows, the host sees the guest's identity and which list/promoter they belong to, captures a document (CPF or Passport) if one is missing, and confirms. On confirm, the entry transitions from PENDING to CHECKED_IN and is timestamped with who performed the check-in. Door-sale recording (the third method described in the MVP design) is its own feature and is out of scope here.

## User Stories
- As a Host, I want to scan a guest's QR code so that I can check them in quickly with a single action
- As a Host, I want to search by name when a guest can't show their QR code so that I can still find their entry
- As a Host, I want to see which list and which promoter a guest is on so that I can credit the right party
- As a Host, I want to capture a CPF or Passport at the door when the guest record has no document so that we comply with the venue's ID policy
- As a Host, I want to be told when someone has already been checked in so that I don't double-count them
- As a Host, I want clear feedback when an event is cancelled or when the network drops so that I know whether to retry or escalate
- As a Manager, I want check-ins limited to team members on my event so that random app users can't tamper with the door

## Business Rules
1. Three check-in methods: QR code scan, name search, door sale → `BR-CHK-001` (door sale handled in feature #6)
2. QR scan → guest info → document capture if missing → confirm → `BR-CHK-002`
3. Name search → matching entries across all lists → host selects → document if missing → confirm → `BR-CHK-003`
4. Adding a guest to a list: document is optional → `BR-GST-004`
5. At check-in: document is required. Host must capture it if missing. → `BR-GST-005`
6. Supported document types: CPF (Brazilian national ID), Passport (foreigners) → `BR-GST-006`
7. Only Hosts and Managers on the event's team can perform check-in → `BR-CHK-005` (new)
8. Check-in is allowed only on events with status ACTIVE or FINISHED; CANCELLED events reject check-in → `BR-CHK-006` (new). FINISHED is permitted to allow late-arrival corrections; the host UI surfaces a "Event finished" notice but still permits the action.
9. Re-checking a guest who is already CHECKED_IN is a no-op — the original `checkedInAt` and `checkedInBy` are preserved → `BR-CHK-007` (new)
10. On a successful check-in, the entry's status flips to CHECKED_IN and the system records `checkedInAt` (now) and `checkedInBy` (the acting host) → `BR-CHK-008` (new)
11. Name search returns every matching ListEntry across every list on the event; entries on different lists for the same person appear as separate rows with their list/promoter → `BR-CHK-009` (new), reinforces `BR-GST-003`
12. Reversing a check-in (un-check-in) is deferred to post-MVP → `BR-CHK-010` (new)
13. CPF must be 11 digits (numeric); Passport accepts any non-empty string → `BR-GST-016` (new)

## Acceptance Criteria

| ID    | Criterion |
|-------|-----------|
| AC-1  | Host scans a QR code for a PENDING entry on an ACTIVE event with a document on file → entry becomes CHECKED_IN with timestamp and the acting host recorded |
| AC-2  | Host scans a QR code for a PENDING entry whose guest has no document on file → host enters CPF or Passport → confirm → entry becomes CHECKED_IN and the captured document is saved on the guest |
| AC-3  | Host searches by name and sees every matching ListEntry across every list on the event, each row showing guest name, list name, promoter name (for PROMOTER lists), and current status |
| AC-4  | Host selects a search result and confirms check-in (capturing a document first if missing) → that specific ListEntry becomes CHECKED_IN; other entries for the same person on other lists are unchanged |
| AC-5  | Host sees the guest's name, list name, promoter name (when PROMOTER list), and current status on the confirmation screen before confirming |
| AC-6  | Re-scanning or re-selecting an already CHECKED_IN entry shows "Already checked in at HH:MM" and does not change state |
| AC-7  | Check-in is rejected on a CANCELLED event with the error "This event has been cancelled. Check-in is not allowed." |
| AC-8  | Check-in is allowed on a FINISHED event with a non-blocking notice "This event has finished. Late check-in will still be recorded." shown on the confirmation screen |
| AC-9  | A user without a Host or Manager role on the event cannot perform check-in and sees "You are not on this event's team." |
| AC-10 | Invalid CPF (not 11 digits, contains letters) is rejected with "Please enter a valid CPF or passport number" and the host stays on the document-capture step |
| AC-11 | Empty document is rejected with "Please enter a valid CPF or passport number" |
| AC-12 | Network error during confirm leaves the host on the confirmation screen with "Something went wrong. Please try again." and no state change |
| AC-13 | Reversing a check-in (un-check-in) is not exposed in the UI in the MVP |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`check-in.feature`](check-in.feature) | AC-1..AC-13, all Error Handling rows, EDGE-1..EDGE-7 |

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| QR code is unrecognized / not on this event | `This QR code is not recognized for this event.` | Stay on the scanner; do not record anything |
| Check-in attempted on a CANCELLED event | `This event has been cancelled. Check-in is not allowed.` | Block the action; return host to scanner |
| User attempting check-in is not a Host or Manager on the event | `You are not on this event's team.` | Block all check-in actions; do not show the scanner |
| Document field empty on submit | `Please enter a valid CPF or passport number` | Stay on document capture; highlight field |
| CPF format invalid (not 11 digits, non-numeric, etc.) | `Please enter a valid CPF or passport number` | Stay on document capture; highlight field |
| Network error during confirm | `Something went wrong. Please try again.` | Stay on confirmation; no state change |
| Re-confirm on an already checked-in entry (race) | `Already checked in at HH:MM` (notice, not a hard error) | Show notice; close the confirmation; entry unchanged |

## Edge Cases

| ID     | Edge Case | Expected Behavior |
|--------|-----------|-------------------|
| EDGE-1 | Re-scan of an already CHECKED_IN entry | Show "Already checked in at HH:MM"; no state change; preserve original `checkedInAt` / `checkedInBy` |
| EDGE-2 | Scan of an entry on a CANCELLED event | Reject with the cancelled-event error; no state change |
| EDGE-3 | Scan of an entry on a FINISHED event | Allow check-in; show non-blocking notice "This event has finished. Late check-in will still be recorded." on the confirmation screen |
| EDGE-4 | Name search returns the same person on multiple lists (e.g. on Promoter A's list and Promoter B's list) | Show each ListEntry as a separate row labelled with its list / promoter; the row the host taps is the entry that gets credit |
| EDGE-5 | Host enters a CPF with letters or wrong length | Reject with the invalid-document error; stay on document capture |
| EDGE-6 | Host enters a passport that is a single character | Accept (passport has no strict format) |
| EDGE-7 | Network drops after the host taps Confirm | Stay on confirmation screen with retry-friendly error; no partial state recorded |

## Dependencies
- **Depends on:**
  - Auth (feature #1) — host must be signed in
  - Events CRUD (feature #2) — events with status ACTIVE / FINISHED / CANCELLED must exist
  - Team Management (feature #3) — Host / Manager role assignments on the event
  - Lists & Guests (feature #4) — ListEntry records, QR codes, guest documents
- **Depended on by:**
  - Door Sales Recording (feature #6) — third check-in method, separate flow
  - Analytics (feature #8) — check-in counts, per-list breakdown, promoter performance all read from the data this feature writes

## Out of Scope
- Door sale recording at the door (covered by feature #6 — Door Sales Recording)
- Reversing / undoing a check-in (un-check-in) — deferred to post-MVP; not exposed in the MVP UI
- Multi-event check-in mode (a host bouncing between events in one session)
- Offline mode / queue-and-sync for poor venue connectivity
- Capacity enforcement at check-in (no "venue full" gate)
- Time-window enforcement (no rejection based on event start/end time beyond the CANCELLED rule)
- Manual creation of an entry at check-in time for a walk-in not on any list — that is a door sale and is covered by feature #6
- Document validation against a CPF check-digit algorithm (we accept any 11-digit numeric string; full validation is post-MVP)
- Editing a guest's document after a successful check-in (the captured document is final for MVP)
