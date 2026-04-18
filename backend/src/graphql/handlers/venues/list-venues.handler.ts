import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function listVenues(
    _parent: any,
    _args: any,
    context: AppGraphQLContext
): Promise<VenueEntity[]> {
    const user = requireAuth(context);

    const { venueRepository } = context.services;

    try {
        const result = await venueRepository.findAll();
        return result;
    } catch (error: any) {
        console.error("List Venues Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while listing venues.");
    }
}
