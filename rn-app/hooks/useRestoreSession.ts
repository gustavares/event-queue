import { useEffect } from 'react';
import { useQuery } from 'urql';
import { ME_QUERY } from '~/lib/graphql/operations/auth';
import { useAuthStore } from '~/stores/auth.store';

export function useRestoreSession() {
    const { token, user, setAuth, clearAuth } = useAuthStore();
    const [{ data, error, fetching }] = useQuery({
        query: ME_QUERY,
        pause: !token || !!user,
    });

    useEffect(() => {
        if (fetching || !token || user) return;

        if (data?.me) {
            setAuth(token, data.me);
        } else if (error || (data && !data.me)) {
            clearAuth();
        }
    }, [data, error, fetching, token, user]);
}
