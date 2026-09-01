# Public Event Discovery

## Overview

Event Queue's public face: a city-scoped, editorially curated listing of nightlife events that anyone can browse without an account. Crucially, it lists **every notable event in a city — including events Event Queue does not sell tickets for**. Those third-party events are researched and entered by an operator with Claude's help, and carry a link out to wherever tickets are actually sold.

This is the demand side of the platform. Every other feature in the backlog serves organizers; this one serves the people who go out. It exists because a management tool alone has no answer to "why you and not the eight other guest-list apps" — a public audience is what makes organizers need us, and what gives lower ticket fees any meaning.

The editorial layer is the product, not decoration. A listing anyone can scrape is a commodity; a curator's note on why a night matters is not.

## User Stories

- As someone looking for a night out, I want to browse events in my city by date and genre without creating an account, so I can decide where to go
- As someone looking for a night out, I want to see who is playing, so I can judge whether it's for me
- As someone looking for a night out, I want to reach the tickets even when Event Queue doesn't sell them, so the listing is actually useful
- As someone who liked what I read, I want to subscribe to my city's list, so I hear about next week
- As a curator, I want to paste a link to an event I found and have the details extracted for me, so listing a city's worth of events is tractable
- As a curator, I want to write why an event matters and feature it, so the listing has a point of view
- As a Manager, I want my event to appear publicly, so people who don't already follow me can find it
- As a Manager, I want my event to stay private unless I say otherwise, so nothing is exposed by accident

## Business Rules

Full definitions in `docs/business-rules.md`.

**Visibility and the public surface**
- BR-DISC-001 — Every event has a visibility of PUBLIC or UNLISTED; the default is UNLISTED
- BR-DISC-002 — Events that exist when this feature ships are UNLISTED; nothing is published retroactively
- BR-DISC-003 — Only PUBLIC events appear in public listings
- BR-DISC-004 — The public listing surface requires no authentication
- BR-DISC-005 — The public representation of an event exposes only: name, description, curator note, start and end time, venue name, address, city, genres, lineup, ticket destination, and price range. It never exposes team members, lists, guests, check-ins, door sale records, promoter attribution, or the creating user
- BR-DISC-006 — An event has a source of FIRST_PARTY (sold through Event Queue) or CURATED (listed only)
- BR-DISC-007 — A CURATED event must carry an external ticket URL; a FIRST_PARTY event must not
- BR-DISC-008 — Every public event has a unique, stable, URL-safe slug
- BR-DISC-013 — A DRAFT event can never be PUBLIC

**Cities and listings**
- BR-DISC-009 — An event is listed under exactly one city, taken from its venue; an event with an inline location must have a city assigned explicitly
- BR-DISC-010 — Public listings show upcoming events only; past events are excluded unless explicitly requested
- BR-DISC-011 — Public listings are ordered by start time ascending and grouped by date
- BR-DISC-012 — A CANCELLED event stays visible with a cancelled marker until its start time passes
- BR-DISC-014 — A city has a name, a state (UF), and a unique slug
- BR-DISC-015 — A venue belongs to exactly one city

**Artists and lineup**
- BR-ART-001 — An artist has a name and an optional external link; artists are global, not per-event
- BR-ART-002 — Artist names are unique case-insensitively; adding an existing name reuses the record
- BR-ART-003 — An event's lineup is an ordered list of artists
- BR-ART-004 — A lineup entry may be marked as headliner
- BR-ART-005 — Lineup is optional; an event with no lineup is valid

**Curation**
- BR-CUR-001 — Only an operator with the curator capability can create or edit CURATED events
- BR-CUR-002 — Curated ingestion takes a source URL, extracts structured facts, and presents them for human confirmation before saving
- BR-CUR-003 — Nothing is saved or published from extraction without explicit human confirmation
- BR-CUR-004 — Only factual fields are taken from a source: name, date and time, venue, address, lineup, price, ticket URL. Description prose and images are never copied
- BR-CUR-005 — Every curated event records the source URL it was derived from
- BR-CUR-006 — The curator note is original editorial copy written by Event Queue
- BR-CUR-007 — An event may be featured for a date window; featured events surface above the listing for their city
- BR-CUR-008 — If extraction cannot determine a required field, the event is saved as a draft for manual completion, never published with a guessed value
- BR-CUR-009 — A source URL that has already been ingested is reported as a duplicate instead of creating a second listing

**Newsletter capture**
- BR-SUB-001 — Anyone can subscribe to a city's list with an email address, without an account
- BR-SUB-002 — Email is unique per city; re-subscribing is idempotent
- BR-SUB-003 — A subscriber record stores email, city, consent timestamp, and an unsubscribe token
- BR-SUB-004 — No email is sent by this feature; capture only
- BR-SUB-005 — Subscription requires explicit opt-in and records when consent was given (LGPD)

## Acceptance Criteria

**Public browsing**
- AC-1 — A visitor with no account can open a city listing and see its upcoming public events
- AC-2 — Events are grouped by date and ordered by start time within each date
- AC-3 — A visitor can filter a city's listing by genre
- AC-4 — A visitor can filter a city's listing by date range
- AC-5 — A visitor can open a single public event by its slug
- AC-6 — The public event page shows name, description, curator note, date and time, venue, address, genres, lineup, and price range
- AC-7 — Past events do not appear in the default listing
- AC-8 — A cancelled event still appears, marked as cancelled, until its start time passes
- AC-9 — Featured events for the current date appear above the main listing for their city
- AC-10 — A visitor can see the list of available cities
- AC-11 — An UNLISTED event is not returned by any public query, by listing or by slug
- AC-12 — The public event response contains no team, list, guest, check-in, door sale, promoter, or creator data
- AC-13 — A FIRST_PARTY event's ticket action leads to Event Queue's own purchase flow
- AC-14 — A CURATED event's ticket action leads to its external ticket URL

