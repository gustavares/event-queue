import { CreateTierDbInput, UpdateTierDbInput, DoorSaleTierEntity, DoorSaleTierSchema } from "./door-sale-tier.entity";
import { doorSaleTier } from "../db/schema";
import { eq } from "drizzle-orm";
import { Database } from "../db";

export interface DoorSaleTierRepository {
    create(input: CreateTierDbInput): Promise<DoorSaleTierEntity>;
    findById(id: string): Promise<DoorSaleTierEntity | null>;
    findByEventId(eventId: string): Promise<DoorSaleTierEntity[]>;
    update(id: string, input: UpdateTierDbInput): Promise<DoorSaleTierEntity>;
    delete(id: string): Promise<void>;
}

function mapToEntity(row: DoorSaleTierSchema): DoorSaleTierEntity {
    return {
        id: row.id,
        eventId: row.eventId,
        name: row.name,
        price: row.price,
        createdAt: row.createdAt,
    };
}

export default class DrizzlePostgresDoorSaleTierRepository implements DoorSaleTierRepository {
    constructor(private db: Database) {}

    async create(input: CreateTierDbInput): Promise<DoorSaleTierEntity> {
        const result: DoorSaleTierSchema[] = await this.db
            .insert(doorSaleTier)
            .values({
                eventId: input.eventId,
                name: input.name,
                price: input.price,
            })
            .returning();

        return mapToEntity(result[0]);
    }

    async findById(id: string): Promise<DoorSaleTierEntity | null> {
        const result: DoorSaleTierSchema[] = await this.db
            .select()
            .from(doorSaleTier)
            .where(eq(doorSaleTier.id, id))
            .limit(1);

        return result.length > 0 ? mapToEntity(result[0]) : null;
    }

    async findByEventId(eventId: string): Promise<DoorSaleTierEntity[]> {
        const result: DoorSaleTierSchema[] = await this.db
            .select()
            .from(doorSaleTier)
            .where(eq(doorSaleTier.eventId, eventId));

        return result.map(mapToEntity);
    }

    async update(id: string, input: UpdateTierDbInput): Promise<DoorSaleTierEntity> {
        const result: DoorSaleTierSchema[] = await this.db
            .update(doorSaleTier)
            .set(input)
            .where(eq(doorSaleTier.id, id))
            .returning();

        return mapToEntity(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(doorSaleTier)
            .where(eq(doorSaleTier.id, id));
    }
}
