import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function listEvents(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    return await context.services.getEventsService.listByCreator(user.id);
}
