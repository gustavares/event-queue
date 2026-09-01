import { subscriber } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SubscriberSchema = InferSelectModel<typeof subscriber>;

export interface SubscriberEntity {
    id: string;
    email: string;
    cityId: string;
    consentedAt: Date;
}

export interface CreateSubscriberDbInput {
    email: string;
    cityId: string;
}
