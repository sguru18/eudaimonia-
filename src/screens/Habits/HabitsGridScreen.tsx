import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfWeek, addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { habitService, habitCompletionService, habitReminderService } from '../../services/database';
import type { Habit, HabitCompletion, HabitReminder } from '../../types';

export const HabitsGridScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [remountKey, setRemountKey] = useState(0);
  const [isChangingWeek, setIsChangingWeek] = useState(false);
  const loadingRef = useRef(false);
  const [reminderContent, setReminderContent] = useState('');
  const [reminderData, setReminderData] = useState<HabitReminder | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayLetter = (date: Date): string => {
    const dayIndex = date.getDay();
    return ['U', 'M', 'T', 'W', 'R', 'F', 'S'][dayIndex];
  };


  const loadData = useCallback(async () => {
    // Prevent concurrent loads to avoid race conditions
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      // First, check if habits exist for this week
      let habitsData = await habitService.getByWeek(weekStartStr);
      
      // If no habits exist for this week, copy from previous week
      if (habitsData.length === 0) {
        const previousWeekStart = format(addDays(weekStart, -7), 'yyyy-MM-dd');
        const previousWeekHabits = await habitService.getByWeek(previousWeekStart);
        
        if (previousWeekHabits.length > 0) {
          // Copy habits one by one to avoid duplication
          await habitService.copyToWeek(previousWeekStart, weekStartStr);
          // Fetch the newly copied habits
          habitsData = await habitService.getByWeek(weekStartStr);
        }
      }
      
      // Fetch completions for this week
      const completionsData = await habitCompletionService.getByDateRange(weekStartStr, weekEndStr);
      
      // Fetch reminder for this week
      const reminderData = await habitReminderService.getByWeek(weekStartStr);
      setReminderData(reminderData);
      setReminderContent(reminderData?.content || '');
      
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setIsChangingWeek(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [weekStart]);

  // Refresh and remount ScrollView when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only reload if not already loading
      if (!loadingRef.current) {
      loadData();
      setRemountKey(prev => prev + 1);
      }
    }, [loadData])
  );

  const isCompleted = (habitId: string, date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.date === dateStr);
  };

  const handleToggleCompletion = async (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const wasCompleted = isCompleted(habit.id, date);
    
    // Optimistic update - update UI immediately
    if (wasCompleted) {
      // Remove completion
      setCompletions(prev => prev.filter(c => 
        !(c.habit_id === habit.id && c.date === dateStr)
      ));
    } else {
      // Add completion
      setCompletions(prev => [...prev, {
        id: `temp-${Date.now()}`,
        habit_id: habit.id,
        date: dateStr,
        created_at: new Date().toISOString(),
      }]);
    }
    
    try {
      // Make the actual database call
      await habitCompletionService.toggle(habit.id, dateStr);
      // Refresh from database to get correct data (no remount needed for inline updates)
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const [habitsData, completionsData] = await Promise.all([
        habitService.getByWeek(weekStartStr),
        habitCompletionService.getByDateRange(weekStartStr, weekEndStr),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch (error) {
      // Revert optimistic update on error
      Alert.alert('Error', 'Failed to update habit');
      await loadData();
    }
  };

  const handleAddHabit = () => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    router.push(`/(tabs)/habits/habit-detail?weekStart=${weekStartStr}`);
  };

  const getCompletionPercentage = (habit: Habit): number => {
    const totalDays = weekDays.length;
    const completedDays = weekDays.filter(day => isCompleted(habit.id, day)).length;
    return Math.round((completedDays / totalDays) * 100);
  };

  const handleSaveReminder = async () => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    await habitReminderService.upsert(weekStartStr, reminderContent);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={loading && !isChangingWeek} onRefresh={loadData} />
        }
        scrollEnabled={!isChangingWeek}
      >
        <View style={styles.content}>
          <Header size="large" color={colors.habits}>
            Habits
          </Header>

          <View style={styles.dateIndicator}>
            <Text style={styles.dateText}>
              Today: {format(new Date(), 'MMM d, yyyy')}
            </Text>
          </View>

          <View style={styles.weekNav}>
            <Button
              title="← Prev"
              onPress={() => {
                setIsChangingWeek(true);
                setWeekStart(addDays(weekStart, -7));
              }}
              variant="outline"
              size="small"
              color={colors.habits}
            />
            <Text style={styles.weekLabel}>
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </Text>
            <Button
              title="Next →"
              onPress={() => {
                setIsChangingWeek(true);
                setWeekStart(addDays(weekStart, 7));
              }}
              variant="outline"
              size="small"
              color={colors.habits}
            />
          </View>

          {loading && habits.length === 0 && !isChangingWeek ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.habits} />
              <Text style={styles.loadingText}>Loading habits...</Text>
            </View>
          ) : habits.length === 0 && !isChangingWeek ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyText}>
                No habits yet.{'\n'}Start tracking your consistency.
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              <View style={styles.grid}>
                <View style={styles.headerRow}>
                  <View style={styles.habitNameCell} />
                  {weekDays.map((day, idx) => (
                    <View key={idx} style={styles.dayCell}>
                      <Text style={styles.dayLabel}>{getDayLetter(day)}</Text>
                      <Text style={styles.dayDate}>{format(day, 'd')}</Text>
                    </View>
                  ))}
                </View>

                {/* Habit Rows */}
                {habits.map(habit => (
                  <View key={habit.id} style={styles.habitRow}>
                    <TouchableOpacity
                      style={styles.habitNameCell}
                      onPress={() => router.push(`/(tabs)/habits/habit-detail?habitId=${habit.id}`)}
                      disabled={isChangingWeek}
                    >
                      <Text style={styles.habitName} numberOfLines={2}>
                        {habit.name}
                      </Text>
                    </TouchableOpacity>
                    
                    {weekDays.map((day, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.completionCell,
                          isCompleted(habit.id, day) && {
                            backgroundColor: habit.color || colors.habits,
                          },
                        ]}
                        onPress={() => handleToggleCompletion(habit, day)}
                        activeOpacity={0.7}
                        disabled={isChangingWeek}
                      />
                    ))}
                  </View>
                ))}
              </View>
              {isChangingWeek && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingBackdrop} />
                  <ActivityIndicator size="large" color={colors.habits} />
                </View>
              )}
            </View>
          )}

          <Button
            title="Add New Habit"
            onPress={handleAddHabit}
            color={colors.habits}
            style={styles.addButton}
          />

          {/* Other Reminders Section */}
          <Card style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Other Reminders</Text>
            <View style={styles.reminderContent}>
              <TextInput
                style={styles.reminderInput}
                value={reminderContent}
                onChangeText={setReminderContent}
                onBlur={handleSaveReminder}
                placeholder="Add reminders for this week..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
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
    marginBottom: spacing.xl,
  },
  weekLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  gridContainer: {
    position: 'relative',
    minHeight: 200,
  },
  grid: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    opacity: 0.95,
    borderRadius: borderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  habitRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  habitNameCell: {
    width: 100,
    paddingRight: spacing.sm,
  },
  habitName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dayDate: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  completionCell: {
    flex: 1,
    height: 40,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCellActive: {
    backgroundColor: colors.habits,
  },
  actionButton: {
    marginTop: spacing.xl,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  reminderCard: {
    marginTop: spacing.md,
  },
  reminderTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  reminderContent: {
    marginTop: spacing.xs,
  },
  reminderInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 100,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

