import { type YogaInitialContext } from 'graphql-yoga';
import { type db } from '../db';
import SignUpService from '../domain/auth/signup.service';

export interface AppGraphQLContext extends YogaInitialContext {
    db: typeof db; // Your Drizzle instance
    services: {
        signUpService: SignUpService;
    };
    // TODO
    // user?: UserEntity | null; 
}
