import { CreateVenueData } from "../../../domain/venues/create-venue.service";
import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

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
    const user = requireAuth(context);

    const { name, address, capacity } = args.input;
    const { createVenueService } = context.services;
    const serviceInput: CreateVenueData = { name, address, capacity, userId: user.id };

    try {
        const result = await createVenueService.run(serviceInput);
        return result;
    } catch (error: any) {
        console.error("Create Venue Handler Error:", error.message);
        throw new Error(error.message || "An error occurred while creating the venue.");
    }
}
