import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function getEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    return await context.services.getEventsService.getById(args.id, user.id);
}
