import type { AppGraphQLContext } from "../graphql.types";
import type { PublicEventEntity } from "../../repositories/public-event.entity";

/**
 * Field resolvers for `PublicEvent`.
 *
 * Shares nothing with the `Event` resolvers on purpose — the two types resolve
 * independently so a field added to `Event` cannot appear on the public surface.
 */
export const PublicEvent = {
    // The city travels with the row rather than being fetched per event — a listing of 40
    // events would otherwise issue 40 city lookups.
    city: (parent: PublicEventEntity) => ({
        id: parent.cityId,
        name: parent.cityName,
        state: parent.cityState,
        slug: parent.citySlug,
    }),

    genres: (parent: PublicEventEntity, _args: unknown, context: AppGraphQLContext) =>
        context.services.getPublicEventsService.genresFor(parent.id),

    lineup: (parent: PublicEventEntity, _args: unknown, context: AppGraphQLContext) =>
        context.services.getPublicEventsService.lineupFor(parent.id),
};
