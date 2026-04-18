import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function listEvents(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.getEventsService.listByCreator(user.id);
    } catch (error) {
        console.error("listEvents handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
