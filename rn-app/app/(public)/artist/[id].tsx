import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { PublicEventRow, type PublicEventSummary } from '~/components/ui/public-event-row';
import { ARTIST_EVENTS_QUERY } from '~/lib/graphql/operations/discovery';

/** AC-18 — an artist's other upcoming events, across every city we cover. */
export default function ArtistScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [{ data, fetching, error }] = useQuery({
        query: ARTIST_EVENTS_QUERY,
        variables: { id },
        pause: !id,
    });

    const artist = data?.artist;
    const events: PublicEventSummary[] = data?.publicEvents ?? [];

    if (!fetching && (error || !artist)) {
        return (
            <SafeAreaView className='flex-1 bg-background items-center justify-center px-6 gap-3'>
                <Text className='text-[18px] text-foreground'>This event isn't available.</Text>
                <Pressable onPress={() => router.push('/discover' as never)}>
                    <Text className='text-[13px] uppercase tracking-widest text-primary'>
                        Browse what's on →
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
                <View className='px-6 pt-6'>
                    <Pressable onPress={() => router.back()}>
                        <Text className='text-[12px] uppercase tracking-widest text-muted-foreground'>
                            ← Back
                        </Text>
                    </Pressable>

                    <Text className='mt-4 text-[11px] uppercase tracking-widest text-primary font-bold'>
                        Artist
                    </Text>
                    <Text className='mt-2 text-[36px] font-bold leading-[1.05] text-foreground'>
                        {artist?.name ?? ''}
                    </Text>

                    <Text className='mt-8 text-[11px] uppercase tracking-widest text-muted-foreground font-bold border-t-2 border-foreground pt-2'>
                        Upcoming
                    </Text>
                </View>

                <View className='px-6'>
                    {fetching && <Text className='text-muted-foreground py-4'>Loading…</Text>}

                    {!fetching && events.length === 0 && (
                        <Text className='text-[15px] text-muted-foreground py-6'>
                            Nothing on for those dates.
                        </Text>
                    )}

                    {events.map((event) => (
                        <PublicEventRow
                            key={event.id}
                            event={event}
                            showDate
                            onPress={() => router.push(`/e/${event.slug}` as never)}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
