import express from 'express';
import { createYoga, createSchema } from 'graphql-yoga';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, testConnection } from './db';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { AppGraphQLContext } from './graphql/graphql.types';
import DrizzlePostgresUserRepository from './repositories/user.repository';
import DrizzlePostgresVenueRepository from './repositories/venue.repository';
import DrizzlePostgresEventRepository from './repositories/event.repository';
import DrizzlePostgresEventTeamMemberRepository from './repositories/event-team-member.repository';
import DrizzlePostgresDoorSaleTierRepository from './repositories/door-sale-tier.repository';
import SignUpService from './domain/auth/signup.service';
import SignInService from './domain/auth/signin.service';
import CreateVenueService from './domain/venues/create-venue.service';
import CreateEventService from './domain/events/create-event.service';
import UpdateEventService from './domain/events/update-event.service';
import TransitionEventService from './domain/events/transition-event.service';
import DeleteEventService from './domain/events/delete-event.service';
import GetEventsService from './domain/events/get-events.service';
import ManageTiersService from './domain/events/manage-tiers.service';
import GetVenuesService from './domain/venues/get-venues.service';
import GetEventRelationsService from './domain/events/get-event-relations.service';
import GetPublicEventsService from './domain/discovery/get-public-events.service';
import SubscribeService from './domain/discovery/subscribe.service';
import PublishEventService from './domain/discovery/publish-event.service';
import CurateEventService from './domain/discovery/curate-event.service';
import DrizzlePostgresCityRepository from './repositories/city.repository';
import DrizzlePostgresArtistRepository from './repositories/artist.repository';
import DrizzlePostgresGenreRepository from './repositories/genre.repository';
import DrizzlePostgresSubscriberRepository from './repositories/subscriber.repository';
import DrizzlePostgresPublicEventRepository from './repositories/public-event.repository';
import UnavailableExtractor from './domain/discovery/common/unavailable-extractor';
import AnthropicEventExtractor from './domain/discovery/common/anthropic-extractor';
import type { EventExtractor } from './domain/discovery/common/event-extractor';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken } from './domain/auth/common/jwt.service';

dotenv.config();

async function startServer() {
    const connectedToDb = await testConnection();
    if (!connectedToDb) {
        throw new Error('Failed to connect to Database');
    }

    const app = express();

    // Repositories
    const userRepository = new DrizzlePostgresUserRepository(db);
    const venueRepository = new DrizzlePostgresVenueRepository(db);
    const eventRepository = new DrizzlePostgresEventRepository(db);
    const eventTeamMemberRepository = new DrizzlePostgresEventTeamMemberRepository(db);
    const doorSaleTierRepository = new DrizzlePostgresDoorSaleTierRepository(db);

    // Services
    const signUpService = new SignUpService(userRepository);
    const signInService = new SignInService(userRepository);
    const createVenueService = new CreateVenueService(venueRepository);
    const createEventService = new CreateEventService(db, eventRepository, eventTeamMemberRepository);
    const updateEventService = new UpdateEventService(eventRepository, eventTeamMemberRepository);
    const transitionEventService = new TransitionEventService(eventRepository, eventTeamMemberRepository);
    const deleteEventService = new DeleteEventService(eventRepository, eventTeamMemberRepository);
    const getEventsService = new GetEventsService(eventRepository, eventTeamMemberRepository);
    const manageTiersService = new ManageTiersService(doorSaleTierRepository, eventTeamMemberRepository);
    const getVenuesService = new GetVenuesService(venueRepository);
    const getEventRelationsService = new GetEventRelationsService(userRepository, doorSaleTierRepository);

    // ── Public discovery ──────────────────────────────────────────────
    const cityRepository = new DrizzlePostgresCityRepository(db);
    const artistRepository = new DrizzlePostgresArtistRepository(db);
    const genreRepository = new DrizzlePostgresGenreRepository(db);
    const subscriberRepository = new DrizzlePostgresSubscriberRepository(db);
    const publicEventRepository = new DrizzlePostgresPublicEventRepository(db);

    // No API key means curation degrades to manual entry rather than breaking — the
    // UnavailableExtractor throws the same error the UI already handles for an
    // unreachable page. See docs/features/public-discovery/plan.md.
    const extractor: EventExtractor = process.env.ANTHROPIC_API_KEY
        ? new AnthropicEventExtractor(new Anthropic())
        : new UnavailableExtractor();
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log("ℹ️  ANTHROPIC_API_KEY not set — curator ingestion falls back to manual entry.");
    }

    const getPublicEventsService = new GetPublicEventsService(
        publicEventRepository,
        cityRepository,
        genreRepository,
        artistRepository
    );
    const subscribeService = new SubscribeService(subscriberRepository, cityRepository);
    const publishEventService = new PublishEventService(
        eventRepository,
        eventTeamMemberRepository,
        venueRepository,
        publicEventRepository,
        (slug) => eventRepository.slugExists(slug)
    );
    const curateEventService = new CurateEventService(
        db,
        eventRepository,
        publicEventRepository,
        artistRepository,
        genreRepository,
        cityRepository,
        extractor
    );

    const services = {
        signUpService,
        signInService,
        createVenueService,
        getVenuesService,
        createEventService,
        updateEventService,
        transitionEventService,
        deleteEventService,
        getEventsService,
        manageTiersService,
        getEventRelationsService,
        getPublicEventsService,
        subscribeService,
        publishEventService,
        curateEventService,
    };

    const yoga = createYoga<object, AppGraphQLContext>({
        schema: createSchema({
            typeDefs: typeDefs,
            resolvers: resolvers,
        }),
        context: async (initialContext) => {
            let user = null;

            const authHeader = initialContext.request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                try {
                    const payload = await verifyToken(token);
                    user = await userRepository.findByEmail(payload.email);
                } catch {
                    // Invalid/expired token — user stays null, public endpoints still work
                }
            }

            return {
                ...initialContext,
                db,
                services,
                user,
            };
        },
        graphqlEndpoint: '/graphql',
        graphiql: true,
    });

    app.use(cors());
    app.use(yoga.graphqlEndpoint, yoga);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${yoga.graphqlEndpoint}`);
    });
}

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
