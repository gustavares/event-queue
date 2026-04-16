import { CreateEventDbInput, UpdateEventDbInput, EventEntity, EventSchema } from "./event.entity";
import { event } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Database } from "../db";

export interface EventRepository {
    create(input: CreateEventDbInput): Promise<EventEntity>;
    findById(id: string): Promise<EventEntity | null>;
    findByCreator(userId: string): Promise<EventEntity[]>;
    update(id: string, input: UpdateEventDbInput): Promise<EventEntity>;
    softDelete(id: string): Promise<void>;
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
}
