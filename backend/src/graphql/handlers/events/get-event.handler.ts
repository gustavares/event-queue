import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function getEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.getEventsService.getById(args.id, user.id);
    } catch (error) {
        console.error("getEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
