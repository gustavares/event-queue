import { EventStatus, EventSource } from './event.entity';

// EventVisibility and EventSource live in event.entity.ts. Re-declaring them here created a
// second, structurally identical type that nothing imported — two sources of truth for the
// same enum, free to drift.
export type { EventSource } from './event.entity';

/**
 * The public projection of an event.
 *
 * BR-DISC-005 defines this as an **allowlist**. It is deliberately a hand-written type
 * rather than a subset of `EventEntity`, so a field added to the event aggregate later
 * cannot appear here by default. Nothing maps `EventEntity` onto this type.
 *
 * Notably absent, and to stay absent: createdBy, team, lists, guests, check-ins,
 * door sale records, promoter attribution, deleted/deletedAt, sourceUrl.
 */
export interface PublicEventEntity {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    curatorNote: string | null;
    startDate: Date;
    endDate: Date;
    status: EventStatus;
    source: EventSource;
    /** Venue name, or the inline location name when there is no venue. */
    venueName: string | null;
    venueAddress: string | null;
    cityId: string;
    cityName: string;
    cityState: string;
    citySlug: string;
    /** AC-6. Lowest advertised entry price in BRL, or null when none is published. */
    priceFrom: number | null;
    /** BR-DISC-007 — set for CURATED events only. */
    externalTicketUrl: string | null;
}

export interface PublicEventFilter {
    citySlug?: string;
    genreSlugs?: string[];
    /** Defaults to now — BR-DISC-010, only upcoming events are listed. */
    startsAfter?: Date;
    startsBefore?: Date;
    artistId?: string;
    /** BR-CUR-007 — only events whose feature window covers `now`. */
    featuredOnly?: boolean;
}
