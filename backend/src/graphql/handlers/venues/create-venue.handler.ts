import { CreateVenueData } from "../../../domain/venues/create-venue.service";
import { VenueEntity } from "../../../repositories/venue.entity";
import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

interface GraphQLCreateVenueInput {
    name: string;
    address: string;
    capacity?: number;
    cityId?: string;
}

export async function createVenue(
    _parent: unknown,
    args: { input: GraphQLCreateVenueInput },
    context: AppGraphQLContext
): Promise<VenueEntity> {
    const user = requireAuth(context);

    const { name, address, capacity, cityId } = args.input;
    const { createVenueService } = context.services;
    const serviceInput: CreateVenueData = { name, address, capacity, cityId, userId: user.id };

    const result = await createVenueService.run(serviceInput);
    return result;
}
