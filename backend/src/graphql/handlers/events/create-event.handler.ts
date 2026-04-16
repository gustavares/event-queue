import type { AppGraphQLContext } from "../../graphql.types";

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
    if (!context.user) throw new Error("Authentication required");

    try {
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
            userId: context.user.id,
        });
    } catch (error) {
        console.error("createEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
