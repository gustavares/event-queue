import { venue } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type VenueSchema = InferSelectModel<typeof venue>;

export interface VenueEntity {
    id: string;
    name: string;
    address: string;
    capacity: number | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateVenueDbInput {
    name: string;
    address: string;
    capacity?: number;
    createdBy: string;
}
