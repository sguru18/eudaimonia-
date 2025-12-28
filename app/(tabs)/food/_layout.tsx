import { Stack } from 'expo-router';
import { colors } from '@/src/theme';

export default function FoodLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'none',
        freezeOnBlur: true,
        // Ensure consistent safe area handling
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ 
          title: 'Meal Planner',
          // Keep index screen mounted
          freezeOnBlur: false,
        }}
      />
      <Stack.Screen
        name="meal-detail"
        options={{ title: 'Meal Details' }}
      />
      <Stack.Screen
        name="grocery-list"
        options={{ title: 'Grocery List' }}
      />
    </Stack>
  );
}

