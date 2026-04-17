# Audit Fixes Wave 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the 10 🔴 "fix now" findings from the 2026-04-16 audit triage (grouped into 7 work items) — fixing broken client mutations, restoring the reopen flow, preserving door-sale tiers, wrapping event creation in a transaction, emitting `UNAUTHENTICATED` on auth failures, and correcting two doc inaccuracies.

**Architecture:** Surgical fixes, no refactors beyond what each finding requires. Client-side bugs get one-line-to-a-few-line edits in `rn-app/app/(app)/events/[id]/*.tsx`. Backend gets two concrete changes (a transaction wrapper and a `requireAuth` helper + handler refactor). Docs get two tiny text edits. Larger architectural drift (repo pattern, handler-bypasses-service) is explicitly **out of scope** — it belongs to the Architect patterns rewrite phase per the triage design.

**Tech Stack:** TypeScript, urql (client), Drizzle (backend), GraphQL (graphql-yoga), React Native / Expo Router, markdown.

**Design doc:** `docs/superpowers/specs/2026-04-16-audit-triage-design.md`
**Audit source:** `docs/audits/2026-04-16-full-audit.md`

---

## Preamble: No test framework yet

There are zero test files in the repo; Jest is listed as a devDependency in `backend/package.json` but has no config and no tests. Test infrastructure is **out of scope** — the BDD adoption phase (queued after this plan and the Architect patterns rewrite) will set up test tooling and backfill scenarios.

Every task in this plan uses **manual verification** via the dev environment. Verification steps give exact user actions to take and exact expected outcomes. Do not invent or install test infrastructure for these fixes.

---

## Out of Scope

These are not in this plan (rerouted per triage design):

- Repository pattern drift (rows 63, 87, 102) — Architect patterns rewrite
- Handler bypasses service layer (rows 64, 103) — Architect patterns rewrite
- Raw Drizzle in `Event.createdBy` type resolver (row 65) — Architect patterns rewrite
- `design-system.md` palette mismatch (row 100) — Stitch phase
- Space Grotesk font not loaded (row 101) — Stitch phase

---

## Audit deviation noted during planning

While reading `rn-app/app/(app)/events/[id]/edit.tsx:186` to plan Task 1, one additional broken mutation surfaced that the audit **did not flag**: `UPDATE_EVENT_MUTATION` expects `$id: ID!` but the client passes `{ eventId: id, input }`. Same class of bug, same mechanical fix. **Task 1 includes this 5th call site** because shipping a fix for 4/5 while leaving edit-event broken would undermine the whole wave. Post-plan, the audit itself should get a correction row added to Events CRUD noting this was found during implementation.

---

## File Structure

### Modified files

| File | Purpose |
|------|---------|
| `rn-app/app/(app)/events/[id]/index.tsx` | Fix 2 mutation var names + reopen-transition value + dialog copy |
| `rn-app/app/(app)/events/[id]/edit.tsx` | Fix 3 mutation var names + preserve-tiers behavior + include `doorSalesEnabled` in updateEvent input |
| `backend/src/domain/events/create-event.service.ts` | Wrap both inserts in a Drizzle transaction |
| `backend/src/graphql/graphql.types.ts` | Expose `db` on context (needed by `create-event.service` for transactions) |
| `backend/src/index.ts` (or wherever GraphQL context is built) | Pass `db` through to context |
| `backend/src/graphql/handlers/events/*.handler.ts` (9 files) | Replace `if (!context.user) throw new Error(...)` with `requireAuth(context)` |
| `backend/src/graphql/handlers/venues/*.handler.ts` (3 files) | Same |
| `backend/src/graphql/handlers/auth/me.handler.ts` | **Not touched** — returns `null` for unauth on purpose, no change |
| `backend/src/graphql/handlers/auth/{signup,signin}.handler.ts` | **Not touched** — no auth check to begin with |
| `backend/src/domain/auth/common/jwt.service.ts` | Rename env var read from `JWT_SECRET_STRING` → `JWT_SECRET` |
| `docs/backlog.md` | Flip Events CRUD status: `🔵 IN PROGRESS` → `🟢 DONE` with audit-link note |

### New files

| File | Purpose |
|------|---------|
| `backend/src/graphql/handlers/common/require-auth.ts` | `requireAuth(context)` helper that throws `GraphQLError` with `extensions.code = 'UNAUTHENTICATED'` |

### Files that stay untouched

- All repositories (pattern drift is out of scope)
- `docs/patterns.md` (will be rewritten in the Architect patterns phase)
- `docs/design-system.md`, `docs/tech.md` (Stitch phase + already accurate on JWT var name)

---

## Task 1: Fix 5 broken client mutation variable names

**Problem:** Five client call sites pass `{ eventId }` or `{ tierId }` to mutations whose GraphQL definitions expect `$id`. urql sends the request with an unused variable and a missing required variable; the server rejects with a GraphQL variable error. The Publish / Close / Cancel / Reopen / Delete event actions, the Edit Event save, and tier updates / removals all silently fail on the mobile app.

