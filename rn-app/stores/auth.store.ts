import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type User = {
    id: string;
    email: string;
    name: string;
};

interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    restoreToken: () => Promise<void>;
}

const TOKEN_KEY = 'auth-token';

async function saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
}

async function getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    }
}

async function deleteToken(): Promise<void> {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setAuth: (token, user) => {
        saveToken(token).catch(console.error);
        set({ token, user, isAuthenticated: true, isLoading: false });
    },

    clearAuth: () => {
        deleteToken().catch(console.error);
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    },

    restoreToken: async () => {
        try {
            const token = await getToken();
            if (token) {
                // Keep isLoading: true — useRestoreSession will validate
                // the token via ME query and then set isLoading: false
                set({ token });
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },
}));
