import { GraphQLError } from "graphql";
import type { AppGraphQLContext } from "../../graphql.types";
import type { UserEntity } from "../../../repositories/user.entity";

/**
 * Throws a GraphQL error with `extensions.code = 'UNAUTHENTICATED'` when the
 * request has no authenticated user. The error's extension code is the
 * contract the urql client's `authExchange.didAuthError` checks to clear the
 * session and redirect to sign-in.
 *
 * Returns the authenticated user as a narrowed (non-null) type so callers
 * can use `const user = requireAuth(context);` without re-checking.
 */
export function requireAuth(context: AppGraphQLContext): UserEntity {
    if (!context.user) {
        throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
        });
    }
    return context.user;
}
