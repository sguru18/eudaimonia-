import { Stack } from 'expo-router';

export default function FinancesLayout() {
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
        options={{ title: 'Quick Add' }}
      />
      <Stack.Screen
        name="overview"
        options={{ title: 'Spending Overview' }}
      />
      <Stack.Screen
        name="categories"
        options={{ title: 'Categories' }}
      />
      <Stack.Screen
        name="subscriptions"
        options={{ title: 'Subscriptions' }}
      />
      <Stack.Screen
        name="history"
        options={{ title: 'History' }}
      />
    </Stack>
  );
}
