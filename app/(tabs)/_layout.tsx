import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GameProvider } from '@/store/game-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GameProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Carte',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🗺️</Text>,
          }}
        />
        <Tabs.Screen
          name="BananaClicker"
          options={{
            title: 'Banana',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🍌</Text>,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
          }}
        />
      </Tabs>
    </GameProvider>
  );
}
