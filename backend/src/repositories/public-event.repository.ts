import { PublicEventEntity, PublicEventFilter } from "./public-event.entity";
import { EventStatus } from "./event.entity";
import { event, venue, city, eventGenre, genre, eventArtist, doorSaleTier } from "../db/schema";
import { and, eq, gt, lt, lte, gte, inArray, asc, isNotNull, sql, SQL } from "drizzle-orm";
import { Database } from "../db";

export interface PublicEventRepository {
    findMany(filter: PublicEventFilter): Promise<PublicEventEntity[]>;
    findBySlug(slug: string): Promise<PublicEventEntity | null>;
}

/**
 * Read-only access to publicly listed events.
 *
 * **Every** query here applies the same non-negotiable predicate. It is built in one
 * private method rather than repeated per query, so a new read path cannot forget it:
 *
 *   - visibility = 'PUBLIC'        (BR-DISC-003)
 *   - deleted = false             (soft-delete policy)
 *   - slug IS NOT NULL            (unpublished events keep their row)
 *   - a resolvable city           (BR-DISC-009 / EDGE-3)
 *
 * The city comes from `event.city_id` when set, otherwise `venue.city_id`. An event with
 * neither is listed nowhere rather than guessed into a city.
 */
export default class DrizzlePostgresPublicEventRepository implements PublicEventRepository {
    constructor(private db: Database) {}

    /** The predicate every public read must satisfy. */
    private publicOnly(): SQL {
        return and(
            eq(event.visibility, "PUBLIC"),
            eq(event.deleted, false),
            isNotNull(event.slug),
            isNotNull(city.id)
        )!;
    }

    private baseQuery() {
        return this.db
            .select({
                id: event.id,
                slug: event.slug,
                name: event.name,
                description: event.description,
                curatorNote: event.curatorNote,
                startDate: event.startDate,
                endDate: event.endDate,
                status: event.status,
                source: event.source,
                venueName: sql<string | null>`COALESCE(${venue.name}, ${event.locationName})`,
                venueAddress: sql<string | null>`COALESCE(${venue.address}, ${event.locationAddress})`,
                cityId: city.id,
                cityName: city.name,
                cityState: city.state,
                citySlug: city.slug,
                priceFrom: sql<number | null>`COALESCE(${event.priceFrom}, (SELECT MIN(${doorSaleTier.price}) FROM ${doorSaleTier} WHERE ${doorSaleTier.eventId} = ${event.id}))`,
                externalTicketUrl: event.externalTicketUrl,
            })
            .from(event)
            .leftJoin(venue, eq(event.venueId, venue.id))
            // COALESCE, not OR. `event.city_id = city.id OR venue.city_id = city.id` matches
            // TWO city rows when the two disagree — duplicating the event in every listing and
            // making PublicEvent.city non-deterministic under LIMIT 1. Coalescing expresses the
            // documented rule exactly: the event's own city wins, the venue's is the fallback.
            .leftJoin(
                city,
                eq(city.id, sql`COALESCE(${event.cityId}, ${venue.cityId})`)
            );
    }

    private toEntity(row: Record<string, unknown>): PublicEventEntity {
        return {
            id: row.id as string,
            slug: row.slug as string,
            name: row.name as string,
            description: (row.description as string | null) ?? null,
            curatorNote: (row.curatorNote as string | null) ?? null,
            startDate: row.startDate as Date,
            endDate: row.endDate as Date,
            status: row.status as EventStatus,
            source: row.source as PublicEventEntity["source"],
            venueName: (row.venueName as string | null) ?? null,
            venueAddress: (row.venueAddress as string | null) ?? null,
            cityId: row.cityId as string,
            cityName: row.cityName as string,
            cityState: row.cityState as string,
            citySlug: row.citySlug as string,
            priceFrom: row.priceFrom === null || row.priceFrom === undefined ? null : Number(row.priceFrom),
            externalTicketUrl: (row.externalTicketUrl as string | null) ?? null,
        };
    }

    async findMany(filter: PublicEventFilter): Promise<PublicEventEntity[]> {
        const conditions: SQL[] = [this.publicOnly()];

        // BR-DISC-010 / EDGE-1 — an event whose start time has passed is no longer upcoming.
        conditions.push(gt(event.startDate, filter.startsAfter ?? new Date()));

        if (filter.startsBefore) conditions.push(lt(event.startDate, filter.startsBefore));
        if (filter.citySlug) conditions.push(eq(city.slug, filter.citySlug));

        if (filter.genreSlugs && filter.genreSlugs.length > 0) {
            const matching = this.db
                .select({ eventId: eventGenre.eventId })
                .from(eventGenre)
                .innerJoin(genre, eq(eventGenre.genreId, genre.id))
                .where(inArray(genre.slug, filter.genreSlugs));
            conditions.push(inArray(event.id, matching));
        }

        if (filter.artistId) {
            const matching = this.db
                .select({ eventId: eventArtist.eventId })
                .from(eventArtist)
                .where(eq(eventArtist.artistId, filter.artistId));
            conditions.push(inArray(event.id, matching));
        }

        if (filter.featuredOnly) {
            // BR-CUR-007 / EDGE-8 — the window must currently cover now.
            const now = new Date();
            conditions.push(isNotNull(event.featuredFrom));
            conditions.push(lte(event.featuredFrom, now));
            conditions.push(gte(event.featuredUntil, now));
        }

        // BR-DISC-011 — ordered by start time ascending. Grouping by date is the client's job.
        const rows = await this.baseQuery()
            .where(and(...conditions))
            .orderBy(asc(event.startDate));

        return rows.map((r) => this.toEntity(r as Record<string, unknown>));
    }

    async findBySlug(slug: string): Promise<PublicEventEntity | null> {
        const rows = await this.baseQuery()
            .where(and(this.publicOnly(), eq(event.slug, slug)))
            .limit(1);

        return rows.length > 0 ? this.toEntity(rows[0] as Record<string, unknown>) : null;
    }
}
