import { SignUpData, SignUpOutput } from "../../../domain/auth/signup.service";
import { AppGraphQLContext } from "../../graphql.types";


interface GraphQLSignUpInput {
    email: string;
    password: string;
    name: string;
}

export async function signUp(
    _parent: any,
    args: { input: GraphQLSignUpInput },
    context: AppGraphQLContext
): Promise<SignUpOutput> {
    const { email, password, name } = args.input;
    const { signUpService } = context.services;

    const serviceInput: SignUpData = {
        email,
        password,
        name,
    };

    try {
        const result = await signUpService.run(serviceInput);
        return result;
    } catch (error: any) {
        // TODO: improve error handling
        console.error("Sign Up Handler Error:", error.message);
        throw new Error(error.message || 'An error occurred during sign up.');
    }
}
