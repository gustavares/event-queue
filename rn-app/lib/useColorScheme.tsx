import { useColorScheme as useNativewindColorScheme } from 'nativewind';

/**
 * The app is dark-first (docs/design-system.md § Creative Principles), so an
 * unresolved scheme reports as dark rather than following the OS.
 *
 * Note this hook only *reports* — NativeWind still needs the `dark` class applied to
 * the root for `darkMode: 'class'` to take effect. `app/_layout.tsx` sets that on
 * mount; without it the light palette renders even on a dark OS.
 */
export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();
  const resolved = colorScheme ?? 'dark';
  return {
    colorScheme: resolved,
    isDarkColorScheme: resolved === 'dark',
    setColorScheme,
    toggleColorScheme,
  };
}
