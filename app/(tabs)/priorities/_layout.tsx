import { Stack } from 'expo-router';

export default function PrioritiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Priorities' }}
      />
      <Stack.Screen
        name="priority-list"
        options={{ title: 'All Priorities' }}
      />
      <Stack.Screen
        name="priority-detail"
        options={{ title: 'Priority Details' }}
      />
      <Stack.Screen
        name="week-detail"
        options={{ title: 'Week Priorities' }}
      />
    </Stack>
  );
}

