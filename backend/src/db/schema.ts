import { pgTable, serial, text, timestamp, boolean, integer, real, pgEnum, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const userRoleEnum = pgEnum('user_role', ['MANAGER', 'PROMOTER', 'HOST']);
export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
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

// export const venues = pgTable('venues', {
//     id: serial('id').primaryKey(),
//     name: text('name').notNull(),
//     address: text('address').notNull(),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// });

// export const events = pgTable('events', {
//     id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
//     name: text('name').notNull(),
//     date: timestamp('date').notNull(),
//     venueId: integer('venue_id').references(() => venues.id).notNull(),
//     description: text('description'),
//     status: eventStatusEnum('status').default('DRAFT').notNull(),
//     createdById: varchar('created_by_id', { length: 24 }).references(() => users.id).notNull(),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// });

// export const guestLists = pgTable('guest_lists', {
//     id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
//     name: text('name').notNull(),
//     eventId: varchar('event_id', { length: 24 }).references(() => events.id).notNull(),
//     entryValue: real('entry_value').notNull(),
//     isPublic: boolean('is_public').default(false).notNull(),
//     createdById: varchar('created_by_id', { length: 24 }).references(() => users.id).notNull(),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// });

// export const guests = pgTable('guests', {
//     id: serial('id').primaryKey(),
//     firstName: text('first_name').notNull(),
//     lastName: text('last_name').notNull(),
//     email: text('email'),
//     phone: text('phone'),
//     notes: text('notes'),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// });

// export const guestListEntry = pgTable('guest_list_entry', {
//     id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
//     guestListId: varchar('guest_list_id', { length: 24 }).references(() => guestLists.id).notNull(),
//     guestId: integer('guest_id').references(() => guests.id).notNull(),
//     addedById: varchar('added_by_id', { length: 24 }).references(() => users.id).notNull(),
//     checkInStatus: checkInStatusEnum('check_in_status').default('PENDING').notNull(),
//     checkInTimestamp: timestamp('check_in_timestamp'),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// }, (table) => {
//     return {
//         // Ensure a guest can only be added once to a specific list
//         uniqueGuestList: uniqueIndex('unique_guest_list_idx').on(table.guestListId, table.guestId),
//     };
// });

// export const eventTeamMembers = pgTable('event_team_members', {
//     id: serial('id').primaryKey(),
//     eventId: varchar('event_id', { length: 24 }).references(() => events.id).notNull(),
//     userId: varchar('user_id', { length: 24 }).references(() => users.id).notNull(),
//     role: userRoleEnum('role').notNull(),
//     createdAt: timestamp('created_at').defaultNow().notNull(),
//     updatedAt: timestamp('updated_at').defaultNow().notNull(),
// }, (table) => {
//     return {
//         // Ensure a user can only have one role per event
//         uniqueUserEvent: uniqueIndex('unique_user_event_idx').on(table.eventId, table.userId),
//     };
// });

// // Relations
// export const usersRelations = relations(users, ({ many }) => ({
//     managedEvents: many(events, { relationName: 'createdBy' }),
//     teamMemberships: many(eventTeamMembers),
//     createdGuestLists: many(guestLists, { relationName: 'createdBy' }),
//     addedGuestEntries: many(guestListEntry, { relationName: 'addedBy' }),
// }));

// export const venuesRelations = relations(venues, ({ many }) => ({
//     events: many(events),
// }));

// export const eventsRelations = relations(events, ({ one, many }) => ({
//     venue: one(venues, {
//         fields: [events.venueId],
//         references: [venues.id],
//     }),
//     createdBy: one(users, {
//         fields: [events.createdById],
//         references: [users.id],
//         relationName: 'createdBy',
//     }),
//     lists: many(guestLists),
//     teamMembers: many(eventTeamMembers),
// }));

// export const guestListsRelations = relations(guestLists, ({ one, many }) => ({
//     event: one(events, {
//         fields: [guestLists.eventId],
//         references: [events.id],
//     }),
//     createdBy: one(users, {
//         fields: [guestLists.createdById],
//         references: [users.id],
//         relationName: 'createdBy',
//     }),
//     entries: many(guestListEntry),
// }));

// export const guestsRelations = relations(guests, ({ many }) => ({
//     listEntries: many(guestListEntry),
// }));

// export const guestListEntryRelations = relations(guestListEntry, ({ one }) => ({
//     guestList: one(guestLists, {
//         fields: [guestListEntry.guestListId],
//         references: [guestLists.id],
//     }),
//     guest: one(guests, {
//         fields: [guestListEntry.guestId],
//         references: [guests.id],
//     }),
//     addedBy: one(users, {
//         fields: [guestListEntry.addedById],
//         references: [users.id],
//         relationName: 'addedBy',
//     }),
// }));

// export const eventTeamMembersRelations = relations(eventTeamMembers, ({ one }) => ({
//     event: one(events, {
//         fields: [eventTeamMembers.eventId],
//         references: [events.id],
//     }),
//     user: one(users, {
//         fields: [eventTeamMembers.userId],
//         references: [users.id],
//     }),
// }));
