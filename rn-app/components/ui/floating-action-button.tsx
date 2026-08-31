import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { useThemeColors } from '~/lib/useThemeColors';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-[4px] bg-primary shadow-lg"
      style={{
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          color: colors.primaryForeground,
          fontWeight: 'bold',
          lineHeight: 32,
          includeFontPadding: false,
        }}
      >
        +
      </Text>
    </Pressable>
  );
}
