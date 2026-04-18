import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function addDoorSaleTier(
    _parent: unknown,
    args: { eventId: string; input: { name: string; price: number } },
    context: AppGraphQLContext,
) {
    const user = requireAuth(context);

    try {
        return await context.services.manageTiersService.addTier(
            args.eventId,
            user.id,
            args.input,
        );
    } catch (error) {
        console.error("addDoorSaleTier error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to add tier");
    }
}
