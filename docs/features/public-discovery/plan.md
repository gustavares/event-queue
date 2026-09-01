# Public Event Discovery — Implementation Plan

## Overview

Adds the public, unauthenticated half of the product on top of the existing Event aggregate:
city-scoped listings, lineups, editorial curation of third-party events, Manager publishing,
and newsletter capture.

**Approach:** extend `event` rather than introduce a parallel entity. A curated event is the
same aggregate with `source = 'CURATED'` and no team — which keeps one listing pipeline,
one slug space, and one place where visibility is decided. The alternative (a separate
`listing` table) would duplicate every read path and guarantee the two drift.

Three things drive the structure:

1. **The public surface fails closed.** `PublicEvent` is a distinct SDL type built from an
   explicit allowlist, resolved by its own service, in its own handler directory. A field
   added to `Event` later cannot leak, because nothing maps `Event` onto `PublicEvent`.
2. **Extraction is swappable and optional.** `EventExtractor` is an interface. The Anthropic
   implementation is selected only when `ANTHROPIC_API_KEY` is set; otherwise a
   `UnavailableExtractor` throws the spec's "couldn't read that page" error, which the UI
   already treats as "fall through to manual entry". Tests inject a fake.
3. **Nothing existing changes behaviour.** `visibility` defaults to `UNLISTED`, so the
   migration publishes nothing (BR-DISC-002).

## Data Model Changes

### New enums

```typescript
export const eventVisibilityEnum = pgEnum('event_visibility', ['PUBLIC', 'UNLISTED']);
export const eventSourceEnum = pgEnum('event_source', ['FIRST_PARTY', 'CURATED']);
```

### New tables

```typescript
export const city = pgTable('city', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    state: varchar('state', { length: 2 }).notNull(),          // UF
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const artist = pgTable('artist', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    // lowercased name; the uniqueness key for BR-ART-002 (case-insensitive reuse)
    nameKey: text('name_key').notNull().unique(),
    externalUrl: text('external_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventArtist = pgTable('event_artist', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    artistId: varchar('artist_id', { length: 24 }).references(() => artist.id).notNull(),
    position: integer('position').notNull(),                    // BR-ART-003 ordering
    isHeadliner: boolean('is_headliner').default(false).notNull(),
}, (table) => ({
    uniqueEventArtist: uniqueIndex('unique_event_artist_idx').on(table.eventId, table.artistId),
}));

export const genre = pgTable('genre', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
});

export const eventGenre = pgTable('event_genre', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    genreId: varchar('genre_id', { length: 24 }).references(() => genre.id).notNull(),
}, (table) => ({
    uniqueEventGenre: uniqueIndex('unique_event_genre_idx').on(table.eventId, table.genreId),
}));

export const subscriber = pgTable('subscriber', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull(),
    cityId: varchar('city_id', { length: 24 }).references(() => city.id).notNull(),
    unsubscribeToken: text('unsubscribe_token').notNull().unique().$defaultFn(() => createId()),
    consentedAt: timestamp('consented_at').defaultNow().notNull(),   // BR-SUB-005, LGPD
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueEmailCity: uniqueIndex('unique_email_city_idx').on(table.email, table.cityId),
}));
```

### Modified tables

```typescript
// venue — BR-DISC-015. Nullable: existing venues have no city, and EDGE-3 requires their
// events to be listed nowhere rather than guessed into one.
cityId: varchar('city_id', { length: 24 }).references(() => city.id),

// event
visibility: eventVisibilityEnum('visibility').default('UNLISTED').notNull(),  // BR-DISC-001/002
source: eventSourceEnum('source').default('FIRST_PARTY').notNull(),           // BR-DISC-006
slug: text('slug').unique(),                     // BR-DISC-008; null while UNLISTED
cityId: varchar('city_id', { length: 24 }).references(() => city.id),  // inline-location events
externalTicketUrl: text('external_ticket_url'),  // BR-DISC-007
curatorNote: text('curator_note'),               // BR-CUR-006
sourceUrl: text('source_url').unique(),          // BR-CUR-005/009 — unique gives duplicate detection
featuredFrom: timestamp('featured_from'),        // BR-CUR-007
featuredUntil: timestamp('featured_until'),

// user
isCurator: boolean('is_curator').default(false).notNull(),                    // BR-CUR-001
```

**`sourceUrl` unique is the duplicate check** (BR-CUR-009) — enforced by the database rather
than a read-then-write, which would race.

**Event city resolution** (BR-DISC-009): `event.cityId` when set, else `venue.cityId`. A helper
in the repository resolves it; an event where both are null is excluded from every listing.

## Files

### New Files — backend

