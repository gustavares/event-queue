import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function updateEvent(
    _parent: unknown,
    args: {
        id: string;
        input: {
            name?: string;
            description?: string;
            startDate?: Date;
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

    try {
        const { name, description, startDate, endDate, venueId, locationName, locationAddress, doorSalesEnabled } = args.input;

        return await context.services.updateEventService.run({
            eventId: args.id,
            userId: user.id,
            name,
            description,
            startDate,
            endDate,
            venueId,
            locationName,
            locationAddress,
            doorSalesEnabled,
        });
    } catch (error) {
        console.error("updateEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
