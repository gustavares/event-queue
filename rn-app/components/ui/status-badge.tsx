import * as React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

interface StatusBadgeProps {
  status: EventStatus;
}

/**
 * Status is expressed as much by *treatment* as by hue, per docs/design-system.md:
 * ACTIVE feels alive (solid fill), everything else is restrained (outline).
 * On the solid fill the label uses `primary-foreground` — white on the bright teal
 * measures 2.27:1 and is unreadable.
 */
const statusConfig: Record<EventStatus, { containerClass: string; textClass: string }> = {
  DRAFT: {
    containerClass: 'border border-status-draft',
    textClass: 'text-status-draft',
  },
  ACTIVE: {
    containerClass: 'bg-status-active',
    textClass: 'text-primary-foreground',
  },
  FINISHED: {
    containerClass: 'border border-status-finished',
    textClass: 'text-status-finished',
  },
  CANCELLED: {
    containerClass: 'border border-status-cancelled',
    textClass: 'text-status-cancelled',
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