**Files:**
- Modify: `rn-app/app/(app)/events/[id]/index.tsx:67`
- Modify: `rn-app/app/(app)/events/[id]/index.tsx:73`
- Modify: `rn-app/app/(app)/events/[id]/edit.tsx:186`
- Modify: `rn-app/app/(app)/events/[id]/edit.tsx:206`
- Modify: `rn-app/app/(app)/events/[id]/edit.tsx:213-216`
- Modify: `rn-app/app/(app)/events/[id]/edit.tsx:228`

- [ ] **Step 1: Fix `transitionStatus` call at `index.tsx:67`**

Change:
```tsx
const handleTransition = async (toStatus: EventStatus) => {
    await transitionStatus({ eventId: id, status: toStatus });
    reExecute({ requestPolicy: 'network-only' });
    setConfirmDialog({ visible: false, type: null });
};
```

To:
```tsx
const handleTransition = async (toStatus: EventStatus) => {
    await transitionStatus({ id, status: toStatus });
    reExecute({ requestPolicy: 'network-only' });
    setConfirmDialog({ visible: false, type: null });
};
```

- [ ] **Step 2: Fix `deleteEvent` call at `index.tsx:73`**

Change:
```tsx
const handleDelete = async () => {
    await deleteEvent({ eventId: id });
    router.replace('/(app)');
};
```

To:
```tsx
const handleDelete = async () => {
    await deleteEvent({ id });
    router.replace('/(app)');
};
```

- [ ] **Step 3: Fix `updateEvent` call at `edit.tsx:186`**

Change:
```tsx
const result = await updateEvent({ eventId: id, input });
```

To:
```tsx
const result = await updateEvent({ id, input });
```

- [ ] **Step 4: Fix `removeTier` call at `edit.tsx:206` (inside the "remove deleted tiers" loop)**

Change:
```tsx
for (const orig of originalTiers) {
    if (!currentIds.has(orig.id)) {
        await removeTier({ tierId: orig.id });
    }
}
```

To:
```tsx
for (const orig of originalTiers) {
    if (!currentIds.has(orig.id)) {
        await removeTier({ id: orig.id });
    }
}
```

- [ ] **Step 5: Fix `updateTierMutation` call at `edit.tsx:213-216`**

Change:
```tsx
if (tier.id && originalIds.has(tier.id)) {
    await updateTierMutation({
        tierId: tier.id,
        input: { name: tier.name.trim(), price: parseFloat(tier.price) },
    });
}
```

To:
```tsx
if (tier.id && originalIds.has(tier.id)) {
    await updateTierMutation({
        id: tier.id,
        input: { name: tier.name.trim(), price: parseFloat(tier.price) },
    });
}
```

- [ ] **Step 6: Fix `removeTier` call at `edit.tsx:228` (inside the "disable door sales" else branch — the enclosing logic will be rewritten in Task 3, but this call site gets its variable name aligned first)**

Change:
```tsx
} else {
    // Remove all tiers if door sales disabled
    const originalTiers = eventData?.event?.doorSaleTiers ?? [];
    for (const tier of originalTiers) {
        await removeTier({ tierId: tier.id });
    }
}
```

To:
```tsx
} else {
    // Remove all tiers if door sales disabled
    const originalTiers = eventData?.event?.doorSaleTiers ?? [];
    for (const tier of originalTiers) {
        await removeTier({ id: tier.id });
    }
}
```

(Task 3 will remove this entire `else` branch. Fixing the variable name here first keeps the intermediate commit in a buildable, lint-clean state.)

- [ ] **Step 7: Type-check the client**

Run:
```bash
cd rn-app && pnpm tsc --noEmit
```

Expected: no errors. (If `tsc` reports issues, they are pre-existing or unrelated; any error mentioning `eventId`, `tierId`, or the modified lines must be resolved before committing.)

- [ ] **Step 8: Manual verification — run backend + mobile app**

Terminal A:
```bash
cd backend && pnpm dev
```

Terminal B:
```bash
cd rn-app && pnpm start
```

In the mobile app (expo web or simulator):
1. Sign in as an existing user.
2. Create a new event (use any venue, fill start date in the future).
3. On the event detail screen, tap **Publish**, confirm → status badge flips from DRAFT to ACTIVE.
4. Tap **Close Event**, confirm → status badge flips to FINISHED.
5. Tap **Reopen Event**, confirm → observe the current (broken) behavior; document it. (Task 2 fixes this — step left intentionally for sanity; for now just verify Reopen at least reaches the server and returns an error rather than doing nothing.)
6. Create another event, publish it, then tap **Cancel Event**, confirm → status flips to CANCELLED.
7. On a DRAFT event's detail screen tap **Delete**, confirm → routed back to event list; event is no longer in the list.
8. Enter edit-event for an existing event, change its name, hit **Save Changes** → returns to detail screen; name change visible.
9. Enter edit-event, toggle door sales on, add a tier, hit Save → on the detail screen the tier appears.
10. Enter edit-event, modify the tier's price, hit Save → the price updates on detail.
11. Enter edit-event, remove a tier, hit Save → the tier is gone on detail.

