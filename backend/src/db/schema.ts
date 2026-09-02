import { pgTable, text, timestamp, boolean, integer, real, pgEnum, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const userRoleEnum = pgEnum('user_role', ['MANAGER', 'PROMOTER', 'HOST']);
export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED']);
export const checkInStatusEnum = pgEnum('check_in_status', ['PENDING', 'COMPLETED']);
export const eventVisibilityEnum = pgEnum('event_visibility', ['PUBLIC', 'UNLISTED']);
export const eventSourceEnum = pgEnum('event_source', ['FIRST_PARTY', 'CURATED']);

// Tables
export const user = pgTable('user', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    // BR-CUR-001. A capability flag, not a role — a real curator role arrives with Team Management.
    isCurator: boolean('is_curator').default(false).notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

// BR-DISC-014. The backbone of discovery — everything public is browsed by city.
export const city = pgTable('city', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const venue = pgTable('venue', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    address: text('address').notNull(),
    capacity: integer('capacity'),
    // BR-DISC-015. Nullable: venues created before discovery have no city, and EDGE-3
    // requires their events to be listed nowhere rather than guessed into a city.
    cityId: varchar('city_id', { length: 24 }).references(() => city.id),
    createdBy: varchar('created_by', { length: 24 }).references(() => user.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// BR-ART-001. Artists are global, not per-event.
export const artist = pgTable('artist', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    // BR-ART-002. Lowercased name — the uniqueness key that makes reuse case-insensitive.
    nameKey: text('name_key').notNull().unique(),
    externalUrl: text('external_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const genre = pgTable('genre', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
});

export const event = pgTable('event', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: eventStatusEnum('status').default('DRAFT').notNull(),
    venueId: varchar('venue_id', { length: 24 }).references(() => venue.id),
    locationName: text('location_name'),
    locationAddress: text('location_address'),
    doorSalesEnabled: boolean('door_sales_enabled').default(false).notNull(),

    // ── Public discovery ──────────────────────────────────────────────
    // BR-DISC-001/002. Defaults to UNLISTED, so the migration publishes nothing and every
    // event that predates discovery stays private.
    visibility: eventVisibilityEnum('visibility').default('UNLISTED').notNull(),
    // BR-DISC-006. CURATED events are listed but sold elsewhere.
    source: eventSourceEnum('source').default('FIRST_PARTY').notNull(),
    // BR-DISC-008. Allocated on first publish and never released, so an old shared link
    // can never resolve to a different event (EDGE-9).
    slug: text('slug').unique(),
    // BR-DISC-009. Set only for events with an inline location; otherwise the city comes
    // from the venue. An event with neither is listed nowhere.
    cityId: varchar('city_id', { length: 24 }).references(() => city.id),
    // BR-DISC-007. Required for CURATED, forbidden for FIRST_PARTY.
    externalTicketUrl: text('external_ticket_url'),
    // BR-CUR-006. Our editorial copy, never the source's.
    curatorNote: text('curator_note'),
    // BR-CUR-005/009. Unique gives duplicate detection at the database rather than a
    // read-then-write that would race.
    sourceUrl: text('source_url').unique(),
    // AC-6. Lowest advertised entry price in BRL. Set for CURATED events, which have no
    // door-sale tiers to derive it from; first-party events fall back to MIN(tier.price).
    priceFrom: real('price_from'),
    // BR-CUR-007.
    featuredFrom: timestamp('featured_from'),
    featuredUntil: timestamp('featured_until'),

    createdBy: varchar('created_by', { length: 24 }).references(() => user.id).notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
});

export const eventTeamMember = pgTable('event_team_member', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    userId: varchar('user_id', { length: 24 }).references(() => user.id).notNull(),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueUserEvent: uniqueIndex('unique_user_event_idx').on(table.eventId, table.userId),
}));

export const doorSaleTier = pgTable('door_sale_tier', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    name: text('name').notNull(),
    price: real('price').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// BR-ART-003/004. The lineup is an ordered list; position carries the curator's order.
export const eventArtist = pgTable('event_artist', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    artistId: varchar('artist_id', { length: 24 }).references(() => artist.id).notNull(),
    position: integer('position').notNull(),
    isHeadliner: boolean('is_headliner').default(false).notNull(),
}, (table) => ({
    uniqueEventArtist: uniqueIndex('unique_event_artist_idx').on(table.eventId, table.artistId),
}));

export const eventGenre = pgTable('event_genre', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    genreId: varchar('genre_id', { length: 24 }).references(() => genre.id).notNull(),
}, (table) => ({
    uniqueEventGenre: uniqueIndex('unique_event_genre_idx').on(table.eventId, table.genreId),
}));

// BR-SUB-001..005. Capture only — nothing sends from this table yet.
export const subscriber = pgTable('subscriber', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull(),
    cityId: varchar('city_id', { length: 24 }).references(() => city.id).notNull(),
    unsubscribeToken: text('unsubscribe_token').notNull().unique().$defaultFn(() => createId()),
    // BR-SUB-005. LGPD requires recording when consent was given, not just that it was.
    consentedAt: timestamp('consented_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    // BR-SUB-002. Makes re-subscribing idempotent at the database.
    uniqueEmailCity: uniqueIndex('unique_email_city_idx').on(table.email, table.cityId),
}));
