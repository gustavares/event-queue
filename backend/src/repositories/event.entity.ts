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
    visibility: EventVisibility;
    source: EventSource;
    slug: string | null;
    cityId: string | null;
    externalTicketUrl: string | null;
    priceFrom: number | null;
    curatorNote: string | null;
    sourceUrl: string | null;
    featuredFrom: Date | null;
    featuredUntil: Date | null;
    createdBy: string;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export type EventVisibility = 'PUBLIC' | 'UNLISTED';
export type EventSource = 'FIRST_PARTY' | 'CURATED';

/**
 * Discovery writes have their own input type rather than widening UpdateEventDbInput.
 *
 * The same reasoning docs/patterns.md applies to `status`: a field on the generic update
 * input can be set through the generic `updateEvent` mutation, which would let a client
 * publish an event without passing any of PublishEventService's guards. Keeping these
 * separate makes that a compile error rather than a discipline problem.
 */
export interface PublishEventDbInput {
    visibility: EventVisibility;
    slug?: string;
    cityId?: string | null;
}

export interface CurationDbInput {
    curatorNote?: string | null;
    featuredFrom?: Date | null;
    featuredUntil?: Date | null;
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
