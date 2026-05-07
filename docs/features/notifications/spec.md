# Notifications

## Overview
When a guest is added to a list (any list type — OFFICIAL, PROMOTER, DOOR_SALES) and that guest has at least one contact channel populated, Event Queue dispatches a best-effort notification with the guest's QR code and event details. Three channels are supported: WhatsApp, SMS (as a fallback to WhatsApp), and Email. Dispatch is asynchronous and best-effort — if it fails, the guest is still added to the list and the failure is logged for the manager to review later. Provider selection (Twilio, Sendgrid, WhatsApp Cloud API, etc.) is post-MVP; this feature defines the abstract notification interface and channel-selection rules only.

## User Stories
- As a guest, I want to receive my QR code on WhatsApp (or SMS / Email) when I'm added to a list, so that I can present it at the door without checking the app
- As a manager, I want notifications to be best-effort so that a notification provider outage never blocks me from adding guests to a list
- As a manager, I want delivery failures to be logged so that I can identify guests who never received their QR code and take corrective action
- As a promoter, I want guests added to my list to be notified automatically so that I do not have to manually forward their QR code

## Business Rules
1. When a guest is added to a list and has at least one contact channel populated, a notification is dispatched with their QR code → `BR-NTF-001`
2. Three channels are supported: WhatsApp (most common in Brazil), SMS, Email → `BR-NTF-002`
3. Channel selection is by contact-info presence: WhatsApp is attempted if phone is present; SMS is attempted only as fallback when WhatsApp delivery fails; Email is dispatched in addition (independently) if email is present → `BR-NTF-003`
4. Notification dispatch is best-effort and asynchronous — a guest is added to the list regardless of dispatch outcome → `BR-NTF-004`
5. Notification failures are logged (per-channel) for the event's manager to review later → `BR-NTF-005`
6. Notification content includes: guest name, event name, event date/time, venue/location, and the list entry's QR code → `BR-NTF-006`
7. Notifications are dispatched only to Guests, never to Hosts or Managers themselves (system users get their lists in the app) → `BR-NTF-007`
8. Notification language is PT-BR (Brazilian Portuguese) — multi-language is post-MVP → `BR-NTF-008`
9. The trigger is "list entry created with guest having contact info" — same dispatch logic regardless of who creates the entry (Manager, Promoter, system on door-sale, etc.) → `BR-NTF-009`
10. Notification dispatch implementation is provider-agnostic — the system depends on an abstract notification interface, not a specific provider → `BR-NTF-010`

**Cross-feature dependencies:**
- `BR-LST-001..004` — list types (OFFICIAL / PROMOTER / DOOR_SALES) all trigger the same notification flow
- `BR-GST-001` — Guest = person (name + optional contact info), not an app user
- `BR-GST-002` — ListEntry has its own QR code; the QR code is what gets sent
- `BR-DSR-001..003` — door sales create a list entry that, if a guest contact is captured, also triggers the same notification flow

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | When a guest with phone only is added to a list, a WhatsApp notification with their QR code is dispatched (no SMS, no Email) |
| AC-2 | When a guest with email only is added to a list, an Email notification with their QR code is dispatched (no WhatsApp, no SMS) |
| AC-3 | When a guest with both phone and email is added to a list, a WhatsApp notification AND an Email notification are dispatched |
| AC-4 | When a guest with no contact info is added to a list, no notification is dispatched and no error is shown to the user adding the guest |
| AC-5 | When WhatsApp dispatch fails for a guest, an SMS notification is dispatched as fallback to the same phone number |
| AC-6 | When SMS fallback succeeds after WhatsApp failure, the WhatsApp failure is still logged for the manager |
| AC-7 | When all attempted channels fail, the guest is still added to the list, no error is shown to the user adding the guest, and each failure is logged |
| AC-8 | When a guest is added to an OFFICIAL list (Manager-created), the same dispatch logic applies |
| AC-9 | When a guest is added to a PROMOTER list (Promoter-created), the same dispatch logic applies |
| AC-10 | When a guest entry is created from a DOOR_SALES recording (with contact info captured), the same dispatch logic applies |
| AC-11 | A dispatched notification's content includes guest name, event name, event date/time, venue/location, and the QR code (image or scannable link) |
| AC-12 | Notifications are sent in PT-BR (Brazilian Portuguese) |
| AC-13 | Notifications are never dispatched to Hosts or Managers themselves (only to Guests) |

