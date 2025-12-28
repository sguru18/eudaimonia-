import { Stack } from 'expo-router';

export default function StretchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Stretch Routines' }}
      />
      <Stack.Screen
        name="create-routine"
        options={{ title: 'Create Routine' }}
      />
      <Stack.Screen
        name="active-timer"
        options={{ title: 'Stretching', headerShown: false }}
      />
    </Stack>
  );
}

