import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfWeek, addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { mealService } from '../../services/database';
import type { Meal, MealType} from '../../types';

export const MealPlannerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [remountKey, setRemountKey] = useState(0);

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayLetter = (date: Date): string => {
    const dayIndex = date.getDay();
    return ['U', 'M', 'T', 'W', 'R', 'F', 'S'][dayIndex];
  };

  const loadMeals = useCallback(async () => {
    setLoading(true);
    try {
      const weekEnd = addDays(weekStart, 6);
      const data = await mealService.getByDateRange(
        format(weekStart, 'yyyy-MM-dd'),
        format(weekEnd, 'yyyy-MM-dd')
      );
      setMeals(data);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadMeals();
  }, [weekStart]);

  // Refresh and remount ScrollView when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMeals();
      setRemountKey(prev => prev + 1);
    }, [loadMeals])
  );

  const getMeal = (date: Date, mealType: MealType): Meal | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return meals.find(m => m.date === dateStr && m.meal_type === mealType);
  };

  const navigateToMealDetail = (date: Date, mealType: MealType) => {
    const meal = getMeal(date, mealType);
    const params = new URLSearchParams({
      date: format(date, 'yyyy-MM-dd'),
      mealType,
      mealId: meal?.id?.toString() || '',
    });
    router.push(`/(tabs)/food/meal-detail?${params.toString()}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMeals} />
        }
      >
        <View style={styles.headerSection}>
          <Header size="large" color={colors.food}>
            Meal Planner
          </Header>
          <View style={styles.dateIndicator}>
            <Text style={styles.dateText}>
              Today: {format(new Date(), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.weekNav}>
            <Button
              title="← Prev"
              onPress={() => setWeekStart(addDays(weekStart, -7))}
              variant="outline"
              size="small"
              color={colors.food}
            />
            <Text style={styles.weekLabel}>
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </Text>
            <Button
              title="Next →"
              onPress={() => setWeekStart(addDays(weekStart, 7))}
              variant="outline"
              size="small"
              color={colors.food}
            />
          </View>
        </View>

        {/* Week Grid - Swapped: Meals as columns, Days as rows */}
        <View style={styles.grid}>
          {/* Header Row - Meal Types */}
          <View style={styles.headerRow}>
            <View style={styles.dayCell} />
            {mealTypes.map((mealType, idx) => (
              <View key={idx} style={styles.mealHeader}>
                <Text style={styles.mealHeaderLabel}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Rows */}
          {weekDays.map((day, dayIdx) => (
            <View key={dayIdx} style={styles.dayRow}>
              <View style={styles.dayCell}>
                <Text style={styles.dayLabel}>{getDayLetter(day)}</Text>
                <Text style={styles.dayDate}>{format(day, 'd')}</Text>
              </View>
              {mealTypes.map((mealType, mealIdx) => {
                const meal = getMeal(day, mealType);
                // Determine cell background color based on cooking time
                let cellBackgroundColor = colors.white; // Default: blank for no cooking
                if (meal && meal.needs_cooking) {
                  if (meal.cooking_time_category === 'under_30') {
                    // Under 30 min - mild/lighter green
                    cellBackgroundColor = '#d4e8d4';
                  } else if (meal.cooking_time_category === 'over_30') {
                    // 30+ minutes - darkest green
                    cellBackgroundColor = '#a8d4a8';
                  }
                }
                // No cooking (needs_cooking = false or no meal) - stays white/blank
                
                return (
                  <TouchableOpacity
                    key={mealIdx}
                    style={[
                      styles.mealCell,
                      meal && styles.mealCellFilled,
                      { backgroundColor: cellBackgroundColor },
                    ]}
                    onPress={() => navigateToMealDetail(day, mealType)}
                  >
                    {meal ? (
                      <Text style={styles.mealName} numberOfLines={2}>
                        {meal.name}
                      </Text>
                    ) : (
                      <Text style={styles.addIcon}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Button
            title="View Grocery List"
            onPress={() => router.push('/(tabs)/food/grocery-list')}
            color={colors.food}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    padding: spacing.lg,
  },
  dateIndicator: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  weekLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  grid: {
    marginHorizontal: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
  },
  mealHeaderLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayCell: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayDate: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  mealCell: {
    flex: 1,
    minHeight: 70,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  mealCellFilled: {
    borderStyle: 'solid',
    borderColor: colors.food,
    backgroundColor: colors.white,
  },
  addIcon: {
    fontSize: 24,
    color: colors.textMuted,
  },
  mealName: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});

