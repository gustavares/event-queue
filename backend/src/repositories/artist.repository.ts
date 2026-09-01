import { ArtistEntity, ArtistSchema, LineupEntryEntity, LineupInput } from "./artist.entity";
import { artist, eventArtist } from "../db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { Database } from "../db";

export interface ArtistRepository {
    findById(id: string): Promise<ArtistEntity | null>;
    /** BR-ART-002 — reuses an existing artist when the name matches case-insensitively. */
    findOrCreateMany(names: string[]): Promise<ArtistEntity[]>;
    findLineupByEventId(eventId: string): Promise<LineupEntryEntity[]>;
    replaceLineup(eventId: string, entries: LineupInput[]): Promise<void>;
}

function mapToArtistEntity(row: ArtistSchema): ArtistEntity {
    return {
        id: row.id,
        name: row.name,
        externalUrl: row.externalUrl,
    };
}

/** BR-ART-002. The uniqueness key: trimmed, whitespace-collapsed, lowercased. */
export function artistNameKey(name: string): string {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export default class DrizzlePostgresArtistRepository implements ArtistRepository {
    constructor(private db: Database) {}

    async findById(id: string): Promise<ArtistEntity | null> {
        const rows: ArtistSchema[] = await this.db
            .select()
            .from(artist)
            .where(eq(artist.id, id))
            .limit(1);

        return rows.length > 0 ? mapToArtistEntity(rows[0]) : null;
    }

    async findOrCreateMany(names: string[]): Promise<ArtistEntity[]> {
        const cleaned = names.map((n) => n.trim()).filter((n) => n.length > 0);
        if (cleaned.length === 0) return [];

        // Deduplicate within the input itself — "Ana Vega" and "ana vega" in the same
        // lineup are one artist, and inserting both would violate the unique index.
        const byKey = new Map<string, string>();
        for (const name of cleaned) {
            const key = artistNameKey(name);
            if (!byKey.has(key)) byKey.set(key, name);
        }

        // onConflictDoNothing makes this safe against a concurrent insert of the same name.
        await this.db
            .insert(artist)
            .values([...byKey.entries()].map(([nameKey, name]) => ({ name, nameKey })))
            .onConflictDoNothing({ target: artist.nameKey });

        const rows: ArtistSchema[] = await this.db
            .select()
            .from(artist)
            .where(inArray(artist.nameKey, [...byKey.keys()]));

        // Return in the caller's original order — the lineup's order is meaningful.
        const byKeyRow = new Map(rows.map((r) => [r.nameKey, r]));
        return [...byKey.keys()]
            .map((key) => byKeyRow.get(key))
            .filter((r): r is ArtistSchema => Boolean(r))
            .map(mapToArtistEntity);
    }

    async findLineupByEventId(eventId: string): Promise<LineupEntryEntity[]> {
        const rows = await this.db
            .select({
                id: artist.id,
                name: artist.name,
                externalUrl: artist.externalUrl,
                position: eventArtist.position,
                isHeadliner: eventArtist.isHeadliner,
            })
            .from(eventArtist)
            .innerJoin(artist, eq(eventArtist.artistId, artist.id))
            .where(eq(eventArtist.eventId, eventId))
            .orderBy(asc(eventArtist.position));

        return rows.map((row) => ({
            artist: { id: row.id, name: row.name, externalUrl: row.externalUrl },
            position: row.position,
            isHeadliner: row.isHeadliner,
        }));
    }

    async replaceLineup(eventId: string, entries: LineupInput[]): Promise<void> {
        await this.db.delete(eventArtist).where(eq(eventArtist.eventId, eventId));
        if (entries.length === 0) return;

        const artists = await this.findOrCreateMany(entries.map((e) => e.name));

        // findOrCreateMany deduplicates, so map back by key rather than by index.
        const idByKey = new Map(artists.map((a) => [artistNameKey(a.name), a.id]));
        const seen = new Set<string>();
        const values: { eventId: string; artistId: string; position: number; isHeadliner: boolean }[] = [];

        entries.forEach((entry) => {
            const artistId = idByKey.get(artistNameKey(entry.name));
            if (!artistId || seen.has(artistId)) return;
            seen.add(artistId);
            values.push({
                eventId,
                artistId,
                position: values.length,
                isHeadliner: entry.isHeadliner ?? false,
            });
        });

        if (values.length > 0) {
            await this.db.insert(eventArtist).values(values);
        }
    }
}
