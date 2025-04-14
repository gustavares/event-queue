import * as React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { Header } from '~/components/layout/Header';
import { Text } from '~/components/ui/text';

export default function EventsScreen() {

  const handleProfilePress = () => {
    console.log('Profile pressed');
    // TODO: Later this will navigate to the profile screen
  };

  const handleCreateEventPress = () => {
    console.log('Create event pressed');
    // TODO: Later this will open the create event form
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header Component */}
      <Header
        onProfilePress={handleProfilePress}
        onCreateEventPress={handleCreateEventPress}
      />

      {/* Search and Filter Bar */}
      <View className="px-4 py-2 flex-row items-center border-b border-border">
        <View className="flex-1 bg-muted rounded-md px-3 py-2 flex-row items-center">
          <Text className="text-muted-foreground">🔍 Search events...</Text>
        </View>
        <View className="ml-2 px-3 py-2">
          <Text className="text-primary">Filter</Text>
        </View>
      </View>

      {/* Content Area - Empty State */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center p-6"
      >
        {/* Empty state content will go here */}
        <View className="items-center">
          <View className="w-16 h-16 bg-muted rounded-full mb-4 items-center justify-center">
            <Text className="text-2xl">📅</Text>
          </View>
          <Text className="text-xl font-semibold mb-2">No events yet</Text>
          <Text className="text-muted-foreground text-center mb-6">
            Create your first event to get started
          </Text>
          <View className="bg-primary px-4 py-2 rounded-md">
            <Text className="text-primary-foreground font-medium">Create Event</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row border-t border-border">
        <View className="flex-1 py-3 items-center">
          <Text className="text-primary font-medium">Events</Text>
        </View>
        <View className="flex-1 py-3 items-center">
          <Text className="text-muted-foreground">Profile</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
