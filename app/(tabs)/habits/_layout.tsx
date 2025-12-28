import { Stack } from 'expo-router';

export default function HabitsLayout() {
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
        options={{ title: 'Habits' }}
      />
      <Stack.Screen
        name="habit-detail"
        options={{ title: 'Habit Details' }}
      />
      <Stack.Screen
        name="habit-summary"
        options={{ title: 'Summary' }}
      />
      <Stack.Screen
        name="printable-view"
        options={{ title: 'Print View' }}
      />
    </Stack>
  );
}

