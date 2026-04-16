import { pgTable, text, timestamp, boolean, integer, real, pgEnum, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const userRoleEnum = pgEnum('user_role', ['MANAGER', 'PROMOTER', 'HOST']);
export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED']);
export const checkInStatusEnum = pgEnum('check_in_status', ['PENDING', 'COMPLETED']);

// Tables
export const user = pgTable('user', {
    id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

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
