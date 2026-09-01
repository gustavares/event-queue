import { artist } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type ArtistSchema = InferSelectModel<typeof artist>;

export interface ArtistEntity {
    id: string;
    name: string;
    externalUrl: string | null;
}

/** One artist's place in an event's lineup. */
export interface LineupEntryEntity {
    artist: ArtistEntity;
    position: number;
    isHeadliner: boolean;
}

export interface LineupInput {
    name: string;
    isHeadliner?: boolean;
}
