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
import { Event } from './event.resolver';

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

    Event,
};