**Lineup**
- AC-15 — A public event displays its lineup in the curator's chosen order
- AC-16 — A headliner is visually distinguished from the rest of the lineup
- AC-17 — An event with no lineup renders without a lineup section rather than an empty one
- AC-18 — A visitor can open an artist and see that artist's other upcoming public events

**Curation**
- AC-19 — A curator submits a source URL and receives extracted fields for review before anything is saved
- AC-20 — A curator can correct any extracted field before confirming
- AC-21 — Confirming saves a CURATED event carrying its source URL
- AC-22 — Submitting a source URL that was already ingested reports the existing event instead of creating a duplicate
- AC-23 — An extraction missing a required field produces a draft, not a published event
- AC-24 — A curator can write and edit a curator note on any public event
- AC-25 — A curator can feature an event for a date window
- AC-26 — A non-curator cannot create or edit CURATED events

**Publishing**
- AC-27 — A Manager can publish their own ACTIVE event to the public listing
- AC-28 — A Manager can unpublish their event, removing it from public listings
- AC-29 — Publishing requires the event to have a city
- AC-30 — A DRAFT event cannot be published
- AC-31 — Every event that existed before this feature remains UNLISTED

**Newsletter**
- AC-32 — A visitor can submit an email to subscribe to a city's list without an account
- AC-33 — Submitting an email already subscribed to that city succeeds without creating a duplicate
- AC-34 — Subscription is recorded with the city and a consent timestamp

## Scenario Coverage

- `discovery.feature` — AC-1..AC-18, AC-32..AC-34, Error rows 1–4, EDGE-1..EDGE-5 (public browsing, lineup, newsletter capture)
- `curation.feature` — AC-19..AC-26, Error rows 5–8, EDGE-6..EDGE-8 (URL ingestion, editorial, featuring)
- `publishing.feature` — AC-27..AC-31, Error rows 9–10, EDGE-9..EDGE-10 (Manager publish / unpublish)

## Error Handling

| Scenario | Error Message | Behavior |
|----------|--------------|----------|
| City slug not found | "We don't cover that city yet." | Show the list of cities we do cover |
| Event slug not found or unlisted | "This event isn't available." | Redirect to the city listing |
| No events match the filters | "Nothing on for those dates." | Keep filters visible so they can be widened |
| Invalid email on subscribe | "Enter a valid email address." | Inline on the field, form stays filled |
| Source URL unreachable | "We couldn't read that page. Enter the details manually." | Fall through to the blank manual form |
| Source URL already ingested | "That event is already listed." | Link to the existing listing |
| Extraction missing required fields | "We couldn't read everything — fill in the highlighted fields." | Highlight the missing fields, save as draft |
| Non-curator attempts curation | "You don't have access to that." | No state change |
| Publishing an event with no city | "Add a city before publishing." | Event stays unlisted |
| Publishing a draft event | "Publish the event to your team before listing it publicly." | Event stays unlisted |

## Edge Cases

- EDGE-1 — An event starting today but already past its start time is excluded from the upcoming listing
- EDGE-2 — An event spanning midnight is listed under its **start** date, not its end date
- EDGE-3 — A venue with no city assigned excludes its events from all public listings rather than listing them under a guess
- EDGE-4 — A city with no upcoming events shows the empty message, not an error
- EDGE-5 — A genre filter matching no events in that city shows the empty message and keeps the filter visible
- EDGE-6 — A source URL that resolves to a page with several events extracts only the one the curator confirms
- EDGE-7 — Extraction returning a start date in the past is treated as a missing field and requires manual correction
- EDGE-8 — Featuring an event whose feature window has already passed has no effect on the listing
- EDGE-9 — Unpublishing an event removes it from listings immediately but keeps its slug reserved, so an old link resolves to "This event isn't available." rather than a different event
- EDGE-10 — Cancelling a published event keeps it listed with a cancelled marker (BR-DISC-012) rather than silently unpublishing it

## Dependencies

**Depends on**
- Auth — curator capability and Manager publishing are authenticated actions
- Events CRUD — the Event aggregate this extends with visibility, source, slug, city, and lineup
- Venues — cities attach to venues

**Depended on by**
- Ticketing (post-MVP) — a public event page is where a purchase starts
- Social media publishing (future) — draws from curated content and featured picks
- Newsletter sending (future) — draws from the subscriber list this captures

## Out of Scope

- **Infrastructure and deployment** — hosting, CDN, image storage, background jobs
- **Autonomous scraping** — no crawler, no scheduled ingestion. Ingestion is one URL at a time, operator-initiated, human-confirmed
- **Social media publishing** — no posting, scheduling, or cross-posting
- **Sending email** — subscribers are captured only; no delivery, templates, or campaigns
- **A dedicated curator role in the permission model** — v1 gates curation behind a single operator capability flag; a full role arrives with Team Management
- **Ticket purchase** — FIRST_PARTY ticket actions route to the existing flow; paid checkout is post-MVP
- **Guest accounts** — no favouriting, following, or attendance history
- **Search by free text** — v1 filters by city, date, and genre only
- **Editorial articles** — the curator note is a per-event field, not a CMS
