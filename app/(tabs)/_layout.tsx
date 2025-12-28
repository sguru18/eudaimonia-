import { useFeatureToggles } from '@/src/contexts/FeatureTogglesContext';
import { colors } from '@/src/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  const { features } = useFeatureToggles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="food"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'🥗'}</Text>
          ),
          href: features.food ? '/(tabs)/food' : null,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'📅'}</Text>
          ),
          href: features.planner ? '/(tabs)/planner' : null,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'💰'}</Text>
          ),
          href: features.finances ? '/(tabs)/finances' : null,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'✓'}</Text>
          ),
          href: features.habits ? '/(tabs)/habits' : null,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'📝'}</Text>
          ),
          href: features.notes ? '/(tabs)/notes' : null,
        }}
      />
      <Tabs.Screen
        name="priorities"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'🎯'}</Text>
          ),
          href: features.priorities ? '/(tabs)/priorities' : null,
        }}
      />
      {/* Stretch - commented out for App Store submission, will restore later */}
      <Tabs.Screen
        name="stretch"
        options={{
          title: 'STRETCH',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'🧘'}</Text>
          ),
          href: null, // Hidden for App Store submission
        }}
      />
      {/* Profile is always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 24 }}>{'👤'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
