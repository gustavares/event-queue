import * as React from 'react';
import { SafeAreaView, ScrollView, View, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { useThemeColors } from '~/lib/useThemeColors';
import {
    EXTRACT_EVENT_MUTATION,
    CONFIRM_CURATED_EVENT_MUTATION,
    CITIES_QUERY,
    GENRES_QUERY,
} from '~/lib/graphql/operations/discovery';

interface Draft {
    sourceUrl: string;
    name: string;
    startDate: string;
    venueName: string;
    venueAddress: string;
    ticketUrl: string;
    curatorNote: string;
    description: string;
    lineup: string;
    cityId: string;
    genreSlugs: string[];
    missingFields: string[];
}

const EMPTY: Draft = {
    sourceUrl: '',
    name: '',
    startDate: '',
    venueName: '',
    venueAddress: '',
    ticketUrl: '',
    curatorNote: '',
    description: '',
    lineup: '',
    cityId: '',
    genreSlugs: [],
    missingFields: [],
};

function toDateTimeLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Curator ingestion (BR-CUR-002/003).
 *
 * Paste a link, review what was read, correct anything, then confirm. Extraction never
 * writes — confirming is a separate mutation, so nothing a model produced is saved
 * without a human passing it back.
 */
export default function CurateScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [url, setUrl] = React.useState('');
    const [draft, setDraft] = React.useState<Draft | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [saved, setSaved] = React.useState<string | null>(null);

    const [{ data: cityData }] = useQuery({ query: CITIES_QUERY });
    const [{ data: genreData }] = useQuery({ query: GENRES_QUERY });
    const [, extract] = useMutation(EXTRACT_EVENT_MUTATION);
    const [, confirm] = useMutation(CONFIRM_CURATED_EVENT_MUTATION);

    const cities = cityData?.cities ?? [];
    const genres = genreData?.genres ?? [];

    const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

    const handleExtract = async () => {
        setError(null);
        setSaved(null);

        const result = await extract({ sourceUrl: url.trim() });
        const message = result.error?.graphQLErrors[0]?.message;

        if (message) {
            setError(message);
            // "We couldn't read that page" and "missing fields" both fall through to the
            // form — that is the spec's behaviour, not a failure (BR-CUR-002/008).
            if (message.startsWith("We couldn't read")) {
                setDraft({ ...EMPTY, sourceUrl: url.trim() });
            }
            return;
        }

        const e = result.data?.extractEventFromUrl;
        setDraft({
            ...EMPTY,
            sourceUrl: e.sourceUrl,
            name: e.name ?? '',
            startDate: toDateTimeLocal(e.startDate),
            venueName: e.venueName ?? '',
            venueAddress: e.venueAddress ?? '',
            ticketUrl: e.ticketUrl ?? url.trim(),
            lineup: (e.lineup ?? [])
                .map((l: { name: string; isHeadliner: boolean }) =>
                    l.isHeadliner ? `*${l.name}` : l.name
                )
                .join(', '),
            missingFields: e.missingFields ?? [],
        });
    };

    const handleConfirm = async () => {
        if (!draft) return;
        setError(null);

        const parsedDate = new Date(draft.startDate.replace(' ', 'T'));
        if (Number.isNaN(parsedDate.getTime())) {
            setError("We couldn't read everything — fill in the highlighted fields.");
            set({ missingFields: [...new Set([...draft.missingFields, 'startDate'])] });
            return;
        }

        const lineup = draft.lineup
            .split(',')
            .map((raw) => raw.trim())
            .filter(Boolean)
            .map((raw) => ({
                name: raw.replace(/^\*/, '').trim(),
                isHeadliner: raw.startsWith('*'),
            }));

        const result = await confirm({
            input: {
                sourceUrl: draft.sourceUrl,
                name: draft.name,
                startDate: parsedDate.toISOString(),
                cityId: draft.cityId,
                venueName: draft.venueName,
                venueAddress: draft.venueAddress,
                externalTicketUrl: draft.ticketUrl,
                description: draft.description || undefined,
                curatorNote: draft.curatorNote || undefined,
                lineup,
                genreSlugs: draft.genreSlugs,
            },
        });

        const message = result.error?.graphQLErrors[0]?.message;
        if (message) {
            setError(message);
            return;
        }

        setSaved(result.data?.confirmCuratedEvent?.slug ?? null);
        setDraft(null);
        setUrl('');
    };

    const missing = (field: string) => draft?.missingFields.includes(field);

    const field = (
        label: string,
        key: keyof Draft,
        placeholder: string,
        multiline = false
    ) => (
        <View className='gap-1'>
            <Text
                className={`text-[11px] uppercase tracking-widest font-bold ${
                    missing(key as string) ? 'text-warning' : 'text-muted-foreground'
                }`}
            >
                {label}
                {missing(key as string) ? ' — needs you' : ''}
            </Text>
            <TextInput
                value={String(draft?.[key] ?? '')}
                onChangeText={(v) => set({ [key]: v } as Partial<Draft>)}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                multiline={multiline}
                className={`border bg-secondary px-4 rounded-[4px] text-foreground ${
                    multiline ? 'py-3 min-h-[80px]' : 'h-12'
                } ${missing(key as string) ? 'border-warning' : 'border-border'}`}
            />
        </View>
    );

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}>
                <Pressable onPress={() => router.back()} className='pt-4'>
                    <Text className='text-[12px] uppercase tracking-widest text-muted-foreground'>
                        ← Back
                    </Text>
                </Pressable>

                <Text className='mt-4 text-[32px] font-bold uppercase tracking-tight text-foreground'>
                    Curate
                </Text>
                <Text className='mt-2 text-[14px] text-muted-foreground'>
                    Paste a link to an event. We read the facts — the write-up is yours.
                </Text>

                <View className='mt-6 gap-2'>
                    <TextInput
                        value={url}
                        onChangeText={setUrl}
                        placeholder='https://…'
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize='none'
                        className='border border-border bg-secondary px-4 h-12 rounded-[4px] text-foreground'
                    />
                    <Pressable
                        onPress={handleExtract}
                        className='bg-primary h-12 items-center justify-center rounded-[4px]'
                    >
                        <Text className='text-primary-foreground text-[13px] font-bold uppercase tracking-widest'>
                            Read the page
                        </Text>
                    </Pressable>
                </View>

                {error && (
                    <View className='mt-4 border border-warning px-4 py-3 rounded-[4px]'>
                        <Text className='text-[13px] text-warning'>{error}</Text>
                    </View>
                )}

                {saved && (
                    <View className='mt-4 border border-primary px-4 py-3 rounded-[4px]'>
                        <Text className='text-[13px] text-primary font-bold'>Listed.</Text>
                        <Pressable onPress={() => router.push(`/e/${saved}` as never)}>
                            <Text className='text-[13px] text-muted-foreground mt-1'>
                                View the listing →
                            </Text>
                        </Pressable>
                    </View>
                )}

                {draft && (
                    <View className='mt-8 gap-4'>
                        <Text className='text-[11px] uppercase tracking-widest text-primary font-bold'>
                            Review before listing
                        </Text>

                        {field('Event name', 'name', 'Bunker 012')}
                        {field('Starts', 'startDate', '2026-09-12 23:00')}
                        {field('Venue', 'venueName', 'Galpão Zona Leste')}
                        {field('Address', 'venueAddress', 'Av. Celso Garcia 2200')}
                        {field('Tickets sold at', 'ticketUrl', 'https://…')}
                        {field('Line-up', 'lineup', 'Ana Vega, Dux  (prefix * for headliner)')}

                        <View className='gap-1'>
                            <Text className='text-[11px] uppercase tracking-widest text-muted-foreground font-bold'>
                                City
                            </Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {cities.map((c: { id: string; name: string }) => (
                                    <Pressable
                                        key={c.id}
                                        onPress={() => set({ cityId: c.id })}
                                        className={`px-3 py-1.5 rounded-sm ${
                                            draft.cityId === c.id
                                                ? 'bg-primary'
                                                : 'border border-muted-foreground'
                                        }`}
                                    >
                                        <Text
                                            className={`text-[11px] uppercase font-bold tracking-wide ${
                                                draft.cityId === c.id
                                                    ? 'text-primary-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {c.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View className='gap-1'>
                            <Text className='text-[11px] uppercase tracking-widest text-muted-foreground font-bold'>
                                Genres
                            </Text>
                            <View className='flex-row flex-wrap gap-2'>
                                {genres.map((g: { id: string; name: string; slug: string }) => {
                                    const on = draft.genreSlugs.includes(g.slug);
                                    return (
                                        <Pressable
                                            key={g.id}
                                            onPress={() =>
                                                set({
                                                    genreSlugs: on
                                                        ? draft.genreSlugs.filter(
                                                              (s) => s !== g.slug
                                                          )
                                                        : [...draft.genreSlugs, g.slug],
                                                })
                                            }
                                            className={`px-3 py-1.5 rounded-sm ${
                                                on ? 'bg-primary' : 'border border-muted-foreground'
                                            }`}
                                        >
                                            <Text
                                                className={`text-[11px] uppercase font-bold tracking-wide ${
                                                    on
                                                        ? 'text-primary-foreground'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {g.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {field('Your note', 'curatorNote', 'Why this one matters…', true)}
                        {field('Description (ours, not theirs)', 'description', 'Optional', true)}

                        <Pressable
                            onPress={handleConfirm}
                            className='bg-primary h-14 items-center justify-center rounded-[4px] mt-2'
                        >
                            <Text className='text-primary-foreground text-[13px] font-bold uppercase tracking-widest'>
                                List this event
                            </Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
