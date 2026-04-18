import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function deleteEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        await context.services.deleteEventService.run({
            eventId: args.id,
            userId: user.id,
        });
        return true;
    } catch (error) {
        console.error("deleteEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
