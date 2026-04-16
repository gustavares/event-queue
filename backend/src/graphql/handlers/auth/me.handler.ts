import { UserEntity } from "../../../repositories/user.entity";
import { AppGraphQLContext } from "../../graphql.types";

export async function me(
    _parent: any,
    _args: {},
    context: AppGraphQLContext
): Promise<UserEntity | null> {
    return context.user ?? null;
}
