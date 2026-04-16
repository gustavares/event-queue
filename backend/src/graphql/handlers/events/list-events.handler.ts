import type { AppGraphQLContext } from "../../graphql.types";

export async function listEvents(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.getEventsService.listByCreator(context.user.id);
    } catch (error) {
        console.error("listEvents handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
