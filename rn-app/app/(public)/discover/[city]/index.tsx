import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { PublicEventRow, type PublicEventSummary } from '~/components/ui/public-event-row';
import { SubscribeForm } from '~/components/ui/subscribe-form';
import {
    PUBLIC_EVENTS_QUERY,
    FEATURED_EVENTS_QUERY,
    GENRES_QUERY,
} from '~/lib/graphql/operations/discovery';

interface Genre {
    id: string;
    name: string;
    slug: string;
}

/** BR-DISC-011 — the server orders by start time; grouping by date is the client's job. */
function groupByDate(events: PublicEventSummary[]): [string, PublicEventSummary[]][] {
    const groups = new Map<string, PublicEventSummary[]>();

    for (const event of events) {
        // Group by the START date — an event running past midnight belongs to the night
        // it began, not the morning it ended (EDGE-2).
        const d = new Date(event.startDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const existing = groups.get(key);
        if (existing) existing.push(event);
        else groups.set(key, [event]);
    }

    return [...groups.entries()];
}

function formatDateHeading(value: string): string {
    const d = new Date(value);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${weekday} ${month} ${d.getDate()}`;
}

export default function CityListingScreen() {
    const router = useRouter();
    const { city: citySlug } = useLocalSearchParams<{ city: string }>();
    const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);

    const [{ data: genreData }] = useQuery({ query: GENRES_QUERY });
    const [{ data: featuredData }] = useQuery({
        query: FEATURED_EVENTS_QUERY,
        variables: { citySlug },
        pause: !citySlug,
    });
    const [{ data, fetching, error }] = useQuery({
        query: PUBLIC_EVENTS_QUERY,
        variables: {
            citySlug,
            genreSlugs: selectedGenres.length > 0 ? selectedGenres : undefined,
        },
        pause: !citySlug,
    });

    const genres: Genre[] = genreData?.genres ?? [];
    const featured: PublicEventSummary[] = featuredData?.featuredEvents ?? [];
    const events: PublicEventSummary[] = data?.publicEvents ?? [];
    const grouped = groupByDate(events);

    const cityName = events[0]?.venueName
        ? (data?.publicEvents?.[0] as { city?: { name: string } })?.city?.name
        : undefined;
    const heading = cityName ?? String(citySlug ?? '').replace(/-/g, ' ');

    // "We don't cover that city yet." comes back as a GraphQL error, not an empty list.
    const cityNotCovered = error?.graphQLErrors[0]?.message === "We don't cover that city yet.";

    const toggleGenre = (slug: string) =>
        setSelectedGenres((current) =>
            current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
        );

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
                <View className='px-6 pt-6 pb-4'>
                    <Pressable onPress={() => router.push('/discover' as never)}>
                        <Text className='text-[12px] uppercase tracking-widest text-muted-foreground'>
                            ← All cities
                        </Text>
                    </Pressable>
                    <Text className='mt-3 text-[34px] font-bold uppercase tracking-tight text-foreground leading-[1.05]'>
                        {heading}
                    </Text>
                </View>

                {cityNotCovered ? (
                    <View className='px-6 py-10 gap-3'>
                        <Text className='text-[16px] text-foreground'>
                            We don't cover that city yet.
                        </Text>
                        <Pressable onPress={() => router.push('/discover' as never)}>
                            <Text className='text-[13px] uppercase tracking-widest text-primary'>
                                See the cities we do cover →
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {genres.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ flexGrow: 0, flexShrink: 0 }}
                                contentContainerStyle={{
                                    paddingHorizontal: 24,
                                    gap: 8,
                                    paddingVertical: 4,
                                    alignItems: 'center',
                                }}
                            >
                                {genres.map((genre) => {
                                    const active = selectedGenres.includes(genre.slug);
                                    return (
                                        <Pressable
                                            key={genre.id}
                                            onPress={() => toggleGenre(genre.slug)}
                                            className={`rounded-sm px-3 py-1.5 ${
                                                active
                                                    ? 'bg-primary'
                                                    : 'border border-muted-foreground'
                                            }`}
                                        >
                                            <Text
                                                className={`text-[11px] uppercase font-bold tracking-wide ${
                                                    active
                                                        ? 'text-primary-foreground'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {genre.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {featured.length > 0 && (
                            <View className='px-6 mt-6'>
                                <Text className='text-[11px] uppercase tracking-widest text-primary font-bold mb-2'>
                                    This week's picks
                                </Text>
                                <View className='border-t border-border'>
                                    {featured.map((event) => (
                                        <PublicEventRow
                                            key={event.id}
                                            event={event}
                                            onPress={() =>
                                                router.push(`/e/${event.slug}` as never)
                                            }
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        <View className='px-6 mt-8'>
                            {fetching && (
                                <Text className='text-muted-foreground text-[14px]'>Loading…</Text>
                            )}

                            {!fetching && events.length === 0 && (
                                <View className='py-8 gap-2'>
                                    <Text className='text-[16px] text-foreground'>
                                        Nothing on for those dates.
                                    </Text>
                                    {selectedGenres.length > 0 && (
                                        <Pressable onPress={() => setSelectedGenres([])}>
                                            <Text className='text-[13px] uppercase tracking-widest text-primary'>
                                                Clear filters →
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}

                            {grouped.map(([key, group]) => (
                                <View key={key} className='mb-6'>
                                    <Text className='text-[11px] uppercase tracking-widest text-muted-foreground font-bold border-t-2 border-foreground pt-2 mb-1'>
                                        {formatDateHeading(group[0].startDate)}
                                    </Text>
                                    {group.map((event) => (
                                        <PublicEventRow
                                            key={event.id}
                                            event={event}
                                            onPress={() =>
                                                router.push(`/e/${event.slug}` as never)
                                            }
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>

                        <View className='px-6 mt-4'>
                            <SubscribeForm
                                citySlug={String(citySlug)}
                                cityName={String(heading)}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
