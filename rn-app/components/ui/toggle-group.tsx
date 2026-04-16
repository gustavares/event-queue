import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

interface ToggleGroupProps {
  options: [string, string];
  selected: 0 | 1;
  onChange: (index: 0 | 1) => void;
}

export function ToggleGroup({ options, selected, onChange }: ToggleGroupProps) {
  return (
    <View className="h-11 flex-row">
      {options.map((option, index) => {
        const isActive = selected === index;
        const isFirst = index === 0;
        const isLast = index === 1;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(index as 0 | 1)}
            className={cn(
              'flex-1 items-center justify-center',
              isActive
                ? 'bg-[#00838f]'
                : 'border border-[#64748b] bg-transparent',
              isFirst && 'rounded-l-[4px]',
              isLast && 'rounded-r-[4px]'
            )}
          >
            <Text
              className={cn(
                'text-[12px] font-bold uppercase tracking-wide',
                isActive ? 'text-white' : 'text-[#64748b]'
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
