import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function removeDoorSaleTier(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext,
) {
    const user = requireAuth(context);

    await context.services.manageTiersService.removeTier(args.id, user.id);
    return true;
}