Each of (3, 4, 6, 7, 8, 10, 11) was silently failing before; all must now succeed. Step 5's reopen is expected to still not reach `ACTIVE` (that's Task 2) but should show a server error in `backend` terminal B logs — NOT a client-side variable error.

- [ ] **Step 9: Commit**

```bash
git add rn-app/app/\(app\)/events/\[id\]/index.tsx rn-app/app/\(app\)/events/\[id\]/edit.tsx
git commit -m "$(cat <<'EOF'
fix(events): align client mutation variable names with GraphQL definitions

transitionStatus/deleteEvent/updateEvent/updateTier/removeTier were
being called with `{ eventId }` or `{ tierId }` but the mutations
declare `$id: ID!`. urql sent the request with an unused variable
and a missing one, silently breaking Publish/Close/Cancel/Reopen/
Delete/Edit-event and tier update/remove. Fixes audit rows 43, 44,
45 plus one additional updateEvent mismatch found during triage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix "Reopen" event transition

**Problem:** The reopen branch of `handleTransition` sends `DRAFT`, but the server's `ALLOWED_TRANSITIONS.FINISHED` is `['ACTIVE']`. The server correctly rejects `FINISHED → DRAFT`, so the reopen button never succeeds even after Task 1 fixes the variable-name bug. The confirmation dialog copy also says "moved back to draft status" which reinforces the wrong behavior.

**Files:**
- Modify: `rn-app/app/(app)/events/[id]/index.tsx:82` (the `reopen` branch)
- Modify: `rn-app/app/(app)/events/[id]/index.tsx:119` (the dialog copy)

- [ ] **Step 1: Change the reopen transition target from `DRAFT` to `ACTIVE`**

In `confirmAction`, change:
```tsx
else if (t === 'reopen') await handleTransition('DRAFT');
```

To:
```tsx
else if (t === 'reopen') await handleTransition('ACTIVE');
```

- [ ] **Step 2: Update the reopen-dialog copy to match the new behavior**

In `dialogProps()`, change:
```tsx
case 'reopen':
    return {
        title: 'Reopen Event?',
        message: 'The event will be moved back to draft status.',
        confirmLabel: 'Reopen',
        destructive: false,
    };
```

To:
```tsx
case 'reopen':
    return {
        title: 'Reopen Event?',
        message: 'The event will be reactivated.',
        confirmLabel: 'Reopen',
        destructive: false,
    };
```

- [ ] **Step 3: Type-check**

Run: `cd rn-app && pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual verification**

With backend and mobile app running (same setup as Task 1):
1. Sign in; create and publish an event; close it (status = FINISHED).
2. On the FINISHED event's detail screen, tap **Reopen Event**. Confirmation dialog shows "The event will be reactivated." — confirm.
3. Status badge flips from FINISHED to ACTIVE.
4. Go back to the event list, pull to refresh — event is back in the active section.

- [ ] **Step 5: Commit**

```bash
git add rn-app/app/\(app\)/events/\[id\]/index.tsx
git commit -m "$(cat <<'EOF'
fix(events): reopen transitions FINISHED to ACTIVE, not DRAFT

The reopen branch called handleTransition('DRAFT'), which the server
correctly rejects because ALLOWED_TRANSITIONS.FINISHED = ['ACTIVE'].
Also updates dialog copy to stop claiming the event is moved back to
draft. Fixes audit row 42.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Preserve tiers on disable door sales + persist `doorSalesEnabled`

**Problem:** Two bugs in the same spot:
1. When the user toggles "Enable door sales" OFF and saves, the edit screen iterates existing tiers and removes them — directly contradicting BR-14 ("Disabling door sales does not delete existing tier configuration (preserved for reactivation)") and Edge Case 7 ("tiers are preserved but inactive. Re-enabling restores the same tiers.").
2. The `doorSalesEnabled` toggle is never included in the `updateEvent` mutation input, so the server doesn't even know the user intended to disable door sales — only the tier-deletion side-effect persisted the state (badly).

Fix: remove the delete-all loop; send `doorSalesEnabled` explicitly in the `updateEvent` input.

**Files:**
- Modify: `rn-app/app/(app)/events/[id]/edit.tsx` — the `handleSubmit` function body (specifically lines 171-176 to add `doorSalesEnabled` to `input`, and lines 224-230 to remove the delete-all branch).

- [ ] **Step 1: Include `doorSalesEnabled` in the `updateEvent` input**

In `handleSubmit`, change the `input` construction from:
```tsx
const input: any = {
    name: name.trim(),
    description: description.trim() || undefined,
    startDate: startISO,
    endDate: endISO || undefined,
};
```

To:
```tsx
const input: any = {
    name: name.trim(),
    description: description.trim() || undefined,
    startDate: startISO,
    endDate: endISO || undefined,
    doorSalesEnabled,
};
```

(Location-mode assignment of `venueId` / `locationName` / `locationAddress` stays unchanged.)

- [ ] **Step 2: Remove the "disable door sales" delete-all branch**

Delete the entire `else` block at `edit.tsx:224-230`. Before:

```tsx
if (doorSalesEnabled) {
    // ... tier sync logic stays unchanged ...
} else {
    // Remove all tiers if door sales disabled
    const originalTiers = eventData?.event?.doorSaleTiers ?? [];
    for (const tier of originalTiers) {
        await removeTier({ id: tier.id });
    }
}
```

After:

```tsx
if (doorSalesEnabled) {
    // ... tier sync logic stays unchanged ...
}
```

The tier sync inside the `if (doorSalesEnabled)` block is unchanged. With door sales disabled, no tier mutations run at all — the server keeps tiers on disk untouched, and `doorSalesEnabled: false` (sent in Step 1's input) persists the disabled state.

- [ ] **Step 3: Type-check**

Run: `cd rn-app && pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual verification**

