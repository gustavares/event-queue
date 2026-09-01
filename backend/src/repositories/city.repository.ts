import { CityEntity, CitySchema } from "./city.entity";
import { city } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { Database } from "../db";

export interface CityRepository {
    findAll(): Promise<CityEntity[]>;
    findBySlug(slug: string): Promise<CityEntity | null>;
    findById(id: string): Promise<CityEntity | null>;
}

function mapToCityEntity(row: CitySchema): CityEntity {
    return {
        id: row.id,
        name: row.name,
        state: row.state,
        slug: row.slug,
    };
}

export default class DrizzlePostgresCityRepository implements CityRepository {
    constructor(private db: Database) {}

    async findAll(): Promise<CityEntity[]> {
        const rows: CitySchema[] = await this.db.select().from(city).orderBy(asc(city.name));
        return rows.map(mapToCityEntity);
    }

    async findById(id: string): Promise<CityEntity | null> {
        const rows: CitySchema[] = await this.db.select().from(city).where(eq(city.id, id)).limit(1);
        return rows.length > 0 ? mapToCityEntity(rows[0]) : null;
    }

    async findBySlug(slug: string): Promise<CityEntity | null> {
        const rows: CitySchema[] = await this.db
            .select()
            .from(city)
            .where(eq(city.slug, slug))
            .limit(1);

        return rows.length > 0 ? mapToCityEntity(rows[0]) : null;
    }
}
