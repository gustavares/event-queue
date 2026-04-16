import type { AppGraphQLContext } from "../../graphql.types";

export async function deleteEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        await context.services.deleteEventService.run({
            eventId: args.id,
            userId: context.user.id,
        });
        return true;
    } catch (error) {
        console.error("deleteEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
