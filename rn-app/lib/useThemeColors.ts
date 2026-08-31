import { useColorScheme } from '~/lib/useColorScheme';
import { palette, type ThemeColors } from '~/lib/theme';

/**
 * Resolved design tokens for the active theme.
 *
 * Use only where a React Native prop demands a real colour value
 * (`placeholderTextColor`, `thumbColor`, `trackColor`, `tintColor`). Everything else
 * should use a NativeWind class so it stays declarative — see docs/design-system.md.
 */
export function useThemeColors(): ThemeColors {
  const { isDarkColorScheme } = useColorScheme();
  return isDarkColorScheme ? palette.dark : palette.light;
}
