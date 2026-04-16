import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";

export async function listVenues(
    _parent: any,
    _args: any,
    context: AppGraphQLContext
): Promise<VenueEntity[]> {
    if (!context.user) throw new Error("Authentication required");

    const { venueRepository } = context.services;

    try {
        const result = await venueRepository.findAll();
        return result;
    } catch (error: any) {
        console.error("List Venues Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while listing venues.");
    }
}
