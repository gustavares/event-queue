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
    const createEventService = new CreateEventService(eventRepository, eventTeamMemberRepository);
    const updateEventService = new UpdateEventService(eventRepository, eventTeamMemberRepository);
    const transitionEventService = new TransitionEventService(eventRepository, eventTeamMemberRepository);
    const deleteEventService = new DeleteEventService(eventRepository, eventTeamMemberRepository);
    const getEventsService = new GetEventsService(eventRepository, eventTeamMemberRepository);
    const manageTiersService = new ManageTiersService(doorSaleTierRepository, eventTeamMemberRepository);

    const services = {
        signUpService,
        signInService,
        createVenueService,
        venueRepository,
        createEventService,
        updateEventService,
        transitionEventService,
        deleteEventService,
        getEventsService,
        manageTiersService,
        doorSaleTierRepository,
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
