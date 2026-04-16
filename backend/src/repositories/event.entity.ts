import { event } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type EventSchema = InferSelectModel<typeof event>;

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export interface EventEntity {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    status: EventStatus;
    venueId: string | null;
    locationName: string | null;
    locationAddress: string | null;
    doorSalesEnabled: boolean;
    createdBy: string;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreateEventDbInput {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    venueId?: string;
    locationName?: string;
    locationAddress?: string;
    doorSalesEnabled?: boolean;
    createdBy: string;
}

export interface UpdateEventDbInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    venueId?: string | null;
    locationName?: string | null;
    locationAddress?: string | null;
    doorSalesEnabled?: boolean;
    status?: EventStatus;
}
