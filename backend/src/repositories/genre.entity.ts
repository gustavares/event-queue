import { genre } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type GenreSchema = InferSelectModel<typeof genre>;

export interface GenreEntity {
    id: string;
    name: string;
    slug: string;
}
