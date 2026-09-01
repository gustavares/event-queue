import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function listVenues(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
): Promise<VenueEntity[]> {
    requireAuth(context);

    return context.services.getVenuesService.listAll();
}
