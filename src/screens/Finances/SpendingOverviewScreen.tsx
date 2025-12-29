import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button, LoadingSpinner } from '../../components';
import { expenseService, expenseCategoryService, subscriptionService } from '../../services/database';
import type { ExpenseCategory, ExpenseWithCategory } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - spacing.lg * 4;

type FilterType = 'week' | 'month';

interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
  percentage: number;
}

export const SpendingOverviewScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [remountKey, setRemountKey] = useState(0);
  const [filter, setFilter] = useState<FilterType>('month');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [subscriptionTotal, setSubscriptionTotal] = useState(0);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (filter === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
        label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
      };
    } else {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
        label: format(now, 'MMMM yyyy'),
      };
    }
  }, [filter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Load categories and expenses
      const [cats, exps, subTotal] = await Promise.all([
        expenseCategoryService.getAll(),
        expenseService.getByDateRangeWithCategories(start, end),
        subscriptionService.getMonthlyTotal(),
      ]);
      
      setCategories(cats);
      setExpenses(exps);
      setSubscriptionTotal(subTotal);
      
      // Calculate totals by category
      const total = exps.reduce((sum, e) => sum + e.amount, 0);
      setTotalSpent(total);
      
      // Group by category
      const totalsMap = new Map<string, number>();
      exps.forEach(exp => {
        const current = totalsMap.get(exp.category_id) || 0;
        totalsMap.set(exp.category_id, current + exp.amount);
      });
      
      // Convert to sorted array
      const totalsArray: CategoryTotal[] = [];
      cats.forEach(cat => {
        const catTotal = totalsMap.get(cat.id) || 0;
        if (catTotal > 0) {
          totalsArray.push({
            category: cat,
            total: catTotal,
            percentage: total > 0 ? (catTotal / total) * 100 : 0,
          });
        }
      });
      
      // Sort by total descending
      totalsArray.sort((a, b) => b.total - a.total);
      setCategoryTotals(totalsArray);
      
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadData();
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setRemountKey(prev => prev + 1);
    }, [loadData])
  );

  // Generate pie chart paths
  const generatePieChart = () => {
    if (categoryTotals.length === 0) {
      return null;
    }

    const cx = CHART_SIZE / 2;
    const cy = CHART_SIZE / 2;
    const radius = CHART_SIZE / 2 - 20;
    const innerRadius = radius * 0.6; // Donut chart

    let startAngle = -90; // Start from top
    const paths: React.ReactNode[] = [];

    categoryTotals.forEach((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const endAngle = startAngle + angle;

      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate arc points
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      // Inner arc points
      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;

      paths.push(
        <Path
          key={item.category.id}
          d={path}
          fill={item.category.color}
          stroke={colors.white}
          strokeWidth={2}
        />
      );

      startAngle = endAngle;
    });

    return paths;
  };

  const dateRange = getDateRange();

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Spending Overview
          </Header>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.tab, filter === 'month' && styles.tabActive]}
              onPress={() => setFilter('month')}
            >
              <Text style={[styles.tabText, filter === 'month' && styles.tabTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, filter === 'week' && styles.tabActive]}
              onPress={() => setFilter('week')}
            >
              <Text style={[styles.tabText, filter === 'week' && styles.tabTextActive]}>
                This Week
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.dateLabel}>{dateRange.label}</Text>

          {/* Total Card */}
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Spent</Text>
            <Text style={styles.totalAmount}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.expenseCount}>
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </Text>
          </Card>

          {/* Pie Chart */}
          {categoryTotals.length > 0 && (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>By Category</Text>
              <View style={styles.chartContainer}>
                <Svg width={CHART_SIZE} height={CHART_SIZE}>
                  <G>{generatePieChart()}</G>
                </Svg>
                <View style={styles.chartCenter}>
                  <Text style={styles.chartCenterAmount}>${totalSpent.toFixed(0)}</Text>
                  <Text style={styles.chartCenterLabel}>total</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Category Breakdown</Text>
            {categoryTotals.length > 0 ? (
              categoryTotals.map(item => (
                <View key={item.category.id} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View 
                      style={[styles.categoryDot, { backgroundColor: item.category.color }]} 
                    />
                    <Text style={styles.categoryName}>{item.category.name}</Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryAmount}>${item.total.toFixed(2)}</Text>
                    <Text style={styles.categoryPercent}>{item.percentage.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${item.percentage}%`,
                          backgroundColor: item.category.color,
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>
                  No expenses recorded for this period.{'\n'}
                  Start tracking to see your breakdown.
                </Text>
              </View>
            )}
          </Card>

          {/* Subscriptions Summary */}
          {filter === 'month' && subscriptionTotal > 0 && (
            <Card style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>Monthly Subscriptions</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/finances/subscriptions')}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subscriptionAmount}>${subscriptionTotal.toFixed(2)}/mo</Text>
            </Card>
          )}

          {/* Navigation */}
          <View style={styles.navButtons}>
            <Button
              title="View History"
              onPress={() => router.push('/(tabs)/finances/history')}
              variant="outline"
              color={colors.finances}
              style={styles.navButton}
            />
          </View>
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
    paddingBottom: spacing.xxxl,
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
    backgroundColor: colors.finances + '10',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.finances,
  },
  dateLabel: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  totalCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.finances + '10',
    borderWidth: 1,
    borderColor: colors.finances + '20',
  },
  totalLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    ...typography.headerLarge,
    color: colors.finances,
    fontSize: 42,
    lineHeight: 50,
    marginVertical: spacing.sm,
  },
  expenseCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  chartCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  chartTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterAmount: {
    ...typography.headerMedium,
    color: colors.text,
  },
  chartCenterLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  breakdownCard: {
    marginTop: spacing.lg,
  },
  breakdownTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  categoryRow: {
    marginBottom: spacing.lg,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryAmount: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  categoryPercent: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subscriptionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.lavender + '50',
    borderWidth: 1,
    borderColor: colors.purple + '20',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscriptionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  viewAllLink: {
    ...typography.caption,
    color: colors.purple,
    fontWeight: '600',
  },
  subscriptionAmount: {
    ...typography.headerMedium,
    color: colors.purple,
    lineHeight: 32,
  },
  navButtons: {
    marginTop: spacing.xl,
  },
  navButton: {
    width: '100%',
  },
});

