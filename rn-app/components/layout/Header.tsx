import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';

type HeaderProps = {
    onProfilePress?: () => void;
    onCreateEventPress?: () => void;
};

export function Header({ onProfilePress, onCreateEventPress }: HeaderProps) {
    return (
        <View className="px-4 py-3 flex-row justify-between items-center border-b border-border">
            {/* App Title */}
            <Text className="text-xl font-bold">Event Queue</Text>

            {/* Action Buttons */}
            <View className="flex-row items-center">
                {/* Profile Button */}
                <Pressable
                    className="w-8 h-8 bg-muted rounded-full items-center justify-center"
                    onPress={onProfilePress}
                >
                    <Text className="text-sm">👤</Text>
                </Pressable>

                {/* Create Event Button */}
                <Button
                    className="ml-3"
                    size="sm"
                    onPress={onCreateEventPress}
                >
                    <Text className="text-primary-foreground font-medium">+ Create</Text>
                </Button>
            </View>
        </View>
    );
}
