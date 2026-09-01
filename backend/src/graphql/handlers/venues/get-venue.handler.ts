import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function getVenue(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
): Promise<VenueEntity | null> {
    requireAuth(context);

    return context.services.getVenuesService.getById(args.id);
}
