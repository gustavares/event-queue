import type { AppGraphQLContext } from "../../graphql.types";

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
    if (!context.user) throw new Error("Authentication required");

    try {
        const { name, description, startDate, endDate, venueId, locationName, locationAddress, doorSalesEnabled } = args.input;

        return await context.services.updateEventService.run({
            eventId: args.id,
            userId: context.user.id,
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
