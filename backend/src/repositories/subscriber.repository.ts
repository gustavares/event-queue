import { SubscriberEntity, SubscriberSchema, CreateSubscriberDbInput } from "./subscriber.entity";
import { subscriber } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { Database } from "../db";

export interface SubscriberRepository {
    /** BR-SUB-002 — idempotent. Returns the existing row when already subscribed. */
    subscribe(input: CreateSubscriberDbInput): Promise<SubscriberEntity>;
}

function mapToSubscriberEntity(row: SubscriberSchema): SubscriberEntity {
    return {
        id: row.id,
        email: row.email,
        cityId: row.cityId,
        consentedAt: row.consentedAt,
    };
}

export default class DrizzlePostgresSubscriberRepository implements SubscriberRepository {
    constructor(private db: Database) {}

    async subscribe(input: CreateSubscriberDbInput): Promise<SubscriberEntity> {
        // Emails are stored lowercased so "Leitor@x.com" and "leitor@x.com" collide on the
        // unique index rather than creating two subscriptions to the same city.
        const email = input.email.trim().toLowerCase();

        await this.db
            .insert(subscriber)
            .values({ email, cityId: input.cityId })
            .onConflictDoNothing();

        const rows: SubscriberSchema[] = await this.db
            .select()
            .from(subscriber)
            .where(and(eq(subscriber.email, email), eq(subscriber.cityId, input.cityId)))
            .limit(1);

        return mapToSubscriberEntity(rows[0]);
    }

}
