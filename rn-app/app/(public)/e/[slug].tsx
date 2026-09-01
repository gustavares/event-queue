import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { PUBLIC_EVENT_QUERY } from '~/lib/graphql/operations/discovery';

interface LineupEntry {
    position: number;
    isHeadliner: boolean;
    artist: { id: string; name: string; externalUrl: string | null };
}

function formatFullDate(value: string): string {
    const d = new Date(value);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${weekday}, ${month} ${d.getDate()} · ${time}`;
}

export default function PublicEventScreen() {
    const router = useRouter();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [{ data, fetching, error }] = useQuery({
        query: PUBLIC_EVENT_QUERY,
        variables: { slug },
        pause: !slug,
    });

    const event = data?.publicEvent;

    // BR-DISC-003 — an unlisted or unknown slug returns the same error either way, so
    // this page can never be used to discover which events exist privately.
    if (!fetching && (error || !event)) {
        return (
            <SafeAreaView className='flex-1 bg-background items-center justify-center px-6 gap-3'>
                <Text className='text-[18px] text-foreground text-center'>
                    This event isn't available.
                </Text>
                <Pressable onPress={() => router.push('/discover' as never)}>
                    <Text className='text-[13px] uppercase tracking-widest text-primary'>
                        Browse what's on →
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    if (fetching || !event) {
        return (
            <SafeAreaView className='flex-1 bg-background items-center justify-center'>
                <Text className='text-muted-foreground'>Loading…</Text>
            </SafeAreaView>
        );
    }

    const lineup: LineupEntry[] = event.lineup ?? [];
    const headliners = lineup.filter((l) => l.isHeadliner);
    const support = lineup.filter((l) => !l.isHeadliner);
    const isCurated = event.source === 'CURATED';
    const isCancelled = event.status === 'CANCELLED';

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <View className='px-6 pt-6'>
                    <Pressable onPress={() => router.push(`/discover/${event.city.slug}` as never)}>
                        <Text className='text-[12px] uppercase tracking-widest text-muted-foreground'>
                            ← {event.city.name}
                        </Text>
                    </Pressable>

                    {isCancelled && (
                        <View className='mt-4 border border-status-cancelled px-4 py-3 rounded-[4px]'>
                            <Text className='text-[12px] uppercase tracking-widest text-status-cancelled font-bold'>
                                This event has been cancelled
                            </Text>
                        </View>
                    )}

                    <Text className='mt-5 text-[36px] font-bold leading-[1.05] text-foreground'>
                        {event.name}
                    </Text>

                    <Text className='mt-3 font-mono text-[14px] text-primary'>
                        {formatFullDate(event.startDate)}
                    </Text>

                    {event.venueName && (
                        <View className='mt-4'>
                            <Text className='text-[17px] font-bold text-foreground'>
                                {event.venueName}
                            </Text>
                            {event.venueAddress && (
                                <Text className='text-[14px] text-muted-foreground mt-0.5'>
                                    {event.venueAddress}
                                </Text>
                            )}
                        </View>
                    )}

                    {event.curatorNote && (
                        <View className='mt-6 border-l-2 border-primary pl-4'>
                            <Text className='text-[16px] italic leading-6 text-foreground'>
                                {event.curatorNote}
                            </Text>
                        </View>
                    )}

                    {event.description && (
                        <Text className='mt-5 text-[15px] leading-6 text-muted-foreground'>
                            {event.description}
                        </Text>
                    )}

                    {lineup.length > 0 && (
                        <View className='mt-8'>
                            <Text className='text-[11px] uppercase tracking-widest text-primary font-bold mb-3'>
                                Line-up
                            </Text>
                            <View className='gap-1'>
                                {headliners.map((entry) => (
                                    <Pressable
                                        key={entry.artist.id}
                                        onPress={() =>
                                            router.push(
                                                `/artist/${entry.artist.id}` as never
                                            )
                                        }
                                    >
                                        <Text className='text-[24px] font-bold text-foreground'>
                                            {entry.artist.name}
                                        </Text>
                                    </Pressable>
                                ))}
                                {support.map((entry) => (
                                    <Pressable
                                        key={entry.artist.id}
                                        onPress={() =>
                                            router.push(
                                                `/artist/${entry.artist.id}` as never
                                            )
                                        }
                                    >
                                        <Text className='text-[16px] text-muted-foreground'>
                                            {entry.artist.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {event.genres?.length > 0 && (
                        <View className='flex-row flex-wrap gap-1.5 mt-6'>
                            {event.genres.map((g: { id: string; name: string }) => (
                                <Text
                                    key={g.id}
                                    className='text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 rounded-[2px]'
                                >
                                    {g.name}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {!isCancelled && (
                <View className='px-6 pb-6 pt-3 border-t border-border bg-background'>
                    <Pressable
                        onPress={() => {
                            if (isCurated && event.externalTicketUrl) {
                                Linking.openURL(event.externalTicketUrl);
                            }
                            // FIRST_PARTY checkout lands with ticketing (post-MVP); until
                            // then the action is present but inert rather than misleading.
                        }}
                        className='bg-primary h-14 items-center justify-center rounded-[4px]'
                    >
                        <Text className='text-primary-foreground text-[13px] font-bold uppercase tracking-widest'>
                            {isCurated ? 'Get tickets →' : 'Tickets at the door'}
                        </Text>
                    </Pressable>
                    {isCurated && (
                        <Text className='text-[11px] text-ink-subtle text-center mt-2'>
                            Sold by the promoter, not by Event Queue
                        </Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
