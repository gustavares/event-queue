import * as React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-6">
      <View className="items-center">{icon}</View>
      <Text className="text-[20px] font-bold uppercase tracking-widest text-white">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-[14px] text-[#64748b]">{subtitle}</Text>
      ) : null}
    </View>
  );
}
