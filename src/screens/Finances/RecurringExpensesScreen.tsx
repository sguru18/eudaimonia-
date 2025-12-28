import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Button } from '../../components';
import { expenseService } from '../../services/database';
import type { Expense } from '../../types';

export const RecurringExpensesScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAll();
      // Filter recurring expenses
      const recurring = data.filter(e => e.is_recurring);
      setExpenses(recurring);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

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
            Recurring Expenses
          </Header>
          <Text style={styles.subtitle}>
            Expenses you pay regularly
          </Text>

          {expenses.length > 0 ? (
            expenses.map(expense => (
              <Card key={expense.id} style={styles.expenseCard}>
                <Text style={styles.expenseName}>{expense.name}</Text>
                <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>↻</Text>
              <Text style={styles.emptyText}>
                No recurring expenses yet.{'\n'}
                Mark expenses as recurring when adding them.
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
  expenseCard: {
    marginBottom: spacing.md,
  },
  expenseName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  expenseAmount: {
    ...typography.bodyLarge,
    color: colors.finances,
    fontWeight: '700',
  },
  expenseCategory: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
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

