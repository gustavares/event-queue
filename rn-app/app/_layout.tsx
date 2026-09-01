import '~/global.css';

import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { PortalHost } from '@rn-primitives/portal';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { GraphQLProvider } from '~/lib/graphql/provider';
import { useAuthStore } from '~/stores/auth.store';
import { useAuthGate } from '~/hooks/useAuthGate';
import { useRestoreSession } from '~/hooks/useRestoreSession';
import { useFonts } from 'expo-font';
import { Unbounded_700Bold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme, setColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  // Design system fonts — see docs/design-system.md § Typography.
  // `fontError` is deliberately tolerated: a font that fails to fetch should
  // degrade to the system face, never block the app from rendering.
  const [fontsLoaded, fontError] = useFonts({
    Unbounded_700Bold,
    Unbounded_800ExtraBold,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === 'web') {
      document.documentElement.classList.add('bg-background');
    }

    // Dark-first: NativeWind runs in `darkMode: 'class'`, so without this the light
    // palette renders even when the OS prefers dark. The ThemeToggle can still
    // switch away during the session.
    setColorScheme('dark');

    setAndroidNavigationBar('dark');
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  // Hold the first paint until fonts resolve, so headings never flash in a
  // system face and then reflow. If loading errored, render anyway.
  if (!isColorSchemeLoaded || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <GraphQLProvider>
      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
        <AuthGatedStack />
        <PortalHost />
      </ThemeProvider>
    </GraphQLProvider>
  );
}

function AuthGatedStack() {
  const { isLoading, restoreToken } = useAuthStore();

  React.useEffect(() => {
    restoreToken();
  }, []);

  useRestoreSession();
  useAuthGate();

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='(auth)' />
      <Stack.Screen name='(app)' />
      <Stack.Screen name='(public)' />
    </Stack>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
