# Events CRUD — Implementation Plan

## Overview

Full CRUD for Events, Venues, and Door Sale Tiers. Backend follows the established repository → service → handler → resolver pattern. The existing GraphQL schema and DB schema have commented-out/placeholder definitions that need to be replaced with spec-compliant versions.

## Data Model Changes

### New tables (uncomment and modify in `backend/src/db/schema.ts`)

```typescript
export const venue = pgTable('venue', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    address: text('address').notNull(),
    capacity: integer('capacity'),
    createdBy: varchar('created_by', { length: 24 }).references(() => user.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const event = pgTable('event', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: eventStatusEnum('status').default('DRAFT').notNull(),
    venueId: varchar('venue_id', { length: 24 }).references(() => venue.id),
    locationName: text('location_name'),
    locationAddress: text('location_address'),
    doorSalesEnabled: boolean('door_sales_enabled').default(false).notNull(),
    createdBy: varchar('created_by', { length: 24 }).references(() => user.id).notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
});

export const eventTeamMember = pgTable('event_team_member', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    userId: varchar('user_id', { length: 24 }).references(() => user.id).notNull(),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueUserEvent: uniqueIndex('unique_user_event_idx').on(table.eventId, table.userId),
}));

export const doorSaleTier = pgTable('door_sale_tier', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    eventId: varchar('event_id', { length: 24 }).references(() => event.id).notNull(),
    name: text('name').notNull(),
    price: real('price').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Enum change

The existing `eventStatusEnum` uses `'COMPLETED'` but the spec says `'FINISHED'`. Update:
```typescript
export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED']);
```

**Note:** This enum change requires a migration since it's already pushed to DB. Use `drizzle-kit push` — it will prompt to alter the enum.

## Files

### New Files

| File | Responsibility |
|------|---------------|
| `backend/src/repositories/venue.entity.ts` | VenueEntity and CreateVenueDbInput types |
| `backend/src/repositories/venue.repository.ts` | Venue data access (create, findById, findAll) |
| `backend/src/repositories/event.entity.ts` | EventEntity, CreateEventDbInput, UpdateEventDbInput types |
| `backend/src/repositories/event.repository.ts` | Event data access (create, findById, findByCreator, update, softDelete) |
| `backend/src/repositories/event-team-member.entity.ts` | EventTeamMemberEntity type |
| `backend/src/repositories/event-team-member.repository.ts` | EventTeamMember data access (create, findByEventAndUser) |
| `backend/src/repositories/door-sale-tier.entity.ts` | DoorSaleTierEntity, CreateTierDbInput, UpdateTierDbInput types |
| `backend/src/repositories/door-sale-tier.repository.ts` | DoorSaleTier data access (create, update, delete, findByEvent) |
| `backend/src/domain/venues/create-venue.service.ts` | Create venue business logic |
| `backend/src/domain/events/create-event.service.ts` | Create event + auto-assign Manager |
| `backend/src/domain/events/update-event.service.ts` | Update event details |
| `backend/src/domain/events/transition-event.service.ts` | Status lifecycle transitions |
| `backend/src/domain/events/delete-event.service.ts` | Soft-delete event |
| `backend/src/domain/events/get-events.service.ts` | List/fetch events with lazy auto-close |
| `backend/src/domain/events/manage-tiers.service.ts` | Add/update/remove door sale tiers |
| `backend/src/graphql/handlers/venues/create-venue.handler.ts` | GraphQL handler for createVenue |
| `backend/src/graphql/handlers/venues/list-venues.handler.ts` | GraphQL handler for venues query |
| `backend/src/graphql/handlers/venues/get-venue.handler.ts` | GraphQL handler for venue query |
| `backend/src/graphql/handlers/events/create-event.handler.ts` | GraphQL handler for createEvent |
| `backend/src/graphql/handlers/events/update-event.handler.ts` | GraphQL handler for updateEvent |
| `backend/src/graphql/handlers/events/delete-event.handler.ts` | GraphQL handler for deleteEvent |
| `backend/src/graphql/handlers/events/get-event.handler.ts` | GraphQL handler for event query |
| `backend/src/graphql/handlers/events/list-events.handler.ts` | GraphQL handler for events query |
| `backend/src/graphql/handlers/events/transition-event.handler.ts` | GraphQL handler for transitionEventStatus |
| `backend/src/graphql/handlers/events/add-tier.handler.ts` | GraphQL handler for addDoorSaleTier |
| `backend/src/graphql/handlers/events/update-tier.handler.ts` | GraphQL handler for updateDoorSaleTier |
| `backend/src/graphql/handlers/events/remove-tier.handler.ts` | GraphQL handler for removeDoorSaleTier |

### Modified Files

| File | Changes |
|------|---------|
| `backend/src/db/schema.ts` | Uncomment + rewrite venue, event, eventTeamMember tables; add doorSaleTier table; fix eventStatusEnum; remove other commented-out tables (they belong to future features) |
| `backend/src/graphql/schema/index.ts` | Update Event type, add DoorSaleTier type, update inputs for spec compliance, add new mutations/queries |
| `backend/src/graphql/resolvers/index.ts` | Wire all new handlers |
| `backend/src/graphql/graphql.types.ts` | Add new services to AppGraphQLContext |
| `backend/src/index.ts` | Instantiate new repositories and services, add to context |

## Implementation Steps

### Step 1: Data model — Schema and entities

**Files:** `backend/src/db/schema.ts`, all entity files

**Changes:**
- Replace commented-out tables in schema.ts with the Drizzle definitions from "Data Model Changes" above
- Change `eventStatusEnum` from `COMPLETED` to `FINISHED`
- Remove all other commented-out tables and relations (guests, guestLists, guestListEntry — those belong to future features)
- Create entity files:

`venue.entity.ts`:
```typescript
export interface VenueEntity {
    id: string;
    name: string;
    address: string;
    capacity: number | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateVenueDbInput {
    name: string;
    address: string;
    capacity?: number;
    createdBy: string;
}
```

`event.entity.ts`:
```typescript
export interface EventEntity {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    status: 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
    venueId: string | null;
    locationName: string | null;
    locationAddress: string | null;
    doorSalesEnabled: boolean;
    createdBy: string;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreateEventDbInput {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    venueId?: string;
    locationName?: string;
    locationAddress?: string;
    doorSalesEnabled?: boolean;
    createdBy: string;
}

export interface UpdateEventDbInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    venueId?: string | null;
    locationName?: string | null;
    locationAddress?: string | null;
    doorSalesEnabled?: boolean;
    status?: 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}
```

`event-team-member.entity.ts`:
```typescript
export interface EventTeamMemberEntity {
    id: string;
    eventId: string;
    userId: string;
    role: 'MANAGER' | 'PROMOTER' | 'HOST';
    createdAt: Date;
}
```

`door-sale-tier.entity.ts`:
```typescript
export interface DoorSaleTierEntity {
    id: string;
    eventId: string;
    name: string;
    price: number;
    createdAt: Date;
}

export interface CreateTierDbInput {
    eventId: string;
    name: string;
    price: number;
}

export interface UpdateTierDbInput {
    name?: string;
    price?: number;
}
```

**Verification:**
- Run `npx drizzle-kit push` — should apply schema changes without errors
- No TypeScript errors: `npx tsc --noEmit`

### Step 2: Repositories

**Files:** All repository files listed in "New Files"

**Changes:**

`venue.repository.ts`:
```typescript
export interface VenueRepository {
    create(input: CreateVenueDbInput): Promise<VenueEntity>;
    findById(id: string): Promise<VenueEntity | null>;
    findAll(): Promise<VenueEntity[]>;
}
```
Implementation: `DrizzlePostgresVenueRepository` following the same pattern as `user.repository.ts`.

`event.repository.ts`:
```typescript
export interface EventRepository {
    create(input: CreateEventDbInput): Promise<EventEntity>;
    findById(id: string): Promise<EventEntity | null>;  // excludes soft-deleted
    findByCreator(userId: string): Promise<EventEntity[]>;  // excludes soft-deleted
    update(id: string, input: UpdateEventDbInput): Promise<EventEntity>;
    softDelete(id: string): Promise<void>;
}
```

`event-team-member.repository.ts`:
```typescript
export interface EventTeamMemberRepository {
    create(input: { eventId: string; userId: string; role: 'MANAGER' | 'PROMOTER' | 'HOST' }): Promise<EventTeamMemberEntity>;
    findByEventAndUser(eventId: string, userId: string): Promise<EventTeamMemberEntity | null>;
}
```

`door-sale-tier.repository.ts`:
```typescript
export interface DoorSaleTierRepository {
    create(input: CreateTierDbInput): Promise<DoorSaleTierEntity>;
    findById(id: string): Promise<DoorSaleTierEntity | null>;
    findByEventId(eventId: string): Promise<DoorSaleTierEntity[]>;
    update(id: string, input: UpdateTierDbInput): Promise<DoorSaleTierEntity>;
    delete(id: string): Promise<void>;
}
```

**Verification:**
- `npx tsc --noEmit` — no type errors

### Step 3: Venue service and handlers

**Files:** `create-venue.service.ts`, all venue handlers

**Changes:**

`create-venue.service.ts` — validates input (name required, address required, capacity > 0 if provided), calls venueRepository.create().

Zod schema:
```typescript
const CreateVenueSchema = z.object({
    name: z.string().min(1, "Venue name is required"),
    address: z.string().min(1, "Venue address is required"),
    capacity: z.number().int().positive("Capacity must be a positive number").optional(),
});
```

Handlers:
- `create-venue.handler.ts` — requires auth (throw if no context.user), calls service
- `list-venues.handler.ts` — requires auth, calls venueRepository.findAll()
- `get-venue.handler.ts` — requires auth, calls venueRepository.findById()

**Verification:**
- After wiring in Step 6, test via GraphiQL: create a venue, list venues, fetch single venue

### Step 4: Event services and handlers

**Files:** All event service and handler files

**Changes:**

`create-event.service.ts`:
- Validates with Zod: name required, startDate required, startDate not in past, endDate after startDate, either venueId or (locationName + locationAddress) required
- If no endDate, defaults to startDate + 12 hours
- If venueId provided, clears locationName/locationAddress
- Calls eventRepository.create()
- Calls eventTeamMemberRepository.create() with role=MANAGER for the creator

Zod schema:
```typescript
const CreateEventSchema = z.object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    venueId: z.string().optional(),
    locationName: z.string().optional(),
    locationAddress: z.string().optional(),
    doorSalesEnabled: z.boolean().optional(),
}).refine(data => data.venueId || (data.locationName && data.locationAddress), {
    message: "Please select a venue or provide a location",
}).refine(data => data.startDate > new Date(), {
    message: "Start time cannot be in the past",
}).refine(data => !data.endDate || data.endDate > data.startDate, {
    message: "End time must be after start time",
});
```

`update-event.service.ts`:
- Requires event to exist and user to be Manager (check via eventTeamMemberRepository)
- Validates updatable fields, enforces endDate > startDate if both change
- Calls eventRepository.update()

`transition-event.service.ts`:
- Validates allowed transitions per spec (DRAFT→ACTIVE, ACTIVE→FINISHED, FINISHED→ACTIVE, DRAFT→CANCELLED, ACTIVE→CANCELLED)
- Requires Manager role
- Returns updated event

```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['FINISHED', 'CANCELLED'],
    FINISHED: ['ACTIVE'],
    CANCELLED: [],
};
```

`delete-event.service.ts`:
- Requires Manager role
- Calls eventRepository.softDelete()

`get-events.service.ts`:
- `getById(id, userId)` — finds event, checks user is Manager, applies lazy auto-close (if status=ACTIVE and endDate < now, return as FINISHED and persist the change)
- `listByCreator(userId)` — calls eventRepository.findByCreator(), applies lazy auto-close to each

Handlers — each handler is a thin wrapper that:
1. Checks `context.user` exists (auth required)
2. Extracts args
3. Calls the service
4. Returns result

**Verification:**
- After wiring, test full lifecycle via GraphiQL: create → get → update → transition (DRAFT→ACTIVE→FINISHED→ACTIVE, ACTIVE→CANCELLED) → delete

### Step 5: Door sale tier service and handlers

**Files:** `manage-tiers.service.ts`, tier handler files

**Changes:**

`manage-tiers.service.ts`:
- `addTier(eventId, userId, input)` — validates Manager role, validates name non-empty + price > 0, calls doorSaleTierRepository.create()
- `updateTier(tierId, userId, input)` — loads tier, checks Manager role on the tier's event, calls doorSaleTierRepository.update()
- `removeTier(tierId, userId)` — loads tier, checks Manager role, calls doorSaleTierRepository.delete()

Zod schema:
```typescript
const TierSchema = z.object({
    name: z.string().min(1, "Tier name is required"),
    price: z.number().positive("Price must be greater than zero"),
});
```

Handlers:
- `add-tier.handler.ts` — auth required, calls manageTiersService.addTier()
- `update-tier.handler.ts` — auth required, calls manageTiersService.updateTier()
- `remove-tier.handler.ts` — auth required, calls manageTiersService.removeTier()

**Verification:**
- Enable door sales on an event, add tiers, update a tier, remove a tier, disable door sales, verify tiers still exist

### Step 6: GraphQL schema, resolvers, and context wiring

**Files:** `schema/index.ts`, `resolvers/index.ts`, `graphql.types.ts`, `index.ts`

**Changes:**

Update `schema/index.ts` — replace existing Event, Venue types and inputs with spec-compliant versions:

```graphql
type Venue {
    id: ID!
    name: String!
    address: String!
    capacity: Int
    createdBy: User!
    createdAt: DateTime!
}

