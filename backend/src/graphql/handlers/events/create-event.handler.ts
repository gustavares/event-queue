import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function createEvent(
    _parent: unknown,
    args: {
        input: {
            name: string;
            description?: string;
            startDate: Date;
            endDate?: Date;
            venueId?: string;
            locationName?: string;
            locationAddress?: string;
            doorSalesEnabled?: boolean;
        };
    },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    const { name, description, startDate, endDate, venueId, locationName, locationAddress, doorSalesEnabled } = args.input;

    return await context.services.createEventService.run({
        name,
        description,
        startDate,
        endDate,
        venueId,
        locationName,
        locationAddress,
        doorSalesEnabled,
        userId: user.id,
    });
}
