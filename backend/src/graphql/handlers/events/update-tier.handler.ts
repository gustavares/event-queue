import { AppGraphQLContext } from "../../graphql.types";

export async function updateDoorSaleTier(
    _parent: unknown,
    args: { id: string; input: { name?: string; price?: number } },
    context: AppGraphQLContext,
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.manageTiersService.updateTier(
            args.id,
            context.user.id,
            args.input,
        );
    } catch (error) {
        console.error("updateDoorSaleTier error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to update tier");
    }
}
