import { Client, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { useAuthStore } from '~/stores/auth.store';

const GRAPHQL_URL = process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

export const client = new Client({
    url: GRAPHQL_URL,
    exchanges: [
        cacheExchange,
        authExchange(async (utils) => {
            return {
                addAuthToOperation(operation) {
                    const token = useAuthStore.getState().token;
                    if (!token) return operation;
                    return utils.appendHeaders(operation, {
                        Authorization: `Bearer ${token}`,
                    });
                },
                didAuthError(error) {
                    return error.graphQLErrors.some(
                        (e) => e.extensions?.code === 'UNAUTHENTICATED'
                    );
                },
                async refreshAuth() {
                    useAuthStore.getState().clearAuth();
                },
            };
        }),
        fetchExchange,
    ],
});
