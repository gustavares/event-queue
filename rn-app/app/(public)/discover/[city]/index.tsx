import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { PublicEventRow, type PublicEventSummary } from '~/components/ui/public-event-row';
import { SubscribeForm } from '~/components/ui/subscribe-form';
import { listingDateKey, formatDateHeading } from '~/lib/datetime';
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
        // Group by the START date in the LISTING's timezone — an event running past midnight
        // belongs to the night it began, not the morning it ended (EDGE-2). Using the
        // viewer's local calendar fields put the same event in different groups depending on
        // where the reader was.
        const key = listingDateKey(event.startDate);
        const existing = groups.get(key);
        if (existing) existing.push(event);
        else groups.set(key, [event]);
    }

    return [...groups.entries()];
}

/** AC-4 — the date windows a visitor can narrow a listing to. */
const DATE_RANGES = [
    { key: 'all', label: 'Tudo' },
    { key: 'tonight', label: 'Hoje', days: 1 },
    { key: 'weekend', label: 'Fim de semana', days: 3 },
    { key: 'week', label: '7 dias', days: 7 },
    { key: 'month', label: '30 dias', days: 30 },
] as const;

type DateRangeKey = (typeof DATE_RANGES)[number]['key'];

export default function CityListingScreen() {
    const router = useRouter();
    const { city: citySlug } = useLocalSearchParams<{ city: string }>();
    const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRangeKey>('all');

    const [{ data: genreData }] = useQuery({ query: GENRES_QUERY });
    const [{ data: featuredData }] = useQuery({
        query: FEATURED_EVENTS_QUERY,
        variables: { citySlug },
        pause: !citySlug,
    });
    // AC-4. `startsBefore` is an absolute instant computed from the chosen window.
    const startsBefore = React.useMemo(() => {
        const range = DATE_RANGES.find((r) => r.key === dateRange);
        if (!range || !('days' in range) || !range.days) return undefined;
        const until = new Date();
        until.setDate(until.getDate() + range.days);
        until.setHours(23, 59, 59, 999);
        return until.toISOString();
    }, [dateRange]);

    const [{ data, fetching, error }] = useQuery({
        query: PUBLIC_EVENTS_QUERY,
        variables: {
            citySlug,
            genreSlugs: selectedGenres.length > 0 ? selectedGenres : undefined,
            startsBefore,
        },
        pause: !citySlug,
    });

    const genres: Genre[] = genreData?.genres ?? [];
    const featured: PublicEventSummary[] = featuredData?.featuredEvents ?? [];
    const events: PublicEventSummary[] = data?.publicEvents ?? [];
    const grouped = groupByDate(events);

    // Take the city's real name from any event that has one. The previous form keyed off
    // `venueName`, which is unrelated — so a city whose first event had no venue, or a city
    // with no events at all, fell back to the raw slug and rendered "sao paulo".
    const heading =
        events[0]?.city?.name ??
        featured[0]?.city?.name ??
        String(citySlug ?? '').replace(/-/g, ' ');

    // "We don't cover that city yet." comes back as a GraphQL error, not an empty list.
    const cityNotCovered = error?.graphQLErrors[0]?.message === "We don't cover that city yet.";
    // Any OTHER error is a failure, not an empty result — saying "Nothing on" when the
    // request died tells the visitor the city is quiet when the server is actually broken.
    const requestFailed = Boolean(error) && !cityNotCovered;

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
                        {/* AC-4 — date range */}
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
                            {DATE_RANGES.map((range) => {
                                const active = dateRange === range.key;
                                return (
                                    <Pressable
                                        key={range.key}
                                        onPress={() => setDateRange(range.key)}
                                        className={`rounded-sm px-3 py-1.5 ${
                                            active ? 'bg-primary' : 'border border-border'
                                        }`}
                                    >
                                        <Text
                                            className={`text-[11px] uppercase font-bold tracking-wide ${
                                                active
                                                    ? 'text-primary-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {range.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

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
                                            showDate
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

                            {!fetching && requestFailed && (
                                <View className='py-8 gap-2'>
                                    <Text className='text-[16px] text-foreground'>
                                        We couldn't load what's on right now.
                                    </Text>
                                    <Text className='text-[14px] text-muted-foreground'>
                                        Check your connection and try again.
                                    </Text>
                                </View>
                            )}

                            {!fetching && !requestFailed && events.length === 0 && (
                                <View className='py-8 gap-2'>
                                    <Text className='text-[16px] text-foreground'>
                                        Nothing on for those dates.
                                    </Text>
                                    {(selectedGenres.length > 0 || dateRange !== 'all') && (
                                        <Pressable
                                            onPress={() => {
                                                setSelectedGenres([]);
                                                setDateRange('all');
                                            }}
                                        >
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