type Event {
    id: ID!
    name: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    status: EventStatus!
    venue: Venue
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean!
    doorSaleTiers: [DoorSaleTier!]!
    createdBy: User!
    deleted: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
}

type DoorSaleTier {
    id: ID!
    name: String!
    price: Float!
    eventId: ID!
    createdAt: DateTime!
}

input CreateVenueInput {
    name: String!
    address: String!
    capacity: Int
}

input CreateEventInput {
    name: String!
    description: String
    startDate: DateTime!
    endDate: DateTime
    venueId: ID
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean
}

input UpdateEventInput {
    name: String
    description: String
    startDate: DateTime
    endDate: DateTime
    venueId: ID
    locationName: String
    locationAddress: String
    doorSalesEnabled: Boolean
}

input DoorSaleTierInput {
    name: String!
    price: Float!
}

input UpdateDoorSaleTierInput {
    name: String
    price: Float
}
```

Remove types/inputs that belong to future features (GuestList, Guest, GuestListEntry, EventTeamMember, and their related inputs/queries/mutations). Keep only what's needed now.

Update queries:
```graphql
type Query {
    me: User
    event(id: ID!): Event
    myEvents: [Event!]!
    venues: [Venue!]!
    venue(id: ID!): Venue
}
```

Update mutations:
```graphql
type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!
    
    createVenue(input: CreateVenueInput!): Venue!

    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    transitionEventStatus(id: ID!, status: EventStatus!): Event!

    addDoorSaleTier(eventId: ID!, input: DoorSaleTierInput!): DoorSaleTier!
    updateDoorSaleTier(id: ID!, input: UpdateDoorSaleTierInput!): DoorSaleTier!
    removeDoorSaleTier(id: ID!): Boolean!
}
```

Update `resolvers/index.ts` — wire all new handlers.

Update `graphql.types.ts` — add all new services to `AppGraphQLContext.services`.

Update `index.ts` — instantiate all new repositories and services, inject into context.

Add type resolvers for `Event.venue`, `Event.doorSaleTiers`, `Event.createdBy`, `Venue.createdBy` that call the appropriate repository.

**Verification:**
- `npx tsc --noEmit` — no type errors
- `npx tsx src/index.ts` — server starts
- Run `npx drizzle-kit push` if not done already
- Test full flow in GraphiQL:
  1. Sign in → get token
  2. Create venue
  3. Create event with venueId
  4. Create event with inline location
  5. List my events
  6. Get event by id
  7. Update event
  8. Transition DRAFT → ACTIVE
  9. Add door sale tier
  10. Update tier
  11. Remove tier
  12. Transition ACTIVE → FINISHED
  13. Reopen (FINISHED → ACTIVE)
  14. Cancel event
  15. Delete event
  16. Verify deleted event no longer appears in list

## Dependencies
- Auth feature must be implemented and working (it is)
- PostgreSQL must be running (`docker compose up -d`)
