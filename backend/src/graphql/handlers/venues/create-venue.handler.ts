import { CreateVenueData } from "../../../domain/venues/create-venue.service";
import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";

interface GraphQLCreateVenueInput {
    name: string;
    address: string;
    capacity?: number;
}

export async function createVenue(
    _parent: any,
    args: { input: GraphQLCreateVenueInput },
    context: AppGraphQLContext
): Promise<VenueEntity> {
    if (!context.user) throw new Error("Authentication required");

    const { name, address, capacity } = args.input;
    const { createVenueService } = context.services;
    const serviceInput: CreateVenueData = { name, address, capacity, userId: context.user.id };

    try {
        const result = await createVenueService.run(serviceInput);
        return result;
    } catch (error: any) {
        console.error("Create Venue Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while creating the venue.");
    }
}