With backend and mobile app running:
1. Sign in; create an event; enable door sales in edit-event; add two tiers ("Early bird" R$50, "Regular" R$80); Save.
2. Verify on detail screen that both tiers are visible.
3. Enter edit-event again; toggle **Enable door sales** OFF; hit Save.
4. Detail screen now shows "Not enabled" in the DOOR SALES section. Tiers are not listed (correct — door sales are off).
5. Enter edit-event again; toggle **Enable door sales** ON; **do NOT add any tiers**; hit Save.
6. Detail screen now shows both original tiers again — "Early bird R$50" and "Regular R$80". (This confirms tiers were preserved on disk.)

If step 6 shows empty tiers, the fix didn't work.

- [ ] **Step 5: Commit**

```bash
git add rn-app/app/\(app\)/events/\[id\]/edit.tsx
git commit -m "$(cat <<'EOF'
fix(events): preserve door-sale tiers when disabling door sales

Toggling door sales off no longer deletes existing tiers. Instead,
doorSalesEnabled is now sent explicitly in the updateEvent input so
the server records the disabled state without a destructive side
effect. Re-enabling door sales restores the original tiers (BR-14,
Edge Case 7). Fixes audit row 46.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wrap event + manager creation in a single transaction

**Problem:** `CreateEventService.run` does two sequential awaits — first `eventRepository.create(...)`, then `eventTeamMemberRepository.create(...)` — with no transaction. If the second write fails (connection drop, unique-constraint error, validation race), an event exists with no Manager, which breaks every downstream authorization check (`transitionEvent`, `updateEvent`, `deleteEvent` all reject) AND makes the event unreachable via `myEvents` (which filters by team-membership). BR-1 ("Creating an event automatically assigns the creator as Manager") is violated silently.

Fix: wrap both inserts in a single Drizzle `db.transaction(async (tx) => { ... })`. Inside the transaction, create two new repository instances with `tx` as their Database handle and use them for the writes.

**Why new instances inside the transaction:** Repositories take `db` in their constructor. To use `tx` instead (so both writes share the same connection and roll back together), we instantiate transaction-scoped versions. This keeps the repository interfaces unchanged; no other code needs to change.

**Files:**
- Modify: `backend/src/domain/events/create-event.service.ts` (add `db` to constructor, use `db.transaction` in `run`)
- Modify: `backend/src/graphql/graphql.types.ts` (expose `db` on context so it can be passed to the service)
- Modify: `backend/src/index.ts` (pass `db` to context when building the GraphQL handler) *(if the file builds context elsewhere, adjust to wherever `AppGraphQLContext` is constructed)*
- Modify: wherever `CreateEventService` is instantiated (likely the same context-building site) to pass `db` in.

- [ ] **Step 1: Inspect the GraphQL context construction site**

Run:
```bash
grep -rn "new CreateEventService" backend/src
grep -rn "AppGraphQLContext" backend/src/index.ts backend/src/graphql/
```

Read `backend/src/graphql/graphql.types.ts` fully to see the current context shape, and read `backend/src/index.ts` (or wherever the GraphQL server is mounted — usually `createYoga` or `useGraphQL`) to see how context is built. You must know these two things before Step 2.

Expected: the `AppGraphQLContext` type has a `services` field (with `createEventService` etc.) and probably a `user` field. It may or may not already have a `db` field.

- [ ] **Step 2: Ensure `db` is accessible to `CreateEventService`**

Two equivalent options — pick whichever is less invasive given what Step 1 revealed:

**Option A — Inject `db` into the service constructor (preferred):**

Change the constructor and `run` in `backend/src/domain/events/create-event.service.ts`:

```ts
import { z } from "zod";
import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import type { EventEntity } from "../../repositories/event.entity";
import type { Database } from "../../db";
import DrizzlePostgresEventRepository from "../../repositories/event.repository";
import DrizzlePostgresEventTeamMemberRepository from "../../repositories/event-team-member.repository";

export interface CreateEventData {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    venueId?: string;
    locationName?: string;
    locationAddress?: string;
    doorSalesEnabled?: boolean;
    userId: string;
}

