import * as React from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation } from 'urql';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/ui/status-badge';
import { SectionHeader } from '~/components/ui/section-header';
import { ConfirmDialog } from '~/components/ui/confirm-dialog';
import {
    GET_EVENT_QUERY,
    TRANSITION_EVENT_STATUS_MUTATION,
    DELETE_EVENT_MUTATION,
} from '~/lib/graphql/operations/events';

type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });

const formatDateRange = (start: string, end?: string) => {
    if (!end) return `${formatDate(start)} · ${formatTime(start)}`;
    return `${formatDate(start)} ${formatTime(start)} → ${formatDate(end)} ${formatTime(end)}`;
};

export default function EventDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [confirmDialog, setConfirmDialog] = React.useState<{
        visible: boolean;
        type: 'cancel' | 'delete' | 'publish' | 'close' | 'reopen' | null;
    }>({ visible: false, type: null });

    const [{ data, fetching }, reExecute] = useQuery({
        query: GET_EVENT_QUERY,
        variables: { id },
        requestPolicy: 'cache-and-network',
    });

    useFocusEffect(
        React.useCallback(() => {
            reExecute({ requestPolicy: 'network-only' });
        }, [reExecute])
    );

    const [, transitionStatus] = useMutation(TRANSITION_EVENT_STATUS_MUTATION);
    const [, deleteEvent] = useMutation(DELETE_EVENT_MUTATION);

    const event = data?.event;

    const handleTransition = async (toStatus: EventStatus) => {
        await transitionStatus({ id, status: toStatus });
        reExecute({ requestPolicy: 'network-only' });
        setConfirmDialog({ visible: false, type: null });
    };

    const handleDelete = async () => {
        await deleteEvent({ id });
        router.replace('/(app)');
    };

    const confirmAction = async () => {
        const t = confirmDialog.type;
        if (t === 'cancel') await handleTransition('CANCELLED');
        else if (t === 'publish') await handleTransition('ACTIVE');
        else if (t === 'close') await handleTransition('FINISHED');
        else if (t === 'reopen') await handleTransition('ACTIVE');
        else if (t === 'delete') await handleDelete();
    };

    const dialogProps = () => {
        switch (confirmDialog.type) {
            case 'cancel':
                return {
                    title: 'Cancel Event?',
                    message: 'This event will be marked as cancelled. Guests will not be notified automatically.',
                    confirmLabel: 'Cancel Event',
                    destructive: true,
                };
            case 'delete':
                return {
                    title: 'Delete Event?',
                    message: 'This action cannot be undone. The event and all its data will be permanently deleted.',
                    confirmLabel: 'Delete',
                    destructive: true,
                };
            case 'publish':
                return {
                    title: 'Publish Event?',
                    message: 'The event will become active and visible.',
                    confirmLabel: 'Publish',
                    destructive: false,
                };
            case 'close':
                return {
                    title: 'Close Event?',
                    message: 'The event will be marked as finished.',
                    confirmLabel: 'Close Event',
                    destructive: false,
                };
            case 'reopen':
                return {
                    title: 'Reopen Event?',
                    message: 'The event will be reactivated.',
                    confirmLabel: 'Reopen',
                    destructive: false,
                };
            default:
                return { title: '', message: '', confirmLabel: 'Confirm', destructive: false };
        }
    };

    if (fetching && !event) {
        return (
            <SafeAreaView className='flex-1 bg-[#1a1a2e] items-center justify-center'>
                <Text className='text-[#64748b]'>Loading...</Text>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView className='flex-1 bg-[#1a1a2e] items-center justify-center'>
                <Text className='text-[#64748b]'>Event not found.</Text>
                <Pressable onPress={() => router.back()} className='mt-4'>
                    <Text className='text-[#00838f]'>Go back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const status: EventStatus = event.status;
    const dp = dialogProps();

    return (
        <SafeAreaView className='flex-1 bg-[#1a1a2e]'>
            <ScrollView
                className='flex-1'
                contentContainerStyle={{ paddingBottom: 160 }}
            >
                {/* Header */}
                <View className='flex-row items-center justify-between px-6 pt-4 pb-4'>
                    <Pressable onPress={() => router.back()}>
                        <Text className='text-[24px] text-[#64748b]'>←</Text>
                    </Pressable>
                    <StatusBadge status={status} />
                </View>

                {/* Title */}
                <View className='px-6 mb-2'>
                    <Text className='text-[28px] font-bold text-white leading-tight'>
                        {event.name}
                    </Text>
                </View>

                {/* Date */}
                {event.startDate && (
                    <View className='px-6 mb-6'>
                        <Text className='text-[14px] text-[#64748b]'>
                            {formatDateRange(event.startDate, event.endDate)}
                        </Text>
                    </View>
                )}

                {/* LOCATION */}
                {(event.venue || event.locationName) && (
                    <View className='px-6 mb-6'>
                        <SectionHeader title='LOCATION' />
                        <View className='mt-3'>
                            <Text className='text-white text-[15px] font-medium'>
                                {event.venue?.name ?? event.locationName}
                            </Text>
                            {(event.venue?.address || event.locationAddress) && (
                                <Text className='text-[#64748b] text-[13px] mt-0.5'>
                                    {event.venue?.address ?? event.locationAddress}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* ABOUT */}
                {event.description && (
                    <View className='px-6 mb-6'>
                        <SectionHeader title='ABOUT' />
                        <Text className='text-[#94a3b8] text-[14px] leading-relaxed mt-3'>
                            {event.description}
                        </Text>
                    </View>
                )}

                {/* DOOR SALES */}
                <View className='px-6 mb-6'>
                    <SectionHeader title='DOOR SALES' />
                    {event.doorSaleTiers && event.doorSaleTiers.length > 0 ? (
                        <View className='mt-3 gap-2'>
                            {event.doorSaleTiers.map((tier: any) => (
                                <View
                                    key={tier.id}
                                    className='flex-row items-center justify-between border border-white/10 rounded-[4px] px-4 py-3'
                                >
                                    <Text className='text-white text-[14px]'>{tier.name}</Text>
                                    <Text className='text-[#00838f] text-[14px] font-bold'>
                                        R$ {Number(tier.price).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text className='text-[#64748b] text-[14px] mt-3'>Not enabled</Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom action bar */}
            <View className='absolute bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10 px-6 pt-4 pb-8'>
                {status === 'DRAFT' && (
                    <>
                        <View className='flex-row gap-3 mb-3'>
                            <Pressable
                                onPress={() => router.push(`/(app)/events/${id}/edit` as any)}
                                className='flex-1 h-12 border border-[#64748b] rounded-[4px] items-center justify-center'
                            >
                                <Text className='text-[#64748b] text-[13px] uppercase font-bold tracking-wide'>
                                    Edit
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setConfirmDialog({ visible: true, type: 'publish' })}
                                className='flex-1 h-12 bg-[#00838f] rounded-[4px] items-center justify-center'
                            >
                                <Text className='text-white text-[13px] uppercase font-bold tracking-wide'>
                                    Publish
                                </Text>
                            </Pressable>
                        </View>
                        <View className='flex-row justify-center gap-6'>
                            <Pressable onPress={() => setConfirmDialog({ visible: true, type: 'cancel' })}>
                                <Text className='text-red-400 text-[12px] uppercase font-bold tracking-wide'>
                                    Cancel Event
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => setConfirmDialog({ visible: true, type: 'delete' })}>
                                <Text className='text-[#64748b] text-[12px] uppercase font-bold tracking-wide'>
                                    Delete
                                </Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {status === 'ACTIVE' && (
                    <>
                        <View className='flex-row gap-3 mb-3'>
                            <Pressable
                                onPress={() => router.push(`/(app)/events/${id}/edit` as any)}
                                className='flex-1 h-12 border border-[#64748b] rounded-[4px] items-center justify-center'
                            >
                                <Text className='text-[#64748b] text-[13px] uppercase font-bold tracking-wide'>
                                    Edit
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setConfirmDialog({ visible: true, type: 'close' })}
                                className='flex-1 h-12 bg-[#1e40af] rounded-[4px] items-center justify-center'
                            >
                                <Text className='text-white text-[13px] uppercase font-bold tracking-wide'>
                                    Close Event
                                </Text>
                            </Pressable>
                        </View>
                        <View className='items-center'>
                            <Pressable onPress={() => setConfirmDialog({ visible: true, type: 'cancel' })}>
                                <Text className='text-red-400 text-[12px] uppercase font-bold tracking-wide'>
                                    Cancel Event
                                </Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {status === 'FINISHED' && (
                    <>
                        <Pressable
                            onPress={() => setConfirmDialog({ visible: true, type: 'reopen' })}
                            className='h-12 border border-[#64748b] rounded-[4px] items-center justify-center mb-3'
                        >
                            <Text className='text-[#64748b] text-[13px] uppercase font-bold tracking-wide'>
                                Reopen Event
                            </Text>
                        </Pressable>
                        <View className='items-center'>
                            <Pressable onPress={() => setConfirmDialog({ visible: true, type: 'delete' })}>
                                <Text className='text-[#64748b] text-[12px] uppercase font-bold tracking-wide'>
                                    Delete
                                </Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {status === 'CANCELLED' && (
                    <View className='items-center'>
                        <Pressable onPress={() => setConfirmDialog({ visible: true, type: 'delete' })}>
                            <Text className='text-[#64748b] text-[12px] uppercase font-bold tracking-wide'>
                                Delete
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>

            <ConfirmDialog
                visible={confirmDialog.visible}
                title={dp.title}
                message={dp.message}
                confirmLabel={dp.confirmLabel}
                destructive={dp.destructive}
                onConfirm={confirmAction}
                onCancel={() => setConfirmDialog({ visible: false, type: null })}
            />
        </SafeAreaView>
    );
}
