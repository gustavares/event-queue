import { EventStatus } from './event.entity';

export type EventVisibility = 'PUBLIC' | 'UNLISTED';
export type EventSource = 'FIRST_PARTY' | 'CURATED';

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
    /** BR-DISC-007 — set for CURATED events only. */
    externalTicketUrl: string | null;
    featuredFrom: Date | null;
    featuredUntil: Date | null;
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
