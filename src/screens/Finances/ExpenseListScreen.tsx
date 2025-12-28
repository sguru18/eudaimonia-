import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { expenseService } from '../../services/database';
import type { Expense } from '../../types';

const CATEGORIES = {
  food: { label: 'Food & Dining', emoji: '🍽️' },
  wellness: { label: 'Wellness', emoji: '🧘' },
  learning: { label: 'Learning', emoji: '📚' },
  transport: { label: 'Transport', emoji: '🚗' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  home: { label: 'Home', emoji: '🏠' },
  entertainment: { label: 'Entertainment', emoji: '🎭' },
  other: { label: 'Other', emoji: '💡' },
};

export const ExpenseListScreen = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let data: Expense[];
      const now = new Date();

      if (filter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        data = await expenseService.getByDateRange(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
      } else if (filter === 'month') {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        data = await expenseService.getByDateRange(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
      } else {
        data = await expenseService.getAll();
      }

      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadExpenses();
  }, [filter]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by date
  const expensesByDate = expenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const dates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadExpenses} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Expenses
          </Header>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.tab, filter === 'week' && styles.tabActive]}
              onPress={() => setFilter('week')}
            >
              <Text style={[styles.tabText, filter === 'week' && styles.tabTextActive]}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, filter === 'month' && styles.tabActive]}
              onPress={() => setFilter('month')}
            >
              <Text style={[styles.tabText, filter === 'month' && styles.tabTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, filter === 'all' && styles.tabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
                All Time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>${totalAmount.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </Text>
          </Card>

          {/* Expense List */}
          {dates.length > 0 ? (
            dates.map(date => (
              <View key={date} style={styles.dateSection}>
                <Text style={styles.dateLabel}>
                  {format(new Date(date), 'EEEE, MMMM d')}
                </Text>
                {expensesByDate[date].map(expense => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>
                No expenses recorded yet.{'\n'}
                Start tracking to see your spending.
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actions}>
            <Button
              title="Recurring Expenses"
              onPress={() => router.push('/(tabs)/finances/recurring-expenses')}
              variant="outline"
              color={colors.finances}
              style={styles.actionButton}
            />
            <Button
              title="Export Data"
              onPress={() => router.push('/(tabs)/finances/export')}
              variant="outline"
              color={colors.finances}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const ExpenseCard: React.FC<{ expense: Expense }> = ({ expense }) => {
  const category = CATEGORIES[expense.category as keyof typeof CATEGORIES] || CATEGORIES.other;

  return (
    <Card style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseLeft}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <View>
            <Text style={styles.expenseName}>{expense.name}</Text>
            <Text style={styles.categoryName}>{category.label}</Text>
          </View>
        </View>
        <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
      </View>
      {expense.notes && (
        <Text style={styles.expenseNotes} numberOfLines={2}>
          📝 {expense.notes}
        </Text>
      )}
      {expense.is_recurring && (
        <View style={styles.recurringBadge}>
          <Text style={styles.recurringText}>↻ Recurring</Text>
        </View>
      )}
    </Card>
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
  filterTabs: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: colors.finances,
    backgroundColor: '#fcf9f4',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.finances,
  },
  summaryCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    ...typography.headerLarge,
    color: colors.finances,
    marginVertical: spacing.sm,
  },
  summaryCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dateSection: {
    marginTop: spacing.xl,
  },
  dateLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  expenseCard: {
    marginBottom: spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  expenseName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  categoryName: {
    ...typography.caption,
    color: colors.textMuted,
  },
  expenseAmount: {
    ...typography.bodyLarge,
    color: colors.finances,
    fontWeight: '700',
  },
  expenseNotes: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recurringBadge: {
    marginTop: spacing.sm,
  },
  recurringText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '600',
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
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});

