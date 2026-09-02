import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { PUBLIC_EVENT_QUERY } from '~/lib/graphql/operations/discovery';
import { formatFullDate } from '~/lib/datetime';

interface LineupEntry {
    position: number;
    isHeadliner: boolean;
    artist: { id: string; name: string; externalUrl: string | null };
}

/** Prices are advertised in BRL; "R$ 60" not "$60". */
function formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
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

    // BR-ART-003 / AC-15 — the lineup renders in the curator's order. Splitting it into
    // headliners-then-support reordered the bill: an event billed "Dux, Ana Vega (headline)"
    // was shown as "Ana Vega, Dux", contradicting the order the curator set.
    const lineup: LineupEntry[] = event.lineup ?? [];
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
                                {lineup.map((entry) => (
                                    <Pressable
                                        key={entry.artist.id}
                                        onPress={() =>
                                            router.push(`/artist/${entry.artist.id}` as never)
                                        }
                                    >
                                        <Text
                                            className={
                                                entry.isHeadliner
                                                    ? 'text-[24px] font-bold text-foreground'
                                                    : 'text-[16px] text-muted-foreground'
                                            }
                                        >
                                            {entry.artist.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {typeof event.priceFrom === 'number' && (
                        <View className='mt-6'>
                            <Text className='text-[11px] uppercase tracking-widest text-primary font-bold'>
                                Entrada
                            </Text>
                            <Text className='mt-1 font-mono text-[20px] text-foreground'>
                                a partir de {formatPrice(event.priceFrom)}
                            </Text>
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
