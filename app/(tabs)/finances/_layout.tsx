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
        name="expense-list"
        options={{ title: 'Expenses' }}
      />
      <Stack.Screen
        name="recurring-expenses"
        options={{ title: 'Recurring' }}
      />
      <Stack.Screen
        name="export"
        options={{ title: 'Export' }}
      />
    </Stack>
  );
}

