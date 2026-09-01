import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function deleteEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    await context.services.deleteEventService.run({
        eventId: args.id,
        userId: user.id,
    });
    return true;
}
