import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';

export interface PublicEventSummary {
    id: string;
    slug: string;
    name: string;
    curatorNote: string | null;
    startDate: string;
    status: string;
    source: string;
    venueName: string | null;
    genres: { id: string; name: string; slug: string }[];
    lineup: { position: number; isHeadliner: boolean; artist: { id: string; name: string } }[];
}

function formatTime(value: string): string {
    const d = new Date(value);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * One event in a city listing.
 *
 * The lineup and the curator note carry the weight — they are the two things a listings
 * site has that a ticket page doesn't.
 */
export function PublicEventRow({
    event,
    onPress,
}: {
    event: PublicEventSummary;
    onPress: () => void;
}) {
    const headliners = event.lineup.filter((l) => l.isHeadliner).map((l) => l.artist.name);
    const support = event.lineup.filter((l) => !l.isHeadliner).map((l) => l.artist.name);
    const isCancelled = event.status === 'CANCELLED';

    return (
        <Pressable
            onPress={onPress}
            className='border-b border-border py-5 flex-row gap-4'
        >
            <Text className='font-mono text-[13px] text-primary w-14 pt-1'>
                {formatTime(event.startDate)}
            </Text>

            <View className='flex-1 gap-1'>
                <View className='flex-row items-start gap-2'>
                    <Text
                        className={`flex-1 text-[19px] font-bold leading-6 ${
                            isCancelled ? 'text-muted-foreground' : 'text-foreground'
                        }`}
                    >
                        {event.name}
                    </Text>
                    {isCancelled && (
                        <Text className='text-[10px] uppercase tracking-widest text-status-cancelled border border-status-cancelled px-2 py-0.5 rounded-[2px]'>
                            Cancelled
                        </Text>
                    )}
                </View>

                {event.venueName && (
                    <Text className='text-[13px] text-muted-foreground'>{event.venueName}</Text>
                )}

                {headliners.length > 0 && (
                    <Text className='text-[14px] text-foreground mt-1'>
                        {headliners.join(', ')}
                        {support.length > 0 && (
                            <Text className='text-muted-foreground'>
                                {'  '}
                                {support.join(', ')}
                            </Text>
                        )}
                    </Text>
                )}

                {event.curatorNote && (
                    <Text className='text-[13.5px] italic text-muted-foreground mt-1 leading-5'>
                        {event.curatorNote}
                    </Text>
                )}

                <View className='flex-row flex-wrap gap-1.5 mt-2'>
                    {event.genres.map((g) => (
                        <Text
                            key={g.id}
                            className='text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded-[2px]'
                        >
                            {g.name}
                        </Text>
                    ))}
                    {event.source === 'CURATED' && (
                        <Text className='text-[10px] uppercase tracking-widest text-ink-subtle px-2 py-0.5'>
                            Tickets elsewhere
                        </Text>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
