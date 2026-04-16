import { CreateVenueDbInput, VenueEntity, VenueSchema } from "./venue.entity";
import { venue } from "../db/schema";
import { eq } from "drizzle-orm";
import { Database } from "../db";

export interface VenueRepository {
    create(input: CreateVenueDbInput): Promise<VenueEntity>;
    findById(id: string): Promise<VenueEntity | null>;
    findAll(): Promise<VenueEntity[]>;
}

function mapToVenueEntity(row: VenueSchema): VenueEntity {
    return {
        id: row.id,
        name: row.name,
        address: row.address,
        capacity: row.capacity,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export default class DrizzlePostgresVenueRepository implements VenueRepository {
    constructor(private db: Database) {}

    async create(input: CreateVenueDbInput): Promise<VenueEntity> {
        const result: VenueSchema[] = await this.db
            .insert(venue)
            .values({
                name: input.name,
                address: input.address,
                capacity: input.capacity,
                createdBy: input.createdBy,
            })
            .returning();

        return mapToVenueEntity(result[0]);
    }

    async findById(id: string): Promise<VenueEntity | null> {
        const result: VenueSchema[] = await this.db
            .select()
            .from(venue)
            .where(eq(venue.id, id))
            .limit(1);

        return result.length > 0 ? mapToVenueEntity(result[0]) : null;
    }

    async findAll(): Promise<VenueEntity[]> {
        const result: VenueSchema[] = await this.db
            .select()
            .from(venue);

        return result.map(mapToVenueEntity);
    }
}
