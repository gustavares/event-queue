import { z } from "zod";
import { UserRepository } from "../../repositories/user.repository";
import { verifyPassword } from "./common/password.service";
import { UserEntity } from "../../repositories/user.entity";
import { generateToken } from "./common/jwt.service";

export interface SignInOutput {
    user: UserEntity;
    token: string;
}

export type SignInData = {
    email: string;
    password: string;
};

const SignInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export default class SignInService {
    constructor(
        private userRepository: UserRepository
    ) { }

    async run(inputData: SignInData): Promise<{ user: UserEntity; token: string }> {
        const validationResult = SignInSchema.safeParse(inputData);

        if (!validationResult.success) {
            const validationErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new Error(`Input validation failed: ${validationErrors.join('; ')}`);
        }
        const { email, password } = validationResult.data;

        const userWithPassword = await this.userRepository.findUserByEmailWithPassword(email);
        if (!userWithPassword) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await verifyPassword(userWithPassword.password, password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const { password: _, ...userEntity } = userWithPassword;

        const tokenPayload = {
            userId: userEntity.id,
            email: userEntity.email,
        };
        const token = await generateToken(tokenPayload, '1h');

        return {
            user: userEntity,
            token,
        };
    }
}
