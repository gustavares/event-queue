import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '~/lib/utils';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  className?: string;
}

export function SkeletonLoader({ width, height = 16, className }: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          height,
          width: typeof width === 'number' ? width : undefined,
          borderRadius: 4,
        },
        styles.base,
      ]}
      className={cn('bg-white/10 rounded-[4px]', className)}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
