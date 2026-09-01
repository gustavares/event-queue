import { Stack } from 'expo-router';

/**
 * The public discovery surface.
 *
 * Deliberately ungated — `useAuthGate` skips this group entirely. Anyone reaching these
 * routes without an account is the point of the feature, not an error.
 */
export default function PublicLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
