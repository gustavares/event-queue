import { AppGraphQLContext } from "../../graphql.types";

export async function addDoorSaleTier(
    _parent: unknown,
    args: { eventId: string; input: { name: string; price: number } },
    context: AppGraphQLContext,
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.manageTiersService.addTier(
            args.eventId,
            context.user.id,
            args.input,
        );
    } catch (error) {
        console.error("addDoorSaleTier error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to add tier");
    }
}
