import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native';
import { Link } from 'expo-router';
import { useMutation } from 'urql';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { SIGN_UP_MUTATION } from '~/lib/graphql/operations/auth';
import { useAuthStore } from '~/stores/auth.store';

export default function SignUpScreen() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [{ fetching }, signUp] = useMutation(SIGN_UP_MUTATION);
    const { setAuth } = useAuthStore();

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        const result = await signUp({ input: { name, email, password } });

        if (result.error) {
            Alert.alert('Error', result.error.message);
            return;
        }

        if (result.data?.signUp) {
            const { token, user } = result.data.signUp;
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
                    <Text className="text-3xl font-bold text-center mb-2">Create account</Text>
                    <Text className="text-muted-foreground text-center">Sign up to get started</Text>
                </View>

                <View className="gap-4">
                    <Input
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="name"
                    />
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
                        autoComplete="new-password"
                    />
                    <Button onPress={handleSignUp} disabled={fetching}>
                        <Text className="text-primary-foreground font-medium">
                            {fetching ? 'Creating account...' : 'Sign Up'}
                        </Text>
                    </Button>
                </View>

                <View className="flex-row justify-center mt-6">
                    <Text className="text-muted-foreground">Already have an account? </Text>
                    <Link href="/(auth)/sign-in">
                        <Text className="text-primary font-medium">Sign In</Text>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
