import type { AppGraphQLContext } from "../../graphql.types";

export async function getEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.getEventsService.getById(args.id, context.user.id);
    } catch (error) {
        console.error("getEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
