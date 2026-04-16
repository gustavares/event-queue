import * as React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

interface StatusBadgeProps {
  status: EventStatus;
}

const statusConfig: Record<EventStatus, { containerClass: string; textClass: string }> = {
  DRAFT: {
    containerClass: 'border border-gray-500',
    textClass: 'text-gray-500',
  },
  ACTIVE: {
    containerClass: 'bg-[#00838f]',
    textClass: 'text-white',
  },
  FINISHED: {
    containerClass: 'bg-[#1a237e]/60',
    textClass: 'text-white',
  },
  CANCELLED: {
    containerClass: 'bg-[#dc2626]/60',
    textClass: 'text-white',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View className={cn('rounded-sm px-3 py-1', config.containerClass)}>
      <Text
        className={cn(
          'text-[11px] font-bold uppercase tracking-widest',
          config.textClass
        )}
      >
        {status}
      </Text>
    </View>
  );
}
