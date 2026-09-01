import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '~/stores/auth.store';

/**
 * Route groups that never require a session.
 *
 * `(public)` is the discovery surface — anyone on the internet reaches it without an
 * account, so redirecting from it to sign-in would defeat the entire feature.
 */
const UNGATED_GROUPS = ['(auth)', '(public)'];

export function useAuthGate() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const group = segments[0];
        const inAuthGroup = group === '(auth)';
        const isUngated = UNGATED_GROUPS.includes(group as string);

        // Signed out on a gated route → sign in.
        if (!isAuthenticated && !isUngated) {
            router.replace('/(auth)/sign-in');
            return;
        }

        // Signed in and sitting on sign-in/sign-up → straight to the app. Deliberately
        // does NOT bounce a signed-in user off `(public)`: a Manager browsing the public
        // listing is a normal thing to do.
        if (isAuthenticated && inAuthGroup) {
            router.replace('/(app)');
        }
    }, [isAuthenticated, isLoading, segments]);
}
