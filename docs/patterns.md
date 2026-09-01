# Coding Patterns & Conventions

> Maintained by `/architect`. Standards for the Event Queue codebase.
>
> The 2026-04-16 audit found that **silence in this document was the root cause of every
> recurring defect** — where no convention was written down, each feature invented its own.
> So this file states decisions, including where the decision is "what the code already does."
> Where code does not yet conform, it is listed under [Known non-conformance](#known-non-conformance)
> rather than quietly contradicted.

## Project Structure

```
backend/
  src/
    db/                    — Drizzle schema, connection, migrations
    domain/                — Business logic, organized by feature
      <feature>/
        common/            — Shared helpers within the feature
    graphql/
      handlers/            — One handler per GraphQL operation
        <feature>/
        common/            — requireAuth and other cross-cutting guards
      resolvers/           — Resolver maps wiring handlers to the schema
      schema/              — GraphQL type definitions (SDL)
      graphql.types.ts     — AppGraphQLContext shape
    repositories/          — Data access, one file per entity (+ .entity.ts)

rn-app/
  app/
    (app)/                 — Authenticated routes
    (auth)/                — Unauthenticated routes
  components/
    ui/                    — Reusable UI primitives
    layout/                — Layout shells
  hooks/                   — Custom React hooks
  lib/
    graphql/               — urql client, provider, operations
    theme.ts               — Design tokens as JS values
    useThemeColors.ts      — Resolved tokens for RN colour props
    constants.ts           — NAV_THEME for React Navigation
  stores/                  — Zustand state stores
```

## The layering rule

> **Only services touch repositories.**

Handlers, type resolvers, and everything else go through a service. There are no exceptions —
not for "simple" reads, not for type resolvers.

```
handler / type resolver  →  service  →  repository  →  Drizzle
```

This is the rule the venue handlers and the `Event.createdBy` resolver currently break, and it
is why repositories leaked into the context container. It matters more now than it did:
Public Discovery introduces public reads where visibility filtering must be applied in exactly
one place. If a resolver can reach a repository directly, that filter can be bypassed.

`AppGraphQLContext` therefore exposes **`services` only**. Repositories are constructor-injected
into services and appear nowhere else.

## Backend Patterns

### Repository Pattern

- One file per entity in `backend/src/repositories/`, plus a matching `<entity>.entity.ts`
- **Exports a class**: `export default class DrizzlePostgres<Entity>Repository implements <Entity>Repository`
- Exports the interface as a **named** export, the implementation as **default**
- Constructor takes a `Database` — this is what makes transactions work (see below)
- Uses the Drizzle query builder; no business logic, no validation, no authorization
- Every read method filters soft-deleted rows (see [Soft delete](#soft-delete))

**Decision (2026-08-31):** classes, not factory functions. All five repositories are classes,
and `create-event.service.ts` constructs `new DrizzlePostgresEventRepository(tx)` to bind a
transaction — a constructor is the natural fit for that. This reverses the previous
"factory function" wording, which no code ever followed.

### `mapToEntity` convention

Each repository has a **file-private** `mapTo<Entity>Entity(row: <Entity>Schema): <Entity>Entity`
near the top, used by every read method. Add new fields there, not in each query.

```typescript
function mapToEventEntity(row: EventSchema): EventEntity {
  return { id: row.id, name: row.name, /* … */ };
}
```

### Entity vs Schema

`<entity>.entity.ts` exposes two kinds of type, and they are not interchangeable:

| Type | Shape | Used by |
|------|-------|---------|
| `<Entity>Schema` | `InferSelectModel<typeof table>` — the raw row | Repository internals only |
| `<Entity>Entity` | Hand-written domain interface | Services, handlers, resolvers |
| `Create<Entity>DbInput` / `Update<Entity>DbInput` | Write shapes | Repository method arguments |

Schema types never escape the repository. Anything outside `repositories/` speaks in Entities.

Keep write-input types honest: a field a service must never set through the generic update path
does not belong on `Update<Entity>DbInput`. (`UpdateEventDbInput.status` currently violates this —
status transitions must go through `transition-event.service.ts`, and putting `status` on the
generic input means only discipline stops `updateEvent` from bypassing the transition rules.)

### Service Pattern

- One file per use case in `backend/src/domain/<feature>/`, named `<verb>.service.ts`
- Exported as a **default class** with repositories constructor-injected
- Validates input with Zod, applies authorization, calls repositories, returns Entities
- A service file may expose **several methods when they share one aggregate and the same
  authorization rules** (`GetEventsService.getById` / `.listByCreator`). Otherwise expose a
  single `run()`.
- Services own **all** authorization. A handler never decides who may do what.

**Validation:** use `safeParse` and throw a `ValidationError` (below) on failure. Do not use
`.parse()` — its raw `ZodError` is masked into "Unexpected error." before it reaches the client.

### Error handling ⚠️ read this one

Yoga runs with `maskedErrors` at its default (on). **Any thrown error that is not a
`GraphQLError` reaches the client as `"Unexpected error."` with code `INTERNAL_SERVER_ERROR`.**

Verified 2026-08-31:

```
throw new Error("Event not found")   →   {"message":"Unexpected error.","extensions":{"code":"INTERNAL_SERVER_ERROR"}}
```

Every user-facing message currently written with `throw new Error(...)` in a service is
invisible to users. Spec error copy is therefore only real if it is thrown as a `GraphQLError`.

**Convention:**

1. Services throw the typed domain errors from `backend/src/domain/common/errors.ts`. Each is a
   `GraphQLError` carrying an `extensions.code`:

   | Helper | Code | Use |
   |--------|------|-----|
   | `ValidationError(message)` | `BAD_USER_INPUT` | Zod failure, business-rule violation |
   | `NotFoundError(message)` | `NOT_FOUND` | Entity absent, or hidden from this caller |
   | `ForbiddenError(message)` | `FORBIDDEN` | Authenticated but not permitted |
   | `ConflictError(message)` | `CONFLICT` | Duplicate, or state that forbids the action |
   | `requireAuth(context)` | `UNAUTHENTICATED` | No authenticated user |

2. The message is **the exact user-facing copy from the spec**, in the spec's language.
3. **Handlers do not catch.** The `try / catch / console.error / rethrow` wrapper in 14 of 15
   handlers adds nothing and exists in three mutually inconsistent shapes. Let the error through.
4. Never leak internals. `NotFoundError` is the correct response for "exists but you may not see
   it" — do not distinguish, or the API becomes an existence oracle.

### Transactions

> A service that writes to **more than one table** must wrap the writes in a transaction.

Repositories take a `Database` in their constructor, and a Drizzle transaction handle satisfies
that type. Construct transaction-bound repositories inside the callback:

```typescript
return await this.db.transaction(async (tx) => {
  const txEventRepo = new DrizzlePostgresEventRepository(tx);
  const txTeamRepo = new DrizzlePostgresEventTeamMemberRepository(tx);
  const created = await txEventRepo.create({ /* … */ });
  await txTeamRepo.create({ eventId: created.id, userId, role: "MANAGER" });
  return created;
});
```

Do not use the injected repositories inside a transaction — they hold the non-transactional
connection, and their writes will not roll back with the rest.

### Handler Pattern

- One file per GraphQL operation in `backend/src/graphql/handlers/<feature>/`, `<verb>.handler.ts`
- Calls `requireAuth(context)` first for any authenticated operation
- Calls exactly one service, returns its result
- No try/catch, no authorization logic, no data access
- Typed as `(_parent: unknown, args: { … }, context: AppGraphQLContext)` — **no `any`**

```typescript
export async function transitionEventStatus(
  _parent: unknown,
  args: { id: string; status: EventStatus },
  context: AppGraphQLContext
) {
  const user = requireAuth(context);
  return context.services.transitionEventService.run({ ...args, userId: user.id });
}
```

### Auth guards

`requireAuth(context)` from `graphql/handlers/common/require-auth.ts` is the only way to assert
authentication. It throws `GraphQLError` with `extensions.code = 'UNAUTHENTICATED'`, which is the
contract the urql `authExchange.didAuthError` check depends on to clear the session. Never
hand-roll `if (!context.user) throw …`.

### Public vs authenticated GraphQL surface

Public Discovery introduces the first unauthenticated operations. Two hard rules:

1. **A public operation returns a dedicated public type**, never the authenticated one.
   `PublicEvent` is a separate SDL type whose fields are an explicit allowlist. Never reuse
   `Event` and rely on field-level filtering — a field added to `Event` later would be exposed
   by default. The narrow type must fail closed.
2. **Public handlers live in `handlers/public/`.** Together with `handlers/auth/` — where
   `signIn` and `signUp` are pre-authentication by definition, and `me` deliberately returns
   `null` rather than throwing so session restore can distinguish "no session" from "error" —
   they are the only handlers that do not call `requireAuth`. A handler anywhere else without
   a `requireAuth` call is a bug.

   This is worth grepping for in review:

   ```bash
   for f in src/graphql/handlers/*/*.handler.ts; do grep -q requireAuth "$f" || echo "$f"; done
   ```

Visibility filtering belongs in the service, once — never in a resolver or a handler.

### Resolver Wiring

- `graphql/resolvers/index.ts` maps `Query` and `Mutation` to handlers, flat
- Type resolvers for entity `X` live in `graphql/resolvers/<entity>.resolver.ts` and are
  re-exported from `index.ts`. `index.ts` stays a wiring file with no logic
- Type resolvers obey the layering rule: they call services, never repositories or Drizzle

## Database Patterns

### Drizzle conventions

- Column names are `snake_case` in the DB, `camelCase` in TS (`door_sales_enabled` ↔ `doorSalesEnabled`)
- Primary keys: `varchar(24)` with `$defaultFn(() => createId())` (CUID2)
- Booleans: `.default(false).notNull()`
- Timestamps: `.defaultNow().notNull()`
- Enums declared at the top of `schema.ts`, above the tables

### Migrations

Generated, never pushed. `pnpm db:generate` diffs `schema.ts` and emits SQL into
`backend/drizzle/`; `pnpm db:migrate` applies it. **Do not use `drizzle-kit push`** — it mutates
the database without leaving a migration, which is how four tables ended up existing in
`schema.ts` and nowhere in the migration history.

Review generated SQL before applying, and commit it.

### Soft delete

- **Aggregate roots** (`user`, `event`) soft-delete: `deleted: boolean` + nullable `deletedAt`
- **Owned child rows** (`door_sale_tier`, `event_team_member`) hard-delete with their parent
- Every repository read path on a soft-deletable entity filters `deleted = false`. This is not
  optional and not the caller's job — a single unfiltered read leaks deleted data everywhere

## Frontend Patterns

### Design tokens

> **No hardcoded colour anywhere in `app/` or `components/`.** No hex, no `text-white`, no
> `text-gray-500`.

Colour is defined in `rn-app/global.css` (source of truth) and reaches code two ways:

| Need | Use |
|------|-----|
| Styling a component | A NativeWind token class — `bg-background`, `text-muted-foreground`, `text-status-active` |
| A React Native colour **prop** (`placeholderTextColor`, `thumbColor`, `trackColor`, `tintColor`) | `useThemeColors()` from `lib/useThemeColors.ts` |

`lib/theme.ts` holds the JS mirror; `lib/constants.ts` (`NAV_THEME`) derives from it. Changing a
colour means changing `global.css` **and** `theme.ts` — they cannot be derived from each other at
runtime.

Text on a fill uses that fill's foreground token (`text-primary-foreground` on `bg-primary`),
never `text-white`: the brand teal is bright, and white on it measures 2.27:1.

Full palette, contrast measurements, and rationale: `docs/design-system.md`.

### Typing

- **`any` is not allowed in `app/` or `components/`.** Screens currently carry ~20 uses; they are
  how the wrong-variable-name mutation bugs survived to production
- urql operations should be generated from the schema (`@graphql-codegen/cli`) so
  `result.data?.createEvent` is typed. Until that lands, hand-write the result types rather than
  falling back to `any`

### Component extraction

- Screens stay under **~300 LOC**. `create.tsx` and `edit.tsx` are ~480 and ~570, and duplicate
  the venue-picker modal verbatim
- Anything rendered on more than one screen lives in `components/ui/`
- New components are added to the inventory in `docs/design-system.md`

### Store Pattern (Zustand)

- One file per domain in `stores/`, `<domain>.store.ts`, exporting `use<Domain>Store`
- Persistence helpers may be co-located when only that store uses them
- A failed persist must not silently diverge from in-memory state — surface it

### Hook Pattern

- `hooks/use<Purpose>.ts`, encapsulating side effects and shared logic

### GraphQL Operations

- `lib/graphql/operations/<feature>.ts`, named `UPPER_SNAKE_CASE` constants
- **Variable names must match the SDL exactly.** A mutation declaring `$id: ID!` is called with
  `{ id }`. Six operations shipped with `eventId`/`tierId` against `$id` and failed silently

### Routing

- Expo Router file-based; `(auth)/` unauthenticated, `(app)/` authenticated, gated by `useAuthGate`
- Public Discovery routes are unauthenticated and belong in their own group, not in `(auth)/`

## Naming Conventions

| Thing | Convention |
|-------|-----------|
| Directories | `kebab-case` |
| Backend services | `<verb>.service.ts` |
| Feature-local utility helpers in `domain/<feature>/common/` | `<noun>.service.ts` |
| Backend handlers | `<verb>.handler.ts` |
| Repositories | `<entity>.repository.ts` |
| Entity types | `<entity>.entity.ts` |
| Type resolvers | `<entity>.resolver.ts` |
| Frontend stores | `<domain>.store.ts` |
| Frontend hooks | `use<PascalCase>.ts` |
| GraphQL operation constants | `UPPER_SNAKE_CASE` |

## Known non-conformance

Recorded so it is not mistaken for precedent.

**Closed 2026-08-31** — the backend now conforms to every rule above. Verified by:

```bash
# no repository reached outside domain/
grep -rn "Repository\b" src/graphql src/domain | grep -vE "domain/|repositories/"
# no raw Drizzle outside repositories/ and db/
grep -rln "from 'drizzle-orm'" src | grep -vE "repositories/|db/"
# no handler catches
grep -rln "catch" src/graphql/handlers
```

All three return nothing. The venue handlers, `Event.createdBy`, `Event.venue` and
`Event.doorSaleTiers` now route through services; `graphql.types.ts` exposes services only;
services throw typed errors; the handler try/catch wrappers are gone; `.parse()` is replaced
with `safeParse` + `ValidationError`.

**Still open** — frontend only:

| Where | Breaks | Fix |
|-------|--------|-----|
| `UpdateEventDbInput.status` | Generic update input can set status, bypassing transition rules — currently prevented by discipline, not types | Remove; give transitions their own input type |
| `create.tsx` (477 LOC), `edit.tsx` (561 LOC) | Screen size limit, and they duplicate the venue-picker modal verbatim | Extract `VenuePickerSheet` into `components/ui/` |
| Screens under `app/(app)/events/` | 18 uses of `any` — how the wrong-variable-name mutation bugs survived to production | Generate urql types from the schema |

## Tech Stack

Backend: Node 22, TypeScript, GraphQL Yoga, Drizzle ORM, PostgreSQL 16, JOSE + Argon2.
Frontend: React Native, Expo, Expo Router, NativeWind, Zustand, urql.
Full version table and stack decisions: `docs/tech.md`.
