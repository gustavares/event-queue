import { city } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type CitySchema = InferSelectModel<typeof city>;

export interface CityEntity {
    id: string;
    name: string;
    state: string;
    slug: string;
}