| File | Responsibility |
|------|---------------|
| `src/repositories/city.repository.ts` + `.entity.ts` | City CRUD, lookup by slug |
| `src/repositories/artist.repository.ts` + `.entity.ts` | Artist find-or-create by `nameKey`, lineup reads |
| `src/repositories/genre.repository.ts` + `.entity.ts` | Genre list, attach/detach on event |
| `src/repositories/subscriber.repository.ts` + `.entity.ts` | Idempotent subscribe |
| `src/repositories/public-event.repository.ts` | **Read-only** listing queries. Every method hard-filters `visibility = 'PUBLIC'`, `deleted = false`, and a resolvable city |
| `src/domain/discovery/list-cities.service.ts` | Covered cities |
| `src/domain/discovery/get-public-events.service.ts` | Listing by city/date/genre, featured, single by slug, artist's events |
| `src/domain/discovery/publish-event.service.ts` | Manager publish / unpublish, slug allocation, AC-29/30 guards |
| `src/domain/discovery/subscribe.service.ts` | BR-SUB-001..005 |
| `src/domain/discovery/curate-event.service.ts` | Ingestion orchestration, confirm, curator-note and feature mutations |
| `src/domain/discovery/common/slug.ts` | `slugify(name, startDate)` + collision suffix |
| `src/domain/discovery/common/event-extractor.ts` | `EventExtractor` interface + `ExtractedEvent` type |
| `src/domain/discovery/common/anthropic-extractor.ts` | Anthropic implementation |
| `src/domain/discovery/common/unavailable-extractor.ts` | Throws the spec's "couldn't read that page" error |
| `src/graphql/handlers/public/*.handler.ts` | 5 unauthenticated handlers |
| `src/graphql/handlers/discovery/*.handler.ts` | 6 authenticated curator/manager handlers |
| `src/graphql/resolvers/public-event.resolver.ts` | `PublicEvent` field resolvers |
| `src/db/seed-discovery.ts` | Seeds 5 cities and a genre vocabulary |

### New Files — frontend

| File | Responsibility |
|------|---------------|
| `app/(public)/_layout.tsx` | Public route group — **no auth gate** |
| `app/(public)/index.tsx` | City picker / discovery home |
| `app/(public)/[city]/index.tsx` | Date-grouped listing with genre + date filters |
| `app/(public)/e/[slug].tsx` | Public event page |
| `app/(public)/artist/[id].tsx` | Artist page |
| `app/(app)/curate/index.tsx` | Curator: paste URL, review, confirm |
| `components/ui/date-group-header.tsx`, `lineup-list.tsx`, `genre-filter.tsx`, `subscribe-form.tsx`, `featured-card.tsx` | Discovery UI |
| `lib/graphql/operations/discovery.ts` | Public + curator operations |

### Modified Files

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Enums, 6 tables, 11 columns above |
| `src/graphql/schema/index.ts` | `PublicEvent`, `City`, `Artist`, `Genre`, `LineupEntry`; public queries; curator/publish mutations |
| `src/graphql/graphql.types.ts` | New services in the container |
| `src/index.ts` | Wire repositories, services, extractor selection |
| `src/graphql/resolvers/index.ts` | Register public queries, mutations, `PublicEvent` |
| `rn-app/app/_layout.tsx` | Register `(public)` in the Stack |
| `rn-app/hooks/useAuthGate.ts` | Must not redirect on `(public)` routes |
| `backend/.env.example` | `ANTHROPIC_API_KEY` (optional) |

## Implementation Steps

### Step 1: Test harness

**Files:** `backend/jest.config.js`, `backend/package.json`, `backend/src/test/db.ts`, `backend/src/test/factories.ts`

**Changes:**
- `ts-jest` preset, `testMatch: ['**/*.test.ts']`, `testEnvironment: 'node'`, `maxWorkers: 1` (shared DB)
- `test` and `test:watch` scripts
- `src/test/db.ts`: connects to `DATABASE_URL`, truncates all tables between tests
- `src/test/factories.ts`: `makeUser`, `makeCity`, `makeVenue`, `makeEvent`, `makePublicEvent`

**Verification:** `pnpm test` runs and reports 0 failures with one placeholder test.

### Step 2: Schema + migration

**Files:** `src/db/schema.ts`, `src/db/seed-discovery.ts`, generated migration

**Changes:** the data model above. Then `pnpm db:generate`, review the SQL, `pnpm db:migrate`.

**Verification:**
- `\dt` shows 11 tables
- Every pre-existing event has `visibility = 'UNLISTED'` (BR-DISC-002)
- 16/16 smoke checks still pass — nothing existing changed behaviour

### Step 3: Repositories + entities

