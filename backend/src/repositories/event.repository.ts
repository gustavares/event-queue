import {
    CreateEventDbInput,
    UpdateEventDbInput,
    EventEntity,
    EventSchema,
    PublishEventDbInput,
    CurationDbInput,
} from "./event.entity";
import { event } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Database } from "../db";

export interface EventRepository {
    create(input: CreateEventDbInput): Promise<EventEntity>;
    findById(id: string): Promise<EventEntity | null>;
    findByCreator(userId: string): Promise<EventEntity[]>;
    update(id: string, input: UpdateEventDbInput): Promise<EventEntity>;
    softDelete(id: string): Promise<void>;
    findBySlug(slug: string): Promise<EventEntity | null>;
    slugExists(slug: string): Promise<boolean>;
    setPublication(id: string, input: PublishEventDbInput): Promise<EventEntity>;
    setCuration(id: string, input: CurationDbInput): Promise<EventEntity>;
    findBySourceUrl(sourceUrl: string): Promise<EventEntity | null>;
    setCuratedSource(input: {
        id: string;
        sourceUrl: string;
        externalTicketUrl: string;
        curatorNote: string | null;
    }): Promise<EventEntity>;
}

function mapToEventEntity(row: EventSchema): EventEntity {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.startDate,
        endDate: row.endDate,
        status: row.status,
        venueId: row.venueId,
        locationName: row.locationName,
        locationAddress: row.locationAddress,
        doorSalesEnabled: row.doorSalesEnabled,
        visibility: row.visibility,
        source: row.source,
        slug: row.slug,
        cityId: row.cityId,
        externalTicketUrl: row.externalTicketUrl,
        curatorNote: row.curatorNote,
        sourceUrl: row.sourceUrl,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
        createdBy: row.createdBy,
        deleted: row.deleted,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
    };
}

export default class DrizzlePostgresEventRepository implements EventRepository {
    constructor(private db: Database) {}

    async create(input: CreateEventDbInput): Promise<EventEntity> {
        const result: EventSchema[] = await this.db
            .insert(event)
            .values({
                name: input.name,
                description: input.description,
                startDate: input.startDate,
                endDate: input.endDate,
                venueId: input.venueId,
                locationName: input.locationName,
                locationAddress: input.locationAddress,
                doorSalesEnabled: input.doorSalesEnabled ?? false,
                createdBy: input.createdBy,
            })
            .returning();

        return mapToEventEntity(result[0]);
    }

    async findById(id: string): Promise<EventEntity | null> {
        const result: EventSchema[] = await this.db
            .select()
            .from(event)
            .where(and(eq(event.id, id), eq(event.deleted, false)))
            .limit(1);

        return result.length > 0 ? mapToEventEntity(result[0]) : null;
    }

    async findByCreator(userId: string): Promise<EventEntity[]> {
        const result: EventSchema[] = await this.db
            .select()
            .from(event)
            .where(and(eq(event.createdBy, userId), eq(event.deleted, false)));

        return result.map(mapToEventEntity);
    }

    async update(id: string, input: UpdateEventDbInput): Promise<EventEntity> {
        const result: EventSchema[] = await this.db
            .update(event)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(event.id, id))
            .returning();

        return mapToEventEntity(result[0]);
    }

    async softDelete(id: string): Promise<void> {
        await this.db
            .update(event)
            .set({
                deleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(event.id, id));
    }

    /**
     * Looks up by slug **without** a visibility filter.
     *
     * This is the authenticated path — used to check slug availability and to load an
     * event the Manager owns. Public reads go through PublicEventRepository, which
     * applies the visibility guard. Do not use this to serve public traffic.
     */
    async findBySlug(slug: string): Promise<EventEntity | null> {
        const result: EventSchema[] = await this.db
            .select()
            .from(event)
            .where(and(eq(event.slug, slug), eq(event.deleted, false)))
            .limit(1);

        return result.length > 0 ? mapToEventEntity(result[0]) : null;
    }

    /** Includes soft-deleted rows: a slug stays reserved forever (BR-DISC-008, EDGE-9). */
    async slugExists(slug: string): Promise<boolean> {
        const result = await this.db
            .select({ id: event.id })
            .from(event)
            .where(eq(event.slug, slug))
            .limit(1);

        return result.length > 0;
    }

    async setPublication(id: string, input: PublishEventDbInput): Promise<EventEntity> {
        const result: EventSchema[] = await this.db
            .update(event)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(event.id, id))
            .returning();

        return mapToEventEntity(result[0]);
    }

    /** BR-CUR-009. The unique constraint is the real guard; this gives a friendlier path. */
    async findBySourceUrl(sourceUrl: string): Promise<EventEntity | null> {
        const result: EventSchema[] = await this.db
            .select()
            .from(event)
            .where(eq(event.sourceUrl, sourceUrl))
            .limit(1);

        return result.length > 0 ? mapToEventEntity(result[0]) : null;
    }

    /** Marks an event as CURATED and records where it came from and where tickets are sold. */
    async setCuratedSource(input: {
        id: string;
        sourceUrl: string;
        externalTicketUrl: string;
        curatorNote: string | null;
    }): Promise<EventEntity> {
        const result: EventSchema[] = await this.db
            .update(event)
            .set({
                source: "CURATED",
                sourceUrl: input.sourceUrl,
                externalTicketUrl: input.externalTicketUrl,
                curatorNote: input.curatorNote,
                // A curated event has no team running it, so it is ACTIVE on listing
                // rather than moving through the DRAFT lifecycle.
                status: "ACTIVE",
                updatedAt: new Date(),
            })
            .where(eq(event.id, input.id))
            .returning();

        return mapToEventEntity(result[0]);
    }

    async setCuration(id: string, input: CurationDbInput): Promise<EventEntity> {
        const result: EventSchema[] = await this.db
            .update(event)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(event.id, id))
            .returning();

        return mapToEventEntity(result[0]);
    }
}
