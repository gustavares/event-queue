import type { AppGraphQLContext } from "../graphql.types";
import type { EventEntity } from "../../repositories/event.entity";

/**
 * Type resolvers for `Event`.
 *
 * Extracted from `resolvers/index.ts` so that file stays pure wiring
 * (docs/patterns.md § Resolver Wiring). Every field here goes through a service.
 */
export const Event = {
    venue: async (parent: EventEntity, _args: unknown, context: AppGraphQLContext) => {
        if (!parent.venueId) return null;
        return context.services.getVenuesService.getById(parent.venueId);
    },

    doorSaleTiers: async (parent: EventEntity, _args: unknown, context: AppGraphQLContext) => {
        return context.services.getEventRelationsService.doorSaleTiers(parent.id);
    },

    createdBy: async (parent: EventEntity, _args: unknown, context: AppGraphQLContext) => {
        return context.services.getEventRelationsService.creator(parent.createdBy);
    },
};
