import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/ui/status-badge';
import { cn } from '~/lib/utils';

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

const statusAccentColor: Record<EventStatus, string> = {
  DRAFT: '#64748b',
  ACTIVE: '#00838f',
  FINISHED: '#1a237e',
  CANCELLED: '#dc2626',
};

function formatEventDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day} · ${hours}:${minutes}`;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const accentColor = statusAccentColor[event.status];
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
            className="flex-1 pr-3 text-[16px] font-bold text-white"
            numberOfLines={1}
          >
            {event.name}
          </Text>
          <StatusBadge status={event.status} />
        </View>

        {/* Bottom row */}
        <View className="mt-2 flex-row items-center gap-3">
          <Text className="text-[13px] text-[#64748b]">
            {formatEventDate(event.startDate)}
          </Text>
          {locationLabel ? (
            <Text
              className="flex-1 text-[13px] text-[#64748b]"
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
