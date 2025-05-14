import { z } from "zod";
import { UserRepository } from "../../repositories/user.repository";
import { hashPassword } from "./common/password.service";
import { UserEntity } from "../../repositories/user.entity";
import { generateToken } from "./common/jwt.service";

type SignUpData = {
    name: string,
    email: string,
    password: string,
}

const SignUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default class SignUpService {
    constructor(
        private userRepository: UserRepository
    ) { }

    async run(inputData: SignUpData): Promise<{ user: UserEntity, token: string }> {
        const validationResult = SignUpSchema.safeParse(inputData);

        if (!validationResult.success) {
            // TODO: Create custom domain error that wraps ZodError or formats its messages
            const validationErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new Error(`Input validation failed: ${validationErrors.join('; ')}`);
        }
        const { name, email, password } = validationResult.data;

        const userExists = await this.userRepository.findByEmail(email) !== null ? true : false;
        if (userExists) {
            // TODO: Create custom domain error
            throw new Error(`${email} already registered`);
        }

        const hashedPassword = await hashPassword(password);

        // TODO: wrap in try/catch 
        const createdUserEntity = await this.userRepository.create({
            email,
            name,
            passwordHash: hashedPassword,
        });

        const tokenPayload = {
            userId: createdUserEntity.id,
            email: createdUserEntity.email,
        };
        const token = await generateToken(tokenPayload, '1h');

        return {
            user: createdUserEntity,
            token: token,
        };
    }
}