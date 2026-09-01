import { type YogaInitialContext } from 'graphql-yoga';
import { type db } from '../db';
import SignUpService from '../domain/auth/signup.service';
import SignInService from '../domain/auth/signin.service';
import CreateVenueService from '../domain/venues/create-venue.service';
import CreateEventService from '../domain/events/create-event.service';
import UpdateEventService from '../domain/events/update-event.service';
import TransitionEventService from '../domain/events/transition-event.service';
import DeleteEventService from '../domain/events/delete-event.service';
import GetEventsService from '../domain/events/get-events.service';
import ManageTiersService from '../domain/events/manage-tiers.service';
import GetVenuesService from '../domain/venues/get-venues.service';
import GetEventRelationsService from '../domain/events/get-event-relations.service';
import GetPublicEventsService from '../domain/discovery/get-public-events.service';
import SubscribeService from '../domain/discovery/subscribe.service';
import PublishEventService from '../domain/discovery/publish-event.service';
import CurateEventService from '../domain/discovery/curate-event.service';
import { UserEntity } from '../repositories/user.entity';

/**
 * `services` holds services only.
 *
 * Repositories used to be injected here so venue handlers and the Event type resolvers
 * could reach them directly. That broke the layering rule and, more importantly, meant
 * a resolver could bypass a service's filtering. Public Discovery makes that dangerous:
 * visibility filtering must live in exactly one place.
 *
 * See docs/patterns.md § The layering rule.
 */
export interface AppGraphQLContext extends YogaInitialContext {
    db: typeof db;
    services: {
        signUpService: SignUpService;
        signInService: SignInService;
        createVenueService: CreateVenueService;
        getVenuesService: GetVenuesService;
        createEventService: CreateEventService;
        updateEventService: UpdateEventService;
        transitionEventService: TransitionEventService;
        deleteEventService: DeleteEventService;
        getEventsService: GetEventsService;
        getEventRelationsService: GetEventRelationsService;
        manageTiersService: ManageTiersService;

        // Public discovery
        getPublicEventsService: GetPublicEventsService;
        subscribeService: SubscribeService;
        publishEventService: PublishEventService;
        curateEventService: CurateEventService;
    };
    user?: UserEntity | null;
}
