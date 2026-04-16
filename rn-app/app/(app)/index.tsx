import * as React from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Pressable,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { EmptyState } from '~/components/ui/empty-state';
import { FloatingActionButton } from '~/components/ui/floating-action-button';
import { EventCard } from '~/components/ui/event-card';
import { useAuthStore } from '~/stores/auth.store';
import { MY_EVENTS_QUERY } from '~/lib/graphql/operations/events';

const STATUS_FILTERS = ['ALL', 'DRAFT', 'ACTIVE', 'FINISHED', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function MyEventsScreen() {
    const router = useRouter();
    const { clearAuth } = useAuthStore();
    const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>('ALL');
    const [refreshing, setRefreshing] = React.useState(false);

    const [{ data, fetching }, reExecute] = useQuery({
        query: MY_EVENTS_QUERY,
        requestPolicy: 'cache-and-network',
    });

    useFocusEffect(
        React.useCallback(() => {
            reExecute({ requestPolicy: 'network-only' });
        }, [reExecute])
    );

    const allEvents = data?.myEvents ?? [];
    const filteredEvents =
        selectedStatus === 'ALL'
            ? allEvents
            : allEvents.filter((e: any) => e.status === selectedStatus);

    const handleRefresh = React.useCallback(() => {
        setRefreshing(true);
        reExecute({ requestPolicy: 'network-only' });
        setRefreshing(false);
    }, [reExecute]);

    return (
        <SafeAreaView className='flex-1 bg-[#1a1a2e]'>
            {/* Header */}
            <View className='flex-row items-start justify-between px-6 pt-4 pb-2'>
                <View className='flex-1'>
                    <Text className='text-[32px] font-bold uppercase tracking-widest text-white leading-tight'>
                        MY EVENTS
                    </Text>
                    <Text className='text-[12px] uppercase tracking-wide text-[#64748b] mt-1'>
                        {allEvents.length} EVENT{allEvents.length !== 1 ? 'S' : ''}
                    </Text>
                </View>
                <Pressable onPress={clearAuth} className='pt-2'>
                    <Text className='text-[12px] uppercase tracking-wide text-[#64748b]'>
                        Sign Out
                    </Text>
                </Pressable>
            </View>

            {/* Status filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingVertical: 8 }}
            >
                {STATUS_FILTERS.map((status) => {
                    const isActive = selectedStatus === status;
                    return (
                        <Pressable
                            key={status}
                            onPress={() => setSelectedStatus(status)}
                            className={`rounded-sm px-3 py-1.5 ${isActive ? 'bg-[#00838f]' : 'border border-[#64748b]'}`}
                        >
                            <Text
                                className={`text-[11px] uppercase font-bold tracking-wide ${isActive ? 'text-white' : 'text-[#64748b]'}`}
                            >
                                {status}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Event list */}
            <ScrollView
                className='flex-1'
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 100,
                    gap: 12,
                    flexGrow: 1,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing || fetching}
                        onRefresh={handleRefresh}
                        tintColor='#00838f'
                    />
                }
            >
                {filteredEvents.length === 0 && !fetching ? (
                    <View className='flex-1 items-center justify-center pt-16'>
                        <EmptyState
                            icon='calendar'
                            title='No events yet'
                            subtitle={
                                selectedStatus === 'ALL'
                                    ? 'Create your first event to get started'
                                    : `No ${selectedStatus.toLowerCase()} events`
                            }
                        />
                    </View>
                ) : (
                    filteredEvents.map((event: any) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onPress={() => router.push(`/(app)/events/${event.id}` as any)}
                        />
                    ))
                )}
            </ScrollView>

            {/* FAB */}
            <FloatingActionButton onPress={() => router.push('/(app)/events/create' as any)} />
        </SafeAreaView>
    );
}