const schema = z
    .object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        venueId: z.string().optional(),
        locationName: z.string().optional(),
        locationAddress: z.string().optional(),
        doorSalesEnabled: z.boolean().optional(),
        userId: z.string(),
    })
    .refine(
        (data) =>
            data.venueId || (data.locationName && data.locationAddress),
        { message: "Please select a venue or provide a location" }
    )
    .refine(
        (data) => data.startDate > new Date(),
        { message: "Start time cannot be in the past" }
    )
    .refine(
        (data) => !data.endDate || data.endDate > data.startDate,
        { message: "End time must be after start time" }
    );

export default class CreateEventService {
    constructor(
        private readonly db: Database,
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async run(input: CreateEventData): Promise<EventEntity> {
        const validated = schema.parse(input);

        const endDate = validated.endDate ?? new Date(validated.startDate.getTime() + 12 * 60 * 60 * 1000);
        const locationName = validated.venueId ? undefined : validated.locationName;
        const locationAddress = validated.venueId ? undefined : validated.locationAddress;

        return await this.db.transaction(async (tx) => {
            const txEventRepo = new DrizzlePostgresEventRepository(tx);
            const txTeamRepo = new DrizzlePostgresEventTeamMemberRepository(tx);

            const event = await txEventRepo.create({
                name: validated.name,
                description: validated.description,
                startDate: validated.startDate,
                endDate,
                venueId: validated.venueId,
                locationName,
                locationAddress,
                doorSalesEnabled: validated.doorSalesEnabled,
                createdBy: validated.userId,
            });

            await txTeamRepo.create({
                eventId: event.id,
                userId: validated.userId,
                role: "MANAGER",
            });

            return event;
        });
    }
}
```

Note: we instantiate transaction-scoped repository instances inside `db.transaction` because the existing repositories close over `this.db` in the constructor. The injected `this.eventRepository` / `this.eventTeamMemberRepository` properties are now unused but **kept in the constructor signature** so the DI wiring at the call site doesn't break and so the repositories are still available if future changes need them outside the transaction. *(Architectural clean-up — removing unused fields, reworking DI to pass a `tx`-aware repository factory — belongs to the Architect patterns rewrite, not this wave.)*

- [ ] **Step 3: Update the `CreateEventService` instantiation to pass `db`**

Find the site where `CreateEventService` is constructed (revealed by Step 1's `grep`). It will look like:

```ts
const createEventService = new CreateEventService(eventRepository, eventTeamMemberRepository);
```

Change to:

```ts
const createEventService = new CreateEventService(db, eventRepository, eventTeamMemberRepository);
```

Where `db` is whatever the existing `Database` instance is called at that scope (likely `db` or `database`).

- [ ] **Step 4: Type-check the backend**

Run:
```bash
cd backend && pnpm tsc --noEmit
```

Expected: no errors. If an error mentions `CreateEventService` constructor arity or the `Database` type, fix the call site in Step 3.

- [ ] **Step 5: Manual verification — happy path**

With backend running (`cd backend && pnpm dev`) and either the mobile app OR `graphql-yoga`'s built-in GraphiQL at `http://localhost:4000/graphql`:

Via mobile app:
1. Sign in; create an event with any venue and a future date.
2. Back on the events list the new event appears.
3. On the event's detail screen, the "Created by" (or similar) resolves and the Edit / Publish buttons work.

If you prefer direct GraphQL:
```graphql
mutation {
  createEvent(input: {
    name: "Transaction test",
    startDate: "2026-12-31T20:00:00Z",
    locationName: "Test hall",
    locationAddress: "Rua X, 123"
  }) { id name status }
}
```

Expected: event returned with a generated `id`.

- [ ] **Step 6: Manual verification — failure rollback**

This is the critical test — verify that a failure in the second insert rolls back the first. Temporarily induce a failure:

Edit `backend/src/domain/events/create-event.service.ts` in the transaction block to throw after the event insert but before the team-member insert:

```ts
const event = await txEventRepo.create({ /* ... */ });

throw new Error("ROLLBACK TEST");  // <-- TEMPORARY

await txTeamRepo.create({ /* ... */ });
```

Restart the backend and attempt to create an event via the app or GraphiQL. The request must fail with `ROLLBACK TEST`.

Then query the database directly to confirm no orphan event was persisted:
```bash
cd backend && pnpm drizzle-kit studio
# Or: psql $DATABASE_URL -c "SELECT id, name FROM event WHERE name = 'Transaction test';"
```

Expected: **zero rows** with `name = 'Transaction test'` (or whatever name you used). If any row exists, the transaction did not roll back — debug before proceeding.

**IMPORTANT:** Remove the `throw new Error("ROLLBACK TEST")` line after this verification passes. Do not commit with it in place.

- [ ] **Step 7: Commit**

```bash
git add backend/src/domain/events/create-event.service.ts backend/src/graphql/graphql.types.ts backend/src/index.ts
git commit -m "$(cat <<'EOF'
fix(events): wrap event + manager creation in a Drizzle transaction

CreateEventService was issuing two sequential awaits — event insert
then EventTeamMember insert — with no transaction. A failure between
the two left the event persisted with no Manager, breaking every
downstream authorization check and hiding the event from myEvents.
Now both writes execute inside db.transaction; failure rolls back
both. Fixes audit row 47 (BR-1).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add `requireAuth` helper + refactor 12 handlers

**Problem:** 12 handlers throw `new Error("Authentication required")` when `context.user` is null — but the client's urql `authExchange.didAuthError` only clears the session when the GraphQL error carries `extensions.code === 'UNAUTHENTICATED'`. Plain `Error` throws become generic GraphQL errors without that code. Result: an expired token causes protected queries to return `null` silently (context.user is null → handler throws "Authentication required" as a plain error → client doesn't clear the session → user sees blank screens instead of being redirected to sign-in).

Fix: create a `requireAuth(context)` helper that throws `GraphQLError` with the proper extension code, and refactor all 12 handlers to use it.

**Scope:** 12 handlers need the refactor. Verified by `grep -l "Authentication required" backend/src/graphql/handlers`:
- events: add-tier, create-event, delete-event, get-event, list-events, remove-tier, transition-event, update-event, update-tier (9 files)
- venues: create-venue, get-venue, list-venues (3 files)

That's **12 files** total — refactor every one. The auth entry-points (`signup`, `signin`, `me`) have no `Authentication required` check and stay untouched.

**Files:**
- Create: `backend/src/graphql/handlers/common/require-auth.ts`
- Modify: all 12 handlers listed above

- [ ] **Step 1: Create the `requireAuth` helper**

Create `backend/src/graphql/handlers/common/require-auth.ts` with:

```ts
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
```

Verify `graphql` is importable — it is, because urql uses it and graphql-yoga bundles it. If the type import of `UserEntity` fails because its relative path is different, correct the path (the existing handlers already import from `"../../../repositories/user.entity"` so copy that exact path).

- [ ] **Step 2: Refactor `backend/src/graphql/handlers/events/get-event.handler.ts`**

Before:
```ts
import type { AppGraphQLContext } from "../../graphql.types";

export async function getEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.getEventsService.getById(args.id, context.user.id);
    } catch (error) {
        console.error("getEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
```

After:
```ts
import type { AppGraphQLContext } from "../../graphql.types";
import { requireAuth } from "../common/require-auth";

export async function getEvent(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.getEventsService.getById(args.id, user.id);
    } catch (error) {
        console.error("getEvent handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
```

- [ ] **Step 3: Refactor `backend/src/graphql/handlers/events/transition-event.handler.ts`**

Before:
```ts
import type { AppGraphQLContext } from "../../graphql.types";
import type { EventStatus } from "../../../repositories/event.entity";

export async function transitionEventStatus(
    _parent: unknown,
    args: { id: string; status: EventStatus },
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.transitionEventService.run({
            eventId: args.id,
            userId: context.user.id,
            targetStatus: args.status,
        });
    } catch (error) {
        console.error("transitionEventStatus handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
```

After:
```ts
import type { AppGraphQLContext } from "../../graphql.types";
import type { EventStatus } from "../../../repositories/event.entity";
import { requireAuth } from "../common/require-auth";

export async function transitionEventStatus(
    _parent: unknown,
    args: { id: string; status: EventStatus },
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.transitionEventService.run({
            eventId: args.id,
            userId: user.id,
            targetStatus: args.status,
        });
    } catch (error) {
        console.error("transitionEventStatus handler error:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
```

- [ ] **Step 4: Apply the same pattern to the remaining 10 handlers**

For each of these files, replace `if (!context.user) throw new Error("Authentication required");` with `const user = requireAuth(context);`, add the `import { requireAuth } from "../common/require-auth";` line near the top, and replace every subsequent `context.user.id` / `context.user!` / `context.user` reference inside that handler with `user` / `user.id` (whichever matches):

- `backend/src/graphql/handlers/events/create-event.handler.ts`
- `backend/src/graphql/handlers/events/delete-event.handler.ts`
- `backend/src/graphql/handlers/events/list-events.handler.ts`
- `backend/src/graphql/handlers/events/remove-tier.handler.ts`
- `backend/src/graphql/handlers/events/update-event.handler.ts`
- `backend/src/graphql/handlers/events/update-tier.handler.ts`
- `backend/src/graphql/handlers/events/add-tier.handler.ts`
- `backend/src/graphql/handlers/venues/create-venue.handler.ts`
- `backend/src/graphql/handlers/venues/get-venue.handler.ts`
- `backend/src/graphql/handlers/venues/list-venues.handler.ts`

For each file, follow this pattern (example for a handler that uses `context.user.id`):

Before:
```ts
export async function someHandler(
    _parent: unknown,
    args: {...},
    context: AppGraphQLContext
) {
    if (!context.user) throw new Error("Authentication required");

    try {
        return await context.services.someService.run({ userId: context.user.id, ... });
    } catch (error) { ... }
}
```

After:
```ts
import { requireAuth } from "../common/require-auth";
// (other imports unchanged)

export async function someHandler(
    _parent: unknown,
    args: {...},
    context: AppGraphQLContext
) {
    const user = requireAuth(context);

    try {
        return await context.services.someService.run({ userId: user.id, ... });
    } catch (error) { ... }
}
```

Do NOT touch the `try`/`catch` wrappers — audit rows on error-handling patterns are deferred to the Architect patterns rewrite.

- [ ] **Step 5: Verify all handlers are converted**

Run:
```bash
grep -rn 'Authentication required' backend/src/graphql/handlers/
```

Expected: **zero matches.** (The string lives in `common/require-auth.ts` now, which the grep also hits — so the expectation is: only `backend/src/graphql/handlers/common/require-auth.ts` appears in the output.)

Then:
```bash
grep -rn 'requireAuth(context)' backend/src/graphql/handlers/
```

Expected: exactly 12 matches — one per refactored handler. If fewer, a handler was missed.

- [ ] **Step 6: Type-check**

```bash
cd backend && pnpm tsc --noEmit
```

Expected: no errors. If any handler has a type error about `context.user` being `null`, the `user` rename was incomplete — fix that handler.

- [ ] **Step 7: Manual verification — error code emitted**

Backend running. Using GraphiQL (or `curl`) without an `Authorization` header:

```graphql
query { myEvents { id name } }
```

Expected response:
```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": { "code": "UNAUTHENTICATED" }
    }
  ],
  "data": { "myEvents": null }
}
```

Critical: `extensions.code` must equal `"UNAUTHENTICATED"`. If the extensions are missing or the code is `"INTERNAL_SERVER_ERROR"`, the helper is wrong.

- [ ] **Step 8: Manual verification — client session clear on expired token**

With backend and mobile app running:
1. Sign in on the mobile app.
2. In a database client (or `psql`), manually expire the user's token by deleting it from the client side: in Expo web dev tools → Application → Local Storage → delete `auth-token`. On native, easier to hit the backend: restart `backend/src/domain/auth/common/jwt.service.ts`'s process with a different `JWT_SECRET` value (see Task 6 for the env-var name) — this invalidates every existing signed token.
3. In the mobile app, pull to refresh the events list (or trigger any protected query).
4. Expected: the app redirects to the sign-in screen (via the `authExchange.didAuthError` → `clearAuth()` chain).

If the app stays on a blank events list instead of redirecting, `didAuthError` is not firing — verify the GraphQL response extension code matches what urql expects (`UNAUTHENTICATED` — spelling matters).

- [ ] **Step 9: Commit**

```bash
git add backend/src/graphql/handlers/common/require-auth.ts backend/src/graphql/handlers/events/ backend/src/graphql/handlers/venues/
git commit -m "$(cat <<'EOF'
fix(auth): emit UNAUTHENTICATED extension code via requireAuth helper

All 12 protected handlers now call requireAuth(context) which throws
a GraphQLError with extensions.code = 'UNAUTHENTICATED' when the
request is unauthenticated. This is the contract the urql
authExchange.didAuthError check depends on; previously handlers
threw plain Error and the client never cleared expired sessions.
Fixes audit rows 27 (Auth Edge case 3) and 86 (cross-cutting root
cause).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Rename `JWT_SECRET_STRING` → `JWT_SECRET`

**Problem:** `docs/tech.md:61` lists `JWT_SECRET` as the backend's JWT signing secret env var. The code at `backend/src/domain/auth/common/jwt.service.ts:7` reads `process.env.JWT_SECRET_STRING`. If the env variable is missing, `jwt.service.ts:10-11` prints a FATAL ERROR referencing `JWT_SECRET` and `process.exit(1)`. A new dev follows the doc, sets `JWT_SECRET=...`, starts the backend, sees "FATAL ERROR: JWT_SECRET is not defined" (a lie — they just set it) and wastes time diagnosing.

Fix: rename the code to read `JWT_SECRET`. The doc is the contract; the code drifted.

**Files:**
- Modify: `backend/src/domain/auth/common/jwt.service.ts:7` (variable read) and `:14` (usage reference)
- Check and possibly modify: `backend/.env` (your local env), `backend/.env.example` (if it exists)

- [ ] **Step 1: Update `jwt.service.ts`**

In `backend/src/domain/auth/common/jwt.service.ts` change:

```ts
const JWT_SECRET_STRING = process.env.JWT_SECRET_STRING;

if (!JWT_SECRET_STRING) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // TODO: throw error for app init
}

const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);
```

To:

```ts
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // TODO: throw error for app init
}

const secretKey = new TextEncoder().encode(JWT_SECRET);
```

(Only the three references to `JWT_SECRET_STRING` change — the error message was already correct.)

- [ ] **Step 2: Update your local `.env`**

Open `backend/.env` and rename the variable:
```
JWT_SECRET_STRING=...
```
To:
```
JWT_SECRET=...
```

(Keep the same value.)

If an `.env.example` file exists at `backend/.env.example`, apply the same rename there. If it does not exist, skip this step.

- [ ] **Step 3: Type-check and verify startup**

```bash
cd backend && pnpm tsc --noEmit
```

Expected: no errors.

Then:
```bash
cd backend && pnpm dev
```

Expected: the server starts normally and prints its listening URL. If you see `FATAL ERROR: JWT_SECRET is not defined`, Step 2 was not applied — check `backend/.env`.

- [ ] **Step 4: Verify signing still works end-to-end**

With backend running:
1. In the mobile app (or GraphiQL with a sign-in mutation), sign in as an existing user.
2. The response includes a JWT token — session persists.
3. Protected queries (`myEvents`) succeed.

If sign-in returns a token but `myEvents` fails with "Invalid or expired authentication token," the rename was incomplete — probably a missed reference. Search the codebase:
```bash
grep -rn "JWT_SECRET_STRING" backend/src
```
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/auth/common/jwt.service.ts
# (do NOT add backend/.env — it is gitignored per .gitignore line 1)
git commit -m "$(cat <<'EOF'
fix(auth): rename JWT_SECRET_STRING env var to JWT_SECRET

tech.md documents JWT_SECRET as the backend's JWT signing secret.
Code read JWT_SECRET_STRING, then printed a FATAL ERROR referencing
JWT_SECRET when missing — so the log message contradicted the
variable name. Aligns code with doc. Fixes audit row 104.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(If `.env.example` exists, include it in the commit — it is not gitignored.)

---

## Task 7: Flip Events CRUD backlog status to `🟢 DONE`

**Problem:** `docs/backlog.md:16` shows Events CRUD as `🔵 IN PROGRESS`, but all 33 acceptance criteria are implemented (with bugs that this plan addresses). The status understates delivered scope.

**Files:**
- Modify: `docs/backlog.md:16` (one table row)

- [ ] **Step 1: Update the row**

In `docs/backlog.md`, find the Events CRUD line:

```markdown
| 2 | Events CRUD (incl. Venues) | 🔵 IN PROGRESS | Auth | [spec](features/events-crud/spec.md) |
```

Change to:

```markdown
| 2 | Events CRUD (incl. Venues) | 🟢 DONE | Auth | [spec](features/events-crud/spec.md) — see [audit](../audits/2026-04-16-full-audit.md) for known defects |
```

- [ ] **Step 2: Verify the status legend still covers the value**

In the same file, the legend (lines 6–9) lists `🟢 DONE`, `🔵 IN PROGRESS`, `⬚ TODO`, `💡 IDEA`. No changes needed — `🟢 DONE` is already documented.

- [ ] **Step 3: Commit**

```bash
git add docs/backlog.md
git commit -m "$(cat <<'EOF'
docs: mark Events CRUD as DONE in backlog

All 33 acceptance criteria are implemented; defects are tracked in
the 2026-04-16 audit. Link from the backlog row points readers at
the audit so "DONE" does not hide the open work. Fixes audit row
105.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification (after all 7 tasks)

- [ ] **Full type-check both workspaces**

```bash
cd backend && pnpm tsc --noEmit
cd ../rn-app && pnpm tsc --noEmit
```

Expected: no new errors attributable to this plan.

- [ ] **End-to-end smoke test**

With backend (`cd backend && pnpm dev`) and mobile app (`cd rn-app && pnpm start`) running:

1. Sign up as a new user → lands on events list.
2. Create an event (future date, any venue) → appears on list.
3. Publish the event → status ACTIVE.
4. Edit the event, enable door sales, add a tier "VIP" R$100, save → tier visible on detail.
5. Edit again, disable door sales, save → door sales show "Not enabled"; tiers are preserved on disk.
6. Edit again, re-enable door sales, save → "VIP" R$100 reappears.
7. Close the event → status FINISHED.
8. Reopen the event → status ACTIVE.
9. Cancel the event → status CANCELLED.
10. Delete the event → returns to events list; event is gone.
11. Log out (via sign-out button); try to open the app again → lands on sign-in (session cleared).
12. Delete the token from storage (Expo web: clear localStorage `auth-token`) then open the app → redirected to sign-in (client-side expiration flow).

If every step passes, the wave is green.

- [ ] **Push**

```bash
git log --oneline origin/main..HEAD
```

Show the user the 7–10 commit range and ask whether to push.

---

## Dependencies

- User has explicitly authorized working on `main` (committed during the audit plan).
- Backend `.env` file is present with a valid `DATABASE_URL` and (post-Task 6) `JWT_SECRET`.
- Postgres is reachable (`docker compose up` or whatever the user's local setup is).
- Node ≥ 18, pnpm available.

## What this plan does NOT do

- Does not refactor repository interfaces to accept a `tx` argument (Architect patterns phase).
- Does not consolidate handler error-handling `try`/`catch` shape (Architect patterns phase).
- Does not write automated tests — the entire test-framework decision belongs to the BDD phase.
- Does not touch the design system, Tailwind theme, or font loading (Stitch phase).
- Does not re-litigate the AC-6 false positive or the severity of any finding — the audit and triage are taken as input.
