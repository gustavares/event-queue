import * as React from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'urql';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { SectionHeader } from '~/components/ui/section-header';
import { ToggleGroup } from '~/components/ui/toggle-group';
import { TierRow } from '~/components/ui/tier-row';
import {
    GET_EVENT_QUERY,
    UPDATE_EVENT_MUTATION,
    ADD_DOOR_SALE_TIER_MUTATION,
    UPDATE_DOOR_SALE_TIER_MUTATION,
    REMOVE_DOOR_SALE_TIER_MUTATION,
} from '~/lib/graphql/operations/events';
import { VENUES_QUERY, CREATE_VENUE_MUTATION } from '~/lib/graphql/operations/venues';

type Tier = { id?: string; name: string; price: string };

const toDateString = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const toTimeString = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
};

export default function EditEventScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [initialized, setInitialized] = React.useState(false);

    // Form state
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [locationMode, setLocationMode] = React.useState<'venue' | 'custom'>('venue');
    const [selectedVenue, setSelectedVenue] = React.useState<any>(null);
    const [locationName, setLocationName] = React.useState('');
    const [locationAddress, setLocationAddress] = React.useState('');
    const [startDate, setStartDate] = React.useState('');
    const [startTime, setStartTime] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [endTime, setEndTime] = React.useState('');
    const [doorSalesEnabled, setDoorSalesEnabled] = React.useState(false);
    const [tiers, setTiers] = React.useState<Tier[]>([]);

    // Venue picker modal
    const [venueModalVisible, setVenueModalVisible] = React.useState(false);
    const [venueSearch, setVenueSearch] = React.useState('');
    const [showCreateVenue, setShowCreateVenue] = React.useState(false);
    const [newVenueName, setNewVenueName] = React.useState('');
    const [newVenueAddress, setNewVenueAddress] = React.useState('');
    const [newVenueCapacity, setNewVenueCapacity] = React.useState('');

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    const [{ data: eventData, fetching: eventFetching }] = useQuery({
        query: GET_EVENT_QUERY,
        variables: { id },
        requestPolicy: 'cache-and-network',
    });

    const [{ data: venuesData }] = useQuery({ query: VENUES_QUERY });
    const [, updateEvent] = useMutation(UPDATE_EVENT_MUTATION);
    const [, addTier] = useMutation(ADD_DOOR_SALE_TIER_MUTATION);
    const [, updateTierMutation] = useMutation(UPDATE_DOOR_SALE_TIER_MUTATION);
    const [, removeTier] = useMutation(REMOVE_DOOR_SALE_TIER_MUTATION);
    const [, createVenue] = useMutation(CREATE_VENUE_MUTATION);

    // Pre-fill form once data loads
    React.useEffect(() => {
        if (initialized || !eventData?.event) return;
        const ev = eventData.event;
        setName(ev.name ?? '');
        setDescription(ev.description ?? '');
        if (ev.venue) {
            setLocationMode('venue');
            setSelectedVenue(ev.venue);
        } else if (ev.locationName) {
            setLocationMode('custom');
            setLocationName(ev.locationName ?? '');
            setLocationAddress(ev.locationAddress ?? '');
        }
        setStartDate(toDateString(ev.startDate));
        setStartTime(toTimeString(ev.startDate));
        setEndDate(toDateString(ev.endDate));
        setEndTime(toTimeString(ev.endDate));
        if (ev.doorSaleTiers && ev.doorSaleTiers.length > 0) {
            setDoorSalesEnabled(true);
            setTiers(
                ev.doorSaleTiers.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    price: String(t.price),
                }))
            );
        } else {
            setTiers([{ name: '', price: '' }]);
        }
        setInitialized(true);
    }, [eventData, initialized]);

    const venues = venuesData?.venues ?? [];
    const filteredVenues = venues.filter((v: any) =>
        v.name.toLowerCase().includes(venueSearch.toLowerCase())
    );

    const buildDateTime = (date: string, time: string): string | null => {
        if (!date) return null;
        const t = time || '00:00';
        return new Date(`${date}T${t}:00`).toISOString();
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Event name is required';
        if (!startDate.trim()) e.startDate = 'Start date is required';
        if (locationMode === 'custom' && !locationName.trim())
            e.locationName = 'Location name is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCreateVenue = async () => {
        if (!newVenueName.trim()) return;
        const result = await createVenue({
            input: {
                name: newVenueName,
                address: newVenueAddress || undefined,
                capacity: newVenueCapacity ? parseInt(newVenueCapacity, 10) : undefined,
            },
        });
        if (result.data?.createVenue) {
            setSelectedVenue(result.data.createVenue);
            setShowCreateVenue(false);
            setVenueModalVisible(false);
            setNewVenueName('');
            setNewVenueAddress('');
            setNewVenueCapacity('');
        }
    };

    const handleSubmit = async () => {
        if (!validate() || submitting) return;
        setSubmitting(true);

        const startISO = buildDateTime(startDate, startTime);
        const endISO = buildDateTime(endDate, endTime);

        const input: any = {
            name: name.trim(),
            description: description.trim() || undefined,
            startDate: startISO,
            endDate: endISO || undefined,
        };

        if (locationMode === 'venue' && selectedVenue) {
            input.venueId = selectedVenue.id;
        } else if (locationMode === 'custom') {
            input.venueId = null;
            input.locationName = locationName.trim();
            input.locationAddress = locationAddress.trim() || undefined;
        }

        const result = await updateEvent({ eventId: id, input });
        if (result.error || !result.data?.updateEvent) {
            setSubmitting(false);
            return;
        }

        // Sync tiers
        if (doorSalesEnabled) {
            const originalTiers: Tier[] = eventData?.event?.doorSaleTiers?.map((t: any) => ({
                id: t.id,
                name: t.name,
                price: String(t.price),
            })) ?? [];

            const originalIds = new Set(originalTiers.map((t) => t.id));
            const currentIds = new Set(tiers.filter((t) => t.id).map((t) => t.id));

            // Remove deleted tiers
            for (const orig of originalTiers) {
                if (!currentIds.has(orig.id)) {
                    await removeTier({ tierId: orig.id });
                }
            }

            for (const tier of tiers) {
                if (!tier.name.trim() || !tier.price.trim()) continue;
                if (tier.id && originalIds.has(tier.id)) {
                    await updateTierMutation({
                        tierId: tier.id,
                        input: { name: tier.name.trim(), price: parseFloat(tier.price) },
                    });
                } else {
                    await addTier({
                        eventId: id,
                        input: { name: tier.name.trim(), price: parseFloat(tier.price) },
                    });
                }
            }
        } else {
            // Remove all tiers if door sales disabled
            const originalTiers = eventData?.event?.doorSaleTiers ?? [];
            for (const tier of originalTiers) {
                await removeTier({ tierId: tier.id });
            }
        }

        router.back();
    };

    const addTierRow = () => setTiers((prev) => [...prev, { name: '', price: '' }]);
    const removeTierRow = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));
    const updateTierName = (i: number, val: string) =>
        setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, name: val } : t)));
    const updateTierPrice = (i: number, val: string) =>
        setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, price: val } : t)));

    if (eventFetching && !initialized) {
        return (
            <SafeAreaView className='flex-1 bg-[#1a1a2e] items-center justify-center'>
                <Text className='text-[#64748b]'>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-[#1a1a2e]'>
            <KeyboardAvoidingView
                className='flex-1'
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className='flex-1'
                    contentContainerStyle={{ paddingBottom: 48 }}
                    keyboardShouldPersistTaps='handled'
                >
                    {/* Header */}
                    <View className='flex-row items-center px-6 pt-4 pb-6'>
                        <Pressable onPress={() => router.back()} className='mr-4'>
                            <Text className='text-[24px] text-[#64748b]'>←</Text>
                        </Pressable>
                        <Text className='flex-1 text-center text-[24px] font-bold uppercase tracking-widest text-white mr-8'>
                            EDIT EVENT
                        </Text>
                    </View>

                    {/* DETAILS */}
                    <View className='px-6 gap-3'>
                        <SectionHeader title='DETAILS' />
                        <Input
                            placeholder='Event name'
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor='#64748b'
                        />
                        {errors.name ? (
                            <Text className='text-red-400 text-[12px] -mt-1'>{errors.name}</Text>
                        ) : null}
                        <Input
                            placeholder='Description (optional)'
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical='top'
                            placeholderTextColor='#64748b'
                            style={{ minHeight: 96 }}
                        />
                    </View>

                    {/* LOCATION */}
                    <View className='px-6 mt-6 gap-3'>
                        <SectionHeader title='LOCATION' />
                        <ToggleGroup
                            options={['Select Venue', 'Custom Location']}
                            selected={locationMode === 'venue' ? 0 : 1}
                            onChange={(idx) =>
                                setLocationMode(idx === 0 ? 'venue' : 'custom')
                            }
                        />
                        {locationMode === 'venue' ? (
                            <Pressable
                                onPress={() => setVenueModalVisible(true)}
                                className='border border-[#64748b]/40 rounded-[4px] px-4 py-3'
                            >
                                <Text
                                    className={
                                        selectedVenue ? 'text-white' : 'text-[#64748b]'
                                    }
                                >
                                    {selectedVenue ? selectedVenue.name : 'Tap to select venue'}
                                </Text>
                            </Pressable>
                        ) : (
                            <>
                                <Input
                                    placeholder='Location name'
                                    value={locationName}
                                    onChangeText={setLocationName}
                                    placeholderTextColor='#64748b'
                                />
                                {errors.locationName ? (
                                    <Text className='text-red-400 text-[12px] -mt-1'>
                                        {errors.locationName}
                                    </Text>
                                ) : null}
                                <Input
                                    placeholder='Address (optional)'
                                    value={locationAddress}
                                    onChangeText={setLocationAddress}
                                    placeholderTextColor='#64748b'
                                />
                            </>
                        )}
                    </View>

                    {/* SCHEDULE */}
                    <View className='px-6 mt-6 gap-3'>
                        <SectionHeader title='SCHEDULE' />
                        <View className='gap-2'>
                            <Text className='text-[11px] uppercase tracking-wide text-[#64748b]'>
                                Start
                            </Text>
                            <View className='flex-row gap-2'>
                                <View className='flex-1'>
                                    <Input
                                        placeholder='YYYY-MM-DD'
                                        value={startDate}
                                        onChangeText={setStartDate}
                                        placeholderTextColor='#64748b'
                                        keyboardType='numbers-and-punctuation'
                                    />
                                </View>
                                <View className='w-28'>
                                    <Input
                                        placeholder='HH:MM'
                                        value={startTime}
                                        onChangeText={setStartTime}
                                        placeholderTextColor='#64748b'
                                        keyboardType='numbers-and-punctuation'
                                    />
                                </View>
                            </View>
                            {errors.startDate ? (
                                <Text className='text-red-400 text-[12px]'>
                                    {errors.startDate}
                                </Text>
                            ) : null}
                        </View>
                        <View className='gap-2'>
                            <Text className='text-[11px] uppercase tracking-wide text-[#64748b]'>
                                End (optional)
                            </Text>
                            <View className='flex-row gap-2'>
                                <View className='flex-1'>
                                    <Input
                                        placeholder='YYYY-MM-DD'
                                        value={endDate}
                                        onChangeText={setEndDate}
                                        placeholderTextColor='#64748b'
                                        keyboardType='numbers-and-punctuation'
                                    />
                                </View>
                                <View className='w-28'>
                                    <Input
                                        placeholder='HH:MM'
                                        value={endTime}
                                        onChangeText={setEndTime}
                                        placeholderTextColor='#64748b'
                                        keyboardType='numbers-and-punctuation'
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* DOOR SALES */}
                    <View className='px-6 mt-6 gap-3'>
                        <SectionHeader title='DOOR SALES' />
                        <View className='flex-row items-center justify-between'>
                            <Text className='text-white text-[14px]'>Enable door sales</Text>
                            <Switch
                                value={doorSalesEnabled}
                                onValueChange={setDoorSalesEnabled}
                                trackColor={{ false: 'rgba(100,116,139,0.3)', true: '#00838f' }}
                                thumbColor='#ffffff'
                            />
                        </View>
                        {doorSalesEnabled && (
                            <View className='gap-2 mt-1'>
                                {tiers.map((tier, i) => (
                                    <TierRow
                                        key={tier.id ?? i}
                                        name={tier.name}
                                        price={tier.price}
                                        onNameChange={(val) => updateTierName(i, val)}
                                        onPriceChange={(val) => updateTierPrice(i, val)}
                                        onRemove={() => removeTierRow(i)}
                                    />
                                ))}
                                <Pressable
                                    onPress={addTierRow}
                                    className='border border-dashed border-[#64748b] rounded-[4px] py-3 items-center mt-1'
                                >
                                    <Text className='text-[#64748b] text-[12px] uppercase font-bold tracking-wide'>
                                        + ADD TIER
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Submit */}
                    <View className='px-6 mt-8'>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting}
                            className='h-14 bg-[#00838f] rounded-[4px] items-center justify-center'
                            style={{ opacity: submitting ? 0.6 : 1 }}
                        >
                            <Text className='text-white font-bold uppercase tracking-wide text-[14px]'>
                                {submitting ? 'SAVING...' : 'SAVE CHANGES'}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Venue Picker Modal */}
            <Modal
                visible={venueModalVisible}
                animationType='slide'
                presentationStyle='pageSheet'
                onRequestClose={() => setVenueModalVisible(false)}
            >
                <View className='flex-1 bg-[#1a1a2e]'>
                    <View className='flex-row items-center justify-between px-6 pt-6 pb-4'>
                        <Text className='text-[18px] font-bold uppercase tracking-widest text-white'>
                            SELECT VENUE
                        </Text>
                        <Pressable onPress={() => setVenueModalVisible(false)}>
                            <Text className='text-[#64748b] text-[14px]'>Cancel</Text>
                        </Pressable>
                    </View>
                    <View className='px-6 pb-4'>
                        <Input
                            placeholder='Search venues...'
                            value={venueSearch}
                            onChangeText={setVenueSearch}
                            placeholderTextColor='#64748b'
                        />
                    </View>
                    <FlatList
                        data={filteredVenues}
                        keyExtractor={(item: any) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                        renderItem={({ item }: { item: any }) => (
                            <Pressable
                                onPress={() => {
                                    setSelectedVenue(item);
                                    setVenueModalVisible(false);
                                }}
                                className='border border-[#64748b]/30 rounded-[4px] px-4 py-3'
                            >
                                <Text className='text-white font-medium'>{item.name}</Text>
                                {item.address ? (
                                    <Text className='text-[#64748b] text-[12px] mt-0.5'>
                                        {item.address}
                                    </Text>
                                ) : null}
                            </Pressable>
                        )}
                        ListEmptyComponent={
                            <Text className='text-[#64748b] text-center py-8'>
                                No venues found
                            </Text>
                        }
                        ListFooterComponent={
                            <View className='mt-4'>
                                {showCreateVenue ? (
                                    <View className='gap-3 border border-[#00838f]/40 rounded-[4px] p-4'>
                                        <Text className='text-[11px] uppercase tracking-wide text-[#00838f] font-bold'>
                                            NEW VENUE
                                        </Text>
                                        <Input
                                            placeholder='Venue name *'
                                            value={newVenueName}
                                            onChangeText={setNewVenueName}
                                            placeholderTextColor='#64748b'
                                        />
                                        <Input
                                            placeholder='Address (optional)'
                                            value={newVenueAddress}
                                            onChangeText={setNewVenueAddress}
                                            placeholderTextColor='#64748b'
                                        />
                                        <Input
                                            placeholder='Capacity (optional)'
                                            value={newVenueCapacity}
                                            onChangeText={setNewVenueCapacity}
                                            keyboardType='numeric'
                                            placeholderTextColor='#64748b'
                                        />
                                        <View className='flex-row gap-2'>
                                            <Pressable
                                                onPress={() => setShowCreateVenue(false)}
                                                className='flex-1 border border-[#64748b] rounded-[4px] py-3 items-center'
                                            >
                                                <Text className='text-[#64748b] text-[12px] uppercase font-bold'>
                                                    CANCEL
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={handleCreateVenue}
                                                className='flex-1 bg-[#00838f] rounded-[4px] py-3 items-center'
                                            >
                                                <Text className='text-white text-[12px] uppercase font-bold'>
                                                    CREATE
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={() => setShowCreateVenue(true)}
                                        className='border border-dashed border-[#64748b] rounded-[4px] py-3 items-center'
                                    >
                                        <Text className='text-[#64748b] text-[12px] uppercase font-bold tracking-wide'>
                                            + CREATE NEW VENUE
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        }
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
}
