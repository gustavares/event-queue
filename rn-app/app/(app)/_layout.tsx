import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='index' />
            <Stack.Screen name='events/create' />
            <Stack.Screen name='events/[id]/index' />
            <Stack.Screen name='events/[id]/edit' />
        </Stack>
    );
}
