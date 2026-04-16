import * as React from 'react';
import { Text } from '~/components/ui/text';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Text className="text-[11px] font-bold uppercase tracking-widest text-[#00838f]">
      {title}
    </Text>
  );
}
