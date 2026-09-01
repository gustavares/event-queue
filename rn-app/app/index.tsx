import { Redirect } from 'expo-router';
import { useAuthStore } from '~/stores/auth.store';

/**
 * The root route.
 *
 * A stranger arriving at the site is the audience for public discovery, so they land on
 * the listings rather than a sign-in form. Signed-in users go straight to their events.
 */
export default function Index() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return null;

    return <Redirect href={isAuthenticated ? '/(app)' : '/discover'} />;
}
