import { AppGraphQLContext } from "../../graphql.types";

export async function removeDoorSaleTier(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext,
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        await context.services.manageTiersService.removeTier(args.id, context.user.id);
        return true;
    } catch (error) {
        console.error("removeDoorSaleTier error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to remove tier");
    }
}
