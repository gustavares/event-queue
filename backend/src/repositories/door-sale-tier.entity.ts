import { doorSaleTier } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type DoorSaleTierSchema = InferSelectModel<typeof doorSaleTier>;

export interface DoorSaleTierEntity {
    id: string;
    eventId: string;
    name: string;
    price: number;
    createdAt: Date;
}

export interface CreateTierDbInput {
    eventId: string;
    name: string;
    price: number;
}

export interface UpdateTierDbInput {
    name?: string;
    price?: number;
}
