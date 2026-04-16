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
import { UserEntity } from '../repositories/user.entity';
import { VenueRepository } from '../repositories/venue.repository';
import { DoorSaleTierRepository } from '../repositories/door-sale-tier.repository';

export interface AppGraphQLContext extends YogaInitialContext {
    db: typeof db;
    services: {
        signUpService: SignUpService;
        signInService: SignInService;
        createVenueService: CreateVenueService;
        venueRepository: VenueRepository;
        createEventService: CreateEventService;
        updateEventService: UpdateEventService;
        transitionEventService: TransitionEventService;
        deleteEventService: DeleteEventService;
        getEventsService: GetEventsService;
        manageTiersService: ManageTiersService;
        doorSaleTierRepository: DoorSaleTierRepository;
    };
    user?: UserEntity | null;
}