## Scenario Coverage

| `.feature` file | Covers |
|-----------------|--------|
| [`notifications.feature`](notifications.feature) | AC-1..AC-13, all Error Handling rows, EDGE-1..EDGE-7 |

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| WhatsApp dispatch fails, SMS fallback succeeds | _(none — silent to the user adding the guest)_ | Guest is added; WhatsApp failure is logged; SMS success is logged |
| WhatsApp dispatch fails, SMS fallback also fails | _(none — silent to the user adding the guest)_ | Guest is added; both failures are logged |
| Email dispatch fails | _(none — silent to the user adding the guest)_ | Guest is added; Email failure is logged |
| All channels fail | _(none — silent to the user adding the guest)_ | Guest is added; every failure is logged |
| Notification interface itself unavailable (e.g., infra outage) | _(none — silent to the user adding the guest)_ | Guest is added; failure is logged |

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EDGE-1 | Guest has no contact info (no phone, no email) | No notification dispatched; no error to the user adding the guest; no failure logged (nothing was attempted) |
| EDGE-2 | Guest has phone only | WhatsApp attempted; if it fails, SMS attempted as fallback; no Email |
| EDGE-3 | Guest has email only | Email attempted; no WhatsApp, no SMS |
| EDGE-4 | Guest has both phone and email | WhatsApp attempted (with SMS fallback on failure) AND Email attempted independently |
| EDGE-5 | Same person ("João Silva") on two different lists | Two separate list entries, two separate QR codes, two separate notification dispatches (one per entry) |
| EDGE-6 | Guest re-added to the same list after being removed | Treated as a new list entry — new QR code, new notification dispatch |
| EDGE-7 | Door-sale entry created with guest contact info | Same dispatch logic applies; notification sent to the captured phone/email |

## Dependencies
- **Depends on:**
  - **Lists & Guests** — list-entry creation is the trigger; without ListEntry there is nothing to notify on. The QR code on the ListEntry is the notification payload's core content.
  - **Events CRUD** — notification content includes event name, date/time, and location, all of which come from the Event entity.
  - **Door Sales (recording)** — door-sale entries are one of the trigger sources when guest contact info is captured.
- **Depended on by:** None in MVP. Post-MVP "resend QR" (manager-driven re-dispatch) and "notification analytics" features will depend on the abstract notification interface this feature defines.

## Out of Scope
- **Provider selection / configuration** (Twilio, Sendgrid, WhatsApp Cloud API, etc.) — post-MVP; the abstract interface is defined here, but no concrete provider is wired in
- **Retry / backoff logic beyond best-effort** — only the WhatsApp → SMS fallback chain is in MVP; no exponential backoff, no scheduled retries
- **Opt-out / unsubscribe flows** — deferred to post-MVP. Compliance implication: until this lands, all guests with contact info will receive notifications with no opt-out path; legal review required before public launch
- **Manager-driven re-send of a notification** ("resend QR" button) — post-MVP
- **Notification templates / multi-language** — PT-BR is the only supported language in MVP; English and other locales are post-MVP
- **Notification on check-in** ("you've been checked in") — post-MVP
- **Notification on event cancellation** — post-MVP
- **Notification analytics** (delivery rates, channel performance) — post-MVP
- **Per-event or per-list notification toggles** (manager opt-out for a specific list) — post-MVP
- **Rich content** (event image, map link, calendar attachment) beyond the core fields and QR code — post-MVP
