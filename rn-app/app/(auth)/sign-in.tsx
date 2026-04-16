import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native';
import { Link } from 'expo-router';
import { useMutation } from 'urql';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { SIGN_IN_MUTATION } from '~/lib/graphql/operations/auth';
import { useAuthStore } from '~/stores/auth.store';

export default function SignInScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [{ fetching }, signIn] = useMutation(SIGN_IN_MUTATION);
    const { setAuth } = useAuthStore();

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        const result = await signIn({ input: { email, password } });

        if (result.error) {
            Alert.alert('Error', result.error.message);
            return;
        }

        if (result.data?.signIn) {
            const { token, user } = result.data.signIn;
            setAuth(token, user);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-6"
            >
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-center mb-2">Welcome back</Text>
                    <Text className="text-muted-foreground text-center">Sign in to your account</Text>
                </View>

                <View className="gap-4">
                    <Input
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                    <Input
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                    />
                    <Button onPress={handleSignIn} disabled={fetching}>
                        <Text className="text-primary-foreground font-medium">
                            {fetching ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </Button>
                </View>

                <View className="flex-row justify-center mt-6">
                    <Text className="text-muted-foreground">Don't have an account? </Text>
                    <Link href="/(auth)/sign-up">
                        <Text className="text-primary font-medium">Sign Up</Text>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
