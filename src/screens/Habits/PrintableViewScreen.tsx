import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { format, startOfWeek } from 'date-fns';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Button } from '../../components';
import { habitService } from '../../services/database';
import type { Habit } from '../../types';

export const PrintableViewScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');

  const loadHabits = async () => {
    setLoading(true);
    try {
      // Get current week's Monday
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      setCurrentWeekStart(format(weekStart, 'MMM d, yyyy'));
      
      // Load habits for current week only
      const data = await habitService.getByWeek(weekStartStr);
      setHabits(data);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleExport = () => {
    Alert.alert(
      'Print View',
      'PDF export feature coming soon. For now, take a screenshot of this view to print or save.'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header size="large" color={colors.habits}>
            Printable Habit Tracker
          </Header>

          <Card style={styles.card}>
            <Text style={styles.instructions}>
              A simple grid you can print and hang on your wall or fridge.{'\n\n'}
              Check off each day as you complete your habits.
            </Text>
          </Card>

          {habits.length > 0 ? (
            <Card style={styles.gridCard}>
              <View style={styles.gridHeader}>
                <Text style={styles.gridTitle}>My Habits</Text>
                <Text style={styles.gridSubtitle}>Week of: {currentWeekStart}</Text>
              </View>

              <View style={styles.printGrid}>
                {/* Header Row */}
                <View style={styles.printRow}>
                  <View style={styles.printHabitCell}>
                    <Text style={styles.printCellText}>Habit</Text>
                  </View>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <View key={idx} style={styles.printDayCell}>
                      <Text style={styles.printCellText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Habit Rows */}
                {habits.map(habit => (
                  <View key={habit.id} style={styles.printRow}>
                    <View style={styles.printHabitCell}>
                      <Text style={styles.printHabitText} numberOfLines={2}>
                        {habit.name}
                      </Text>
                    </View>
                    {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                      <View key={idx} style={styles.printCheckCell} />
                    ))}
                  </View>
                ))}
              </View>
            </Card>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                Add habits to create a printable tracker.
              </Text>
            </View>
          )}

          {habits.length > 0 && (
            <Button
              title="Export PDF (Coming Soon)"
              onPress={handleExport}
              color={colors.habits}
              style={styles.exportButton}
            />
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
  card: {
    marginTop: spacing.lg,
  },
  instructions: {
    ...typography.body,
    color: colors.textLight,
    lineHeight: 24,
  },
  gridCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
  },
  gridHeader: {
    marginBottom: spacing.lg,
  },
  gridTitle: {
    ...typography.headerSmall,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  gridSubtitle: {
    ...typography.body,
    color: colors.textLight,
  },
  printGrid: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  printRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
  },
  printHabitCell: {
    width: 120,
    padding: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.text,
    justifyContent: 'center',
  },
  printDayCell: {
    flex: 1,
    padding: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printCheckCell: {
    flex: 1,
    height: 40,
    borderRightWidth: 1,
    borderRightColor: colors.text,
  },
  printCellText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
  },
  printHabitText: {
    ...typography.bodySmall,
    color: colors.text,
    fontSize: 11,
  },
  exportButton: {
    marginTop: spacing.xl,
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

