import { signUp } from '../handlers/auth/signup.handler';
import { signIn } from '../handlers/auth/signin.handler';
import { me } from '../handlers/auth/me.handler';
import { createVenue } from '../handlers/venues/create-venue.handler';
import { listVenues } from '../handlers/venues/list-venues.handler';
import { getVenue } from '../handlers/venues/get-venue.handler';
import { createEvent } from '../handlers/events/create-event.handler';
import { updateEvent } from '../handlers/events/update-event.handler';
import { deleteEvent } from '../handlers/events/delete-event.handler';
import { getEvent } from '../handlers/events/get-event.handler';
import { listEvents } from '../handlers/events/list-events.handler';
import { transitionEventStatus } from '../handlers/events/transition-event.handler';
import { addDoorSaleTier } from '../handlers/events/add-tier.handler';
import { updateDoorSaleTier } from '../handlers/events/update-tier.handler';
import { removeDoorSaleTier } from '../handlers/events/remove-tier.handler';
import { dateTimeScalar } from '../schema/scalars';
import { AppGraphQLContext } from '../graphql.types';
import { user } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const resolvers = {
    DateTime: dateTimeScalar,

    Query: {
        me,
        event: getEvent,
        myEvents: listEvents,
        venues: listVenues,
        venue: getVenue,
    },

    Mutation: {
        signUp,
        signIn,
        createVenue,
        createEvent,
        updateEvent,
        deleteEvent,
        transitionEventStatus,
        addDoorSaleTier,
        updateDoorSaleTier,
        removeDoorSaleTier,
    },

    Event: {
        venue: async (parent: any, _args: any, context: AppGraphQLContext) => {
            if (!parent.venueId) return null;
            return context.services.venueRepository.findById(parent.venueId);
        },
        doorSaleTiers: async (parent: any, _args: any, context: AppGraphQLContext) => {
            return context.services.doorSaleTierRepository.findByEventId(parent.id);
        },
        createdBy: async (parent: any, _args: any, context: AppGraphQLContext) => {
            const result = await context.db
                .select({ id: user.id, email: user.email, name: user.name })
                .from(user)
                .where(eq(user.id, parent.createdBy))
                .limit(1);
            return result[0] || null;
        },
    },
};
