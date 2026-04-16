import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-[4px] border border-white/10 bg-[#1a1a2e] p-6">
          <Text className="mb-3 text-[18px] font-bold text-white">{title}</Text>
          <Text className="mb-6 text-[14px] text-[#64748b]">{message}</Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-[4px] border border-[#64748b] py-3"
            >
              <Text className="text-[13px] font-bold uppercase tracking-wide text-[#64748b]">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className={cn(
                'flex-1 items-center justify-center rounded-[4px] py-3',
                destructive ? 'bg-[#dc2626]' : 'bg-[#00838f]'
              )}
            >
              <Text className="text-[13px] font-bold uppercase tracking-wide text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
