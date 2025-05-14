import { user } from '../db/schema'; // Import the Drizzle table definition
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// This is the raw type Drizzle infers for SELECT operations
export type UserSchema = InferSelectModel<typeof user>;

// This is the raw type Drizzle infers for INSERT operations
export type NewUserSchema = InferInsertModel<typeof user>;

export interface UserEntity {
    id: string;
    email: string;
    name: string;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreateUserDbInput {
    email: string;
    name: string;
    passwordHash: string;
}
