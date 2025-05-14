import express from 'express';
import { createYoga, createSchema } from 'graphql-yoga';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, testConnection } from './db';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { AppGraphQLContext } from './graphql/graphql.types';
import DrizzlePostgresUserRepository from './repositories/user.repository';
import SignUpService from './domain/auth/signup.service';

dotenv.config();

async function startServer() {
    // Ensure database connection is working before starting
    const connectedToDb = await testConnection();
    if (!connectedToDb) {
        throw new Error('Failed to connect to Database');
    }

    const app = express();

    const userRepository = new DrizzlePostgresUserRepository(db);
    const signUpService = new SignUpService(userRepository);
    // const signInService = new SignInService(userRepository, ...); // Example
    // ... instantiate other services

    // This object will hold all instantiated services
    const services = {
        signUpService,
        // signInService,
    };

    const yoga = createYoga<object, AppGraphQLContext>({
        schema: createSchema({
            typeDefs: typeDefs,
            resolvers: resolvers,
        }),
        // Define context for each request
        context: async (initialContext) => { // initialContext contains request, params etc.
            // Here, we add our db instance and instantiated services to the context
            // This makes `db` and `services` available in every resolver's context argument

            // Later, you will also handle JWT verification here and add the user to the context
            // const token = initialContext.request.headers.get('authorization')?.replace('Bearer ', '');
            // let user = null;
            // if (token) { user = await verifyTokenAndGetUser(token, db); }

            return {
                ...initialContext, // Spread the default Yoga context (request, params etc.)
                db,                // Your Drizzle instance
                services,          // Your pre-instantiated services
                // user,           // Authenticated user (null if not authenticated)
            };
        },
        graphqlEndpoint: '/graphql',
        graphiql: true, // Enable GraphiQL UI
    });

    // Apply global middleware
    app.use(cors());

    // Mount GraphQL Yoga middleware
    app.use(yoga.graphqlEndpoint, yoga);

    // Start the Express server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${yoga.graphqlEndpoint}`);
    });
}

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
