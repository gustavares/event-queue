import * as React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { useThemeColors } from '~/lib/useThemeColors';
import {
    PUBLISH_EVENT_MUTATION,
    UNPUBLISH_EVENT_MUTATION,
    SET_CURATOR_NOTE_MUTATION,
    CITIES_QUERY,
} from '~/lib/graphql/operations/discovery';

interface City {
    id: string;
    name: string;
}

interface PublishPanelProps {
    eventId: string;
    status: string;
    /** The event's venue city, when it has one — publishing needs no city picker then. */
    venueCityName?: string | null;
    hasVenueCity: boolean;
    /** Set once the event is public; drives the unpublish/edit affordances. */
    publicSlug?: string | null;
    curatorNote?: string | null;
    /** Curator-only controls are hidden for a plain Manager. */
    isCurator?: boolean;
    onChanged: () => void;
}

/**
 * Manager publishing (AC-27/AC-28) and the curator's note (AC-24).
 *
 * These mutations shipped with no UI at all, so an event could only be published through the
 * API — which meant the two halves of the product were not actually connected.
 */
export function PublishPanel({
    eventId,
    status,
    venueCityName,
    hasVenueCity,
    publicSlug,
    curatorNote,
    isCurator = false,
    onChanged,
}: PublishPanelProps) {
    const router = useRouter();
    const colors = useThemeColors();
    const [cityId, setCityId] = React.useState('');
    const [note, setNote] = React.useState(curatorNote ?? '');
    const [error, setError] = React.useState<string | null>(null);
    const [busy, setBusy] = React.useState(false);

    const [{ data: cityData }] = useQuery({ query: CITIES_QUERY, pause: hasVenueCity });
    const [, publish] = useMutation(PUBLISH_EVENT_MUTATION);
    const [, unpublish] = useMutation(UNPUBLISH_EVENT_MUTATION);
    const [, saveNote] = useMutation(SET_CURATOR_NOTE_MUTATION);

    const cities: City[] = cityData?.cities ?? [];
    const isPublic = Boolean(publicSlug);
    const isDraft = status === 'DRAFT';

    const run = async (fn: () => Promise<{ error?: { graphQLErrors: { message: string }[] } }>) => {
        setError(null);
        setBusy(true);
        const result = await fn();
        setBusy(false);
        if (result.error) {
            setError(
                result.error.graphQLErrors[0]?.message ??
                    "Something went wrong. Check your connection and try again."
            );
            return false;
        }
        onChanged();
        return true;
    };

    return (
        <View className='border border-border bg-card rounded-[4px] px-5 py-5 gap-3'>
            <View className='flex-row items-center justify-between'>
                <Text className='text-[11px] uppercase tracking-widest text-primary font-bold'>
                    Public listing
                </Text>
                <Text
                    className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-[2px] ${
                        isPublic
                            ? 'bg-status-active text-primary-foreground'
                            : 'border border-status-draft text-status-draft'
                    }`}
                >
                    {isPublic ? 'Listed' : 'Not listed'}
                </Text>
            </View>

            {isDraft && (
                <Text className='text-[13px] text-muted-foreground'>
                    Publish the event to your team before listing it publicly.
                </Text>
            )}

            {!isDraft && !isPublic && (
                <>
                    <Text className='text-[13px] text-muted-foreground'>
                        {hasVenueCity
                            ? `This will appear on the ${venueCityName} listing for anyone to find.`
                            : 'This event has no venue city — choose where it should be listed.'}
                    </Text>

                    {!hasVenueCity && (
                        <View className='flex-row flex-wrap gap-2'>
                            {cities.map((c) => (
                                <Pressable
                                    key={c.id}
                                    onPress={() => setCityId(c.id)}
                                    className={`px-3 py-1.5 rounded-sm ${
                                        cityId === c.id
                                            ? 'bg-primary'
                                            : 'border border-muted-foreground'
                                    }`}
                                >
                                    <Text
                                        className={`text-[11px] uppercase font-bold tracking-wide ${
                                            cityId === c.id
                                                ? 'text-primary-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {c.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    <Pressable
                        disabled={busy}
                        onPress={() =>
                            run(() =>
                                publish({ id: eventId, cityId: cityId || undefined })
                            )
                        }
                        className='bg-primary h-12 items-center justify-center rounded-[4px]'
                    >
                        <Text className='text-primary-foreground text-[13px] font-bold uppercase tracking-widest'>
                            {busy ? 'Publishing…' : 'Publish to the listing'}
                        </Text>
                    </Pressable>
                </>
            )}

            {isPublic && (
                <>
                    <Pressable onPress={() => router.push(`/e/${publicSlug}` as never)}>
                        <Text className='text-[13px] text-primary'>
                            View the public page →
                        </Text>
                    </Pressable>

                    {isCurator && (
                        <View className='gap-2 mt-1'>
                            <Text className='text-[11px] uppercase tracking-widest text-muted-foreground font-bold'>
                                Curator note
                            </Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder='Why this one matters…'
                                placeholderTextColor={colors.mutedForeground}
                                multiline
                                className='border border-border bg-secondary px-4 py-3 min-h-[72px] rounded-[4px] text-foreground'
                            />
                            <Pressable
                                disabled={busy}
                                onPress={() => run(() => saveNote({ eventId, note }))}
                                className='border border-primary h-11 items-center justify-center rounded-[4px]'
                            >
                                <Text className='text-primary text-[12px] font-bold uppercase tracking-widest'>
                                    Save note
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    <Pressable
                        disabled={busy}
                        onPress={() => run(() => unpublish({ id: eventId }))}
                        className='h-11 items-center justify-center'
                    >
                        <Text className='text-[12px] uppercase tracking-widest text-destructive'>
                            Remove from the listing
                        </Text>
                    </Pressable>
                </>
            )}

            {error && <Text className='text-[13px] text-destructive'>{error}</Text>}
        </View>
    );
}
