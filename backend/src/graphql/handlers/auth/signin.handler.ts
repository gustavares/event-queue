import { SignInData, SignInOutput } from "../../../domain/auth/signin.service";
import { AppGraphQLContext } from "../../graphql.types";

interface GraphQLSignInInput {
    email: string;
    password: string;
}

export async function signIn(
    _parent: any,
    args: { input: GraphQLSignInInput },
    context: AppGraphQLContext
): Promise<SignInOutput> {
    const { email, password } = args.input;
    const { signInService } = context.services;

    const serviceInput: SignInData = {
        email,
        password,
    };

    const result = await signInService.run(serviceInput);
    return result;
}
