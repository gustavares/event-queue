import type { AppGraphQLContext } from "../../graphql.types";
import type { EventStatus } from "../../../repositories/event.entity";
import { requireAuth } from "../common/require-auth";

export async function transitionEventStatus(
    _parent: unknown,
    args: { id: string; status: EventStatus },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.transitionEventService.run({
            eventId: args.id,
            userId: user.id,
            targetStatus: args.status,
        });
    } catch (error) {
        console.error("transitionEventStatus handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
