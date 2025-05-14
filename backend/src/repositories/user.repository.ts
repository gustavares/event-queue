import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CreateUserDbInput, UserEntity, UserSchema } from "./user.entity";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

export interface UserRepository {
    create(input: CreateUserDbInput): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findUserByEmailWithPassword(email: string): Promise<UserSchema | null>;
}

function mapToUserEntity(userSchema: UserSchema): UserEntity {
    const { password, ...rest } = userSchema;
    return rest;
}

export default class DrizzlePostgresUserRepository implements UserRepository {
    constructor(
        private db: NodePgDatabase
    ) { }

    async create({ email, name, passwordHash }: CreateUserDbInput): Promise<UserEntity> {
        const newUserForDb = {
            email: email,
            name: name,
            password: passwordHash,
        };

        const result: UserSchema[] = await this.db
            .insert(user)
            .values(newUserForDb)
            .returning();

        return mapToUserEntity(result[0]);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const result: UserSchema[] = await this.db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (result.length === 0) {
            return null;
        }
        return mapToUserEntity(result[0]);
    }

    async findUserByEmailWithPassword(email: string): Promise<UserSchema | null> {
        const result: UserSchema[] = await this.db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }

}