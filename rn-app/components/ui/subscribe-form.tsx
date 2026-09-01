import * as React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useMutation } from 'urql';
import { Text } from '~/components/ui/text';
import { useThemeColors } from '~/lib/useThemeColors';
import { SUBSCRIBE_MUTATION } from '~/lib/graphql/operations/discovery';

interface SubscribeFormProps {
    citySlug: string;
    cityName: string;
}

/**
 * Newsletter capture (BR-SUB-001..005).
 *
 * Nothing is sent yet — this collects the list. The checkbox is explicit opt-in rather
 * than a pre-ticked box, because LGPD requires consent to be given, not assumed.
 */
export function SubscribeForm({ citySlug, cityName }: SubscribeFormProps) {
    const colors = useThemeColors();
    const [email, setEmail] = React.useState('');
    const [consented, setConsented] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);
    const [, subscribe] = useMutation(SUBSCRIBE_MUTATION);

    const handleSubmit = async () => {
        setError(null);

        if (!consented) {
            setError('Tick the box to confirm you want the list.');
            return;
        }

        const result = await subscribe({ email: email.trim(), citySlug });
        if (result.error) {
            setError(result.error.graphQLErrors[0]?.message ?? 'Something went wrong.');
            return;
        }
        setDone(true);
    };

    if (done) {
        return (
            <View className='border border-primary bg-card px-5 py-5 rounded-[4px]'>
                <Text className='text-[13px] uppercase tracking-widest text-primary font-bold'>
                    You're on the list
                </Text>
                <Text className='mt-2 text-[14px] text-muted-foreground'>
                    We'll send you what's on in {cityName}.
                </Text>
            </View>
        );
    }

    return (
        <View className='border border-border bg-card px-5 py-5 rounded-[4px] gap-3'>
            <Text className='text-[13px] uppercase tracking-widest text-primary font-bold'>
                The {cityName} list
            </Text>
            <Text className='text-[14px] text-muted-foreground'>
                What's worth going to, before it sells out. No account needed.
            </Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='you@email.com'
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize='none'
                keyboardType='email-address'
                className='border border-border bg-secondary px-4 h-12 rounded-[4px] text-foreground'
            />

            <Pressable
                onPress={() => setConsented((v) => !v)}
                className='flex-row items-start gap-3'
            >
                <View
                    className={`h-5 w-5 border rounded-[2px] items-center justify-center ${
                        consented ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                >
                    {consented && (
                        <Text className='text-primary-foreground text-[12px] font-bold'>✓</Text>
                    )}
                </View>
                <Text className='flex-1 text-[13px] text-muted-foreground'>
                    Yes, email me what's on in {cityName}.
                </Text>
            </Pressable>

            {error && <Text className='text-[13px] text-destructive'>{error}</Text>}

            <Pressable
                onPress={handleSubmit}
                className='bg-primary h-12 items-center justify-center rounded-[4px]'
            >
                <Text className='text-primary-foreground text-[13px] font-bold uppercase tracking-widest'>
                    Subscribe
                </Text>
            </Pressable>
        </View>
    );
}
