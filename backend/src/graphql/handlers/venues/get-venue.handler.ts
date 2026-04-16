import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";

export async function getVenue(
    _parent: any,
    args: { id: string },
    context: AppGraphQLContext
): Promise<VenueEntity | null> {
    if (!context.user) throw new Error("Authentication required");

    const { venueRepository } = context.services;

    try {
        const result = await venueRepository.findById(args.id);
        return result;
    } catch (error: any) {
        console.error("Get Venue Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while fetching the venue.");
    }
}
