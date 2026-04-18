import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function getVenue(
    _parent: any,
    args: { id: string },
    context: AppGraphQLContext
): Promise<VenueEntity | null> {
    const user = requireAuth(context);

    const { venueRepository } = context.services;

    try {
        const result = await venueRepository.findById(args.id);
        return result;
    } catch (error: any) {
        console.error("Get Venue Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while fetching the venue.");
    }
}
