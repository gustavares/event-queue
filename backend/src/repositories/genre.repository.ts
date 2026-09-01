import { GenreEntity, GenreSchema } from "./genre.entity";
import { genre, eventGenre } from "../db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { Database } from "../db";

export interface GenreRepository {
    findAll(): Promise<GenreEntity[]>;
    findBySlugs(slugs: string[]): Promise<GenreEntity[]>;
    findByEventId(eventId: string): Promise<GenreEntity[]>;
    replaceForEvent(eventId: string, genreIds: string[]): Promise<void>;
}

function mapToGenreEntity(row: GenreSchema): GenreEntity {
    return { id: row.id, name: row.name, slug: row.slug };
}

export default class DrizzlePostgresGenreRepository implements GenreRepository {
    constructor(private db: Database) {}

    async findAll(): Promise<GenreEntity[]> {
        const rows: GenreSchema[] = await this.db.select().from(genre).orderBy(asc(genre.name));
        return rows.map(mapToGenreEntity);
    }

    async findBySlugs(slugs: string[]): Promise<GenreEntity[]> {
        if (slugs.length === 0) return [];
        const rows: GenreSchema[] = await this.db
            .select()
            .from(genre)
            .where(inArray(genre.slug, slugs));
        return rows.map(mapToGenreEntity);
    }

    async findByEventId(eventId: string): Promise<GenreEntity[]> {
        const rows = await this.db
            .select({ id: genre.id, name: genre.name, slug: genre.slug })
            .from(eventGenre)
            .innerJoin(genre, eq(eventGenre.genreId, genre.id))
            .where(eq(eventGenre.eventId, eventId))
            .orderBy(asc(genre.name));
        return rows;
    }

    async replaceForEvent(eventId: string, genreIds: string[]): Promise<void> {
        await this.db.delete(eventGenre).where(eq(eventGenre.eventId, eventId));
        if (genreIds.length === 0) return;

        const unique = [...new Set(genreIds)];
        await this.db.insert(eventGenre).values(unique.map((genreId) => ({ eventId, genreId })));
    }
}
