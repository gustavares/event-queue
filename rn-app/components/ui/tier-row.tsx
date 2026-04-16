import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';

interface TierRowProps {
  name: string;
  price: string;
  onNameChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onRemove: () => void;
}

export function TierRow({
  name,
  price,
  onNameChange,
  onPriceChange,
  onRemove,
}: TierRowProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ flex: 2 }}>
        <Input
          value={name}
          onChangeText={onNameChange}
          placeholder="Tier name"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Input
          value={price}
          onChangeText={onPriceChange}
          placeholder="R$ 0.00"
          keyboardType="numeric"
        />
      </View>

      <Pressable
        onPress={onRemove}
        className="h-11 w-11 items-center justify-center"
        hitSlop={8}
      >
        <Text className="text-[16px] font-bold text-[#dc2626]">✕</Text>
      </Pressable>
    </View>
  );
}
