import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { colors, typography, spacing } from '../../theme';
import { Header, Card } from '../../components';
import { habitService, habitCompletionService } from '../../services/database';
import type { Habit, HabitCompletion } from '../../types';

export const HabitSummaryScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const [habitsData, completionsData] = await Promise.all([
        habitService.getAll(),
        habitCompletionService.getByDateRange(
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        ),
      ]);

      setHabits(habitsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getHabitStats = (habit: Habit) => {
    const habitCompletions = completions.filter(c => c.habit_id === habit.id);
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    const completedDays = habitCompletions.length;
    const percentage = Math.round((completedDays / daysInMonth) * 100);

    return { completedDays, totalDays: daysInMonth, percentage };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.habits}>
            Habit Summary
          </Header>
          <Text style={styles.subtitle}>
            {format(new Date(), 'MMMM yyyy')}
          </Text>

          {habits.length > 0 ? (
            habits.map(habit => {
              const stats = getHabitStats(habit);
              return (
                <Card key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitHeader}>
                    <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
                    <Text style={styles.habitName}>{habit.name}</Text>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{stats.completedDays}</Text>
                      <Text style={styles.statLabel}>Days Completed</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: habit.color }]}>
                        {stats.percentage}%
                      </Text>
                      <Text style={styles.statLabel}>Completion Rate</Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${stats.percentage}%`,
                          backgroundColor: habit.color,
                        },
                      ]}
                    />
                  </View>
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                No habits to summarize yet.
              </Text>
            </View>
          )}
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
  content: {
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  habitCard: {
    marginBottom: spacing.lg,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  habitName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.headerMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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

