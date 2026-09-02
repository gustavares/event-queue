import { GraphQLError } from "graphql";

/**
 * Typed domain errors.
 *
 * GraphQL Yoga runs with `maskedErrors` at its default (on), which replaces any thrown
 * error that is not a `GraphQLError` with "Unexpected error." and code
 * INTERNAL_SERVER_ERROR. A plain `throw new Error("Event not found")` therefore never
 * reaches the user — the message written in the spec is silently discarded.
 *
 * Every user-facing failure must be thrown through one of these helpers, with the exact
 * copy the feature spec calls for.
 *
 * See docs/patterns.md § Error handling.
 */

function domainError(
    message: string,
    code: string,
    extra?: Record<string, unknown>
): GraphQLError {
    return new GraphQLError(message, { extensions: { code, ...extra } });
}

/** Input failed validation, or a business rule rejected it. */
export function ValidationError(message: string): GraphQLError {
    return domainError(message, "BAD_USER_INPUT");
}

/**
 * The entity does not exist — or exists but this caller may not see it.
 *
 * Deliberately does not distinguish the two. Returning FORBIDDEN for records that exist
 * and NOT_FOUND for records that don't turns the API into an existence oracle.
 */
export function NotFoundError(message: string): GraphQLError {
    return domainError(message, "NOT_FOUND");
}

/** Authenticated, but not permitted to perform this action. */
export function ForbiddenError(message: string): GraphQLError {
    return domainError(message, "FORBIDDEN");
}

/**
 * Duplicate, or current state forbids the action.
 *
 * `extra` rides along in `extensions` so a client can act on the conflict rather than only
 * report it — AC-22 shows the curator the listing that already exists, which needs its slug.
 */
export function ConflictError(
    message: string,
    extra?: Record<string, unknown>
): GraphQLError {
    return domainError(message, "CONFLICT", extra);
}
