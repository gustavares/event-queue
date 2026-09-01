# Public handlers

**The only handlers in the codebase that do not call `requireAuth`.**

Everything reachable from here is served to anyone on the internet with no session. Two
rules, both from `docs/patterns.md` § Public vs authenticated GraphQL surface:

1. Return `PublicEvent`, never `Event`. `PublicEvent` is an allowlist; a field added to the
   event aggregate later cannot leak through it.
2. Go through `GetPublicEventsService`. It has no "include unlisted" path, so there is no
   way to reach a non-public event from here.

Adding a handler to this directory is a security decision. Adding one anywhere else without
`requireAuth` is a bug.
