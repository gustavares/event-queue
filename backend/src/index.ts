import express from 'express';
import { createYoga, createSchema } from 'graphql-yoga';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, testConnection } from './db';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

dotenv.config();

async function startServer() {
    // Ensure database connection is working before starting
    const connectedToDb = await testConnection();
    if (!connectedToDb) {
        throw new Error('Failed to connect to Database');
    }

    const app = express();

    const yoga = createYoga({
        schema: createSchema({
            typeDefs: typeDefs,
            resolvers: resolvers,
        }),
        // Define context for each request
        context: async ({ request }) => {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            let user = null;
            // TODO: Implement user authentication based on token
            // if (token) { user = await getUserByToken(db, token); }
            return { db, user, token };
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
