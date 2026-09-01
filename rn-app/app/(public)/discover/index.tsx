import * as React from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'urql';
import { Text } from '~/components/ui/text';
import { CITIES_QUERY } from '~/lib/graphql/operations/discovery';

interface City {
    id: string;
    name: string;
    state: string;
    slug: string;
}

/**
 * Discovery home — pick a city.
 *
 * The first screen anyone who isn't a customer ever sees, so it carries the
 * positioning rather than a generic welcome.
 */
export default function DiscoveryHomeScreen() {
    const router = useRouter();
    const [{ data, fetching, error }] = useQuery({ query: CITIES_QUERY });
    const cities: City[] = data?.cities ?? [];

    return (
        <SafeAreaView className='flex-1 bg-background'>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 64 }}>
                <View className='pt-10 pb-8'>
                    <Text className='text-[11px] uppercase tracking-widest text-primary font-bold'>
                        Event Queue
                    </Text>
                    <Text className='mt-3 text-[40px] font-bold leading-[1.05] text-foreground'>
                        WHAT'S ON{'\n'}TONIGHT
                    </Text>
                    <Text className='mt-4 text-[15px] leading-6 text-muted-foreground max-w-[46ch]'>
                        Every night worth going to, in one place — including the ones we don't
                        sell tickets for.
                    </Text>
                </View>

                <Text className='text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-3'>
                    Choose a city
                </Text>

                {fetching && (
                    <Text className='text-muted-foreground text-[14px]'>Loading cities…</Text>
                )}

                {error && (
                    <Text className='text-destructive text-[14px]'>
                        We couldn't load the cities. Try again in a moment.
                    </Text>
                )}

                <View className='gap-2'>
                    {cities.map((city) => (
                        <Pressable
                            key={city.id}
                            onPress={() => router.push(`/discover/${city.slug}` as never)}
                            className='flex-row items-center justify-between border border-border bg-card px-5 py-5 rounded-[4px]'
                        >
                            <View>
                                <Text className='text-[20px] font-bold text-foreground'>
                                    {city.name}
                                </Text>
                                <Text className='text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                                    {city.state}
                                </Text>
                            </View>
                            <Text className='text-[20px] text-primary'>→</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable
                    onPress={() => router.push('/(auth)/sign-in' as never)}
                    className='mt-10 self-start'
                >
                    <Text className='text-[12px] uppercase tracking-widest text-muted-foreground'>
                        Run events? Sign in →
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
