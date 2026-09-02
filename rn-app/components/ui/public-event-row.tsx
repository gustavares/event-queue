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
    city?: { id: string; name: string; slug: string } | null;
    genres: { id: string; name: string; slug: string }[];
    lineup: { position: number; isHeadliner: boolean; artist: { id: string; name: string } }[];
}

import { formatListingTime, formatShortDate } from '~/lib/datetime';

/**
 * One event in a city listing.
 *
 * The lineup and the curator note carry the weight — they are the two things a listings
 * site has that a ticket page doesn't.
 */
export function PublicEventRow({
    event,
    onPress,
    showDate = false,
}: {
    event: PublicEventSummary;
    onPress: () => void;
    /**
     * Set on lists that are NOT grouped by date — the artist page and the featured picks,
     * where consecutive rows can be weeks apart and a bare time says nothing.
     */
    showDate?: boolean;
}) {
    // The server already returns the lineup in the curator's order (BR-ART-003), so read it
    // in order rather than re-sorting. Splitting on isHeadliner and rendering only the
    // headliners hid the ENTIRE lineup for any event where nobody was flagged — which is the
    // common case for a club night with no billing hierarchy.
    const headliners = event.lineup.filter((l) => l.isHeadliner).map((l) => l.artist.name);
    const support = event.lineup.filter((l) => !l.isHeadliner).map((l) => l.artist.name);
    const hasHeadliner = headliners.length > 0;
    const isCancelled = event.status === 'CANCELLED';

    return (
        <Pressable
            onPress={onPress}
            className='border-b border-border py-5 flex-row gap-4'
        >
            <View className='w-14 pt-1'>
                <Text className='font-mono text-[13px] text-primary'>
                    {formatListingTime(event.startDate)}
                </Text>
                {showDate && (
                    <Text className='font-mono text-[10px] text-muted-foreground mt-0.5'>
                        {formatShortDate(event.startDate)}
                    </Text>
                )}
            </View>

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

                {event.lineup.length > 0 && (
                    <Text className='text-[14px] text-foreground mt-1'>
                        {hasHeadliner ? headliners.join(', ') : support.join(', ')}
                        {hasHeadliner && support.length > 0 && (
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
