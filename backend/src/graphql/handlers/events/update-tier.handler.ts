import { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function updateDoorSaleTier(
    _parent: unknown,
    args: { id: string; input: { name?: string; price?: number } },
    context: AppGraphQLContext,
) {
    const user = requireAuth(context);

    try {
        return await context.services.manageTiersService.updateTier(
            args.id,
            user.id,
            args.input,
        );
    } catch (error) {
        console.error("updateDoorSaleTier error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to update tier");
    }
}
