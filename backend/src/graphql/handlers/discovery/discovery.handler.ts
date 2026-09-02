import type { AppGraphQLContext } from "../../graphql.types";
import type { PublicEventEntity } from "../../../repositories/public-event.entity";
import type { ExtractedEvent } from "../../../domain/discovery/common/event-extractor";
import { requireAuth } from "../common/require-auth";

/**
 * Authenticated discovery operations: Manager publishing and curator ingestion.
 *
 * These are NOT the public surface — that lives in `handlers/public/`. Everything here
 * requires a session; curator operations additionally check the capability flag inside
 * the service (BR-CUR-001), because authorization is the service's job.
 */

export async function publishEvent(
    _parent: unknown,
    args: { id: string; cityId?: string },
    context: AppGraphQLContext
): Promise<PublicEventEntity> {
    const user = requireAuth(context);
    return context.services.publishEventService.publish({
        eventId: args.id,
        userId: user.id,
        cityId: args.cityId,
    });
}

export async function unpublishEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
): Promise<boolean> {
    const user = requireAuth(context);
    return context.services.publishEventService.unpublish({
        eventId: args.id,
        userId: user.id,
    });
}

export async function extractEventFromUrl(
    _parent: unknown,
    args: { sourceUrl: string },
    context: AppGraphQLContext
): Promise<ExtractedEvent> {
    const user = requireAuth(context);
    return context.services.curateEventService.extract(user, args.sourceUrl);
}

export async function confirmCuratedEvent(
    _parent: unknown,
    args: {
        input: {
            sourceUrl: string;
            name: string;
            startDate: Date;
            endDate?: Date;
            cityId: string;
            venueName: string;
            venueAddress: string;
            externalTicketUrl: string;
            priceFrom?: number;
            description?: string;
            curatorNote?: string;
            lineup?: { name: string; isHeadliner?: boolean }[];
            genreSlugs?: string[];
        };
    },
    context: AppGraphQLContext
): Promise<PublicEventEntity> {
    const user = requireAuth(context);
    return context.services.curateEventService.confirm(user, args.input);
}

export async function setCuratorNote(
    _parent: unknown,
    args: { eventId: string; note: string },
    context: AppGraphQLContext
): Promise<PublicEventEntity> {
    const user = requireAuth(context);
    return context.services.curateEventService.setCuratorNote(user, args.eventId, args.note);
}

export async function setFeatured(
    _parent: unknown,
    args: { eventId: string; from: Date; until: Date },
    context: AppGraphQLContext
): Promise<PublicEventEntity> {
    const user = requireAuth(context);
    return context.services.curateEventService.setFeatured(
        user,
        args.eventId,
        args.from,
        args.until
    );
}
