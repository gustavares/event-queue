import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/ui/status-badge';
import { cn } from '~/lib/utils';
import { useThemeColors } from '~/lib/useThemeColors';
import type { ThemeColors } from '~/lib/theme';

type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

interface EventCardEvent {
  id: string;
  name: string;
  startDate: string | Date;
  endDate?: string | Date;
  status: EventStatus;
  venue?: string;
  locationName?: string;
}

interface EventCardProps {
  event: EventCardEvent;
  onPress: () => void;
}

function statusAccent(status: EventStatus, colors: ThemeColors): string {
  const map: Record<EventStatus, string> = {
    DRAFT: colors.statusDraft,
    ACTIVE: colors.statusActive,
    FINISHED: colors.statusFinished,
    CANCELLED: colors.statusCancelled,
  };
  return map[status];
}

function formatEventDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day} · ${hours}:${minutes}`;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const colors = useThemeColors();
  const accentColor = statusAccent(event.status, colors);
  const locationLabel = event.venue ?? event.locationName;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row overflow-hidden rounded-[4px] border border-white/10 bg-white/5"
    >
      {/* Left accent border */}
      <View
        style={{ width: 3, backgroundColor: accentColor }}
      />

      {/* Content */}
      <View className="flex-1 p-4">
        {/* Top row */}
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 pr-3 text-[16px] font-bold text-foreground"
            numberOfLines={1}
          >
            {event.name}
          </Text>
          <StatusBadge status={event.status} />
        </View>

        {/* Bottom row */}
        <View className="mt-2 flex-row items-center gap-3">
          <Text className="text-[13px] text-muted-foreground">
            {formatEventDate(event.startDate)}
          </Text>
          {locationLabel ? (
            <Text
              className="flex-1 text-[13px] text-muted-foreground"
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