**Files:** the five repositories above

**Changes:** class-based, `mapToEntity`, interface named-exported, class default-exported.
`PublicEventRepository` methods take a filter object and **always** apply
`visibility = 'PUBLIC' AND deleted = false AND (event.city_id IS NOT NULL OR venue.city_id IS NOT NULL)`.
`ArtistRepository.findOrCreate` upserts on `nameKey` (BR-ART-002).

**Verification:** unit tests for `findOrCreate` case-insensitivity and for the public filter.

### Step 4: Public read services + API — *the leak-critical step*

**Files:** `list-cities.service.ts`, `get-public-events.service.ts`, `handlers/public/*`,
`schema/index.ts`, `public-event.resolver.ts`

**Changes:**
- `PublicEvent` SDL type is an allowlist: `id, slug, name, description, curatorNote, startDate,
  endDate, status, venueName, venueAddress, city, genres, lineup, ticketUrl, priceRange`.
  It shares **no** resolver with `Event`
- Handlers in `handlers/public/` are the only ones without `requireAuth`
- Upcoming = `startDate > now()` (EDGE-1); grouping by start date (EDGE-2) is the client's job,
  ordering is the server's

**Verification:** a test that publishes an event with team, lists, and door-sale tiers, queries
it unauthenticated, and asserts the response body contains none of those ids (AC-12,
BR-DISC-005). This test is the point of the harness.

### Step 5: Publishing

**Files:** `publish-event.service.ts`, `handlers/discovery/publish-event.handler.ts`, `slug.ts`

**Changes:** Manager-only; rejects DRAFT (AC-30) and no-city (AC-29) with the spec's exact
copy via `ValidationError`. Slug allocated on first publish and **never released** (EDGE-9).

**Verification:** scenarios in `publishing.feature` as tests.

### Step 6: Extraction + curation

**Files:** `event-extractor.ts`, `anthropic-extractor.ts`, `unavailable-extractor.ts`,
`curate-event.service.ts`, `handlers/discovery/*`

**Changes:**

```typescript
export interface ExtractedEvent {
  name?: string; startDate?: Date; venueName?: string; venueAddress?: string;
  lineup?: { name: string; isHeadliner: boolean }[];
  priceFrom?: number; ticketUrl?: string;
  missingFields: string[];   // drives BR-CUR-008
}

export interface EventExtractor {
  extract(sourceUrl: string): Promise<ExtractedEvent>;
}
```

- The Anthropic prompt asks for **facts only** and explicitly forbids returning description
  prose or image URLs (BR-CUR-004). `description` is not on `ExtractedEvent` at all — it cannot
  be returned even if the model tries
- A past `startDate` is pushed into `missingFields` (EDGE-7)
- Extraction **never writes**. Confirmation is a separate mutation (BR-CUR-003)
- `ANTHROPIC_API_KEY` absent → `UnavailableExtractor`, which throws
  `ValidationError("We couldn't read that page. Enter the details manually.")`
- Duplicate `sourceUrl` → `ConflictError("That event is already listed.")` from the unique
  constraint violation

**Verification:** `curation.feature` scenarios with a fake extractor; duplicate and
missing-field paths asserted.

### Step 7: Newsletter capture

**Files:** `subscribe.service.ts`, `handlers/public/subscribe.handler.ts`

**Changes:** unauthenticated; `onConflictDoNothing` on `(email, cityId)` makes it idempotent
(BR-SUB-002); records `consentedAt`. No sending.

**Verification:** subscribing twice yields one row.

### Step 8: Public screens

**Files:** `app/(public)/**`, the new components, `useAuthGate`, `_layout.tsx`

**Changes:** `(public)` group with no auth gate; `useAuthGate` skips redirect there. Uses the
design tokens exclusively — no hardcoded colour, `Unbounded` for event names, `JetBrainsMono`
for prices.

**Verification:** browse a seeded city while signed out, open an event, subscribe. Bundle
builds; screenshot each screen.

### Step 9: Curator screen

**Files:** `app/(app)/curate/index.tsx`

**Changes:** authenticated, curator-gated. Paste URL → review extracted fields → correct →
confirm. Missing fields highlighted.

**Verification:** ingest a fixture URL end to end.

## Dependencies

- Auth, Events CRUD, Venues — shipped
- `docs/patterns.md` conventions — settled 2026-08-31
- `@anthropic-ai/sdk` (new backend dependency); `ANTHROPIC_API_KEY` optional in `backend/.env`
- Postgres running with migrations applied

## Out of scope (restated from the spec)

Hosting, image storage, background jobs, crawling, social publishing, email delivery, a real
curator role in the permission model, paid checkout, guest accounts, free-text search.
