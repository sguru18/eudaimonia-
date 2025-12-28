import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, startOfWeek, addWeeks, addMonths, addDays, isSameMonth, isSameDay, eachDayOfInterval } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { priorityService, priorityWeekService } from '../../services/database';
import type { Priority, PriorityWithRank } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 4;
const DAY_BOX_SIZE = Math.floor((SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * 6) / 7);

type ViewMode = 'list' | 'grid';

// Calculate proportional heights for priorities (max 4)
// Uses weighted distribution: rank 1 gets 4 parts, rank 2 gets 3, rank 3 gets 2, rank 4 gets 1
const getPriorityHeights = (count: number): number[] => {
  if (count === 0) return [];
  if (count === 1) return [1];
  
  const weights = [4, 3, 2, 1];
  const activeWeights = weights.slice(0, Math.min(count, 4));
  const totalWeight = activeWeights.reduce((a, b) => a + b, 0);
  
  return activeWeights.map(w => w / totalWeight);
};

export const PrioritiesCalendarScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [weekPriorities, setWeekPriorities] = useState<Map<string, PriorityWithRank[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [remountKey, setRemountKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get weeks for the current month view
  const getMonthWeeks = useCallback(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeks: Date[] = [];
    
    // Start from the first Monday of/before the month
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    // Include weeks that overlap with the month
    while (weekStart <= monthEnd) {
      weeks.push(weekStart);
      weekStart = addWeeks(weekStart, 1);
    }
    
    return weeks;
  }, [currentMonth]);

  // Get all days to display in the month grid (including days from adjacent months to fill weeks)
  const getMonthDays = useCallback(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Start from Monday of the week containing the first day of month
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    // End on Sunday of the week containing the last day of month
    const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarEnd = addDays(lastWeekStart, 6);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get the week start date for any given day
  const getWeekStartForDay = useCallback((day: Date) => {
    return startOfWeek(day, { weekStartsOn: 1 });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all priorities
      const prioritiesData = await priorityService.getAll();
      setPriorities(prioritiesData);
      
      // Get date range for month
      const weeks = getMonthWeeks();
      if (weeks.length > 0) {
        const startDate = format(weeks[0], 'yyyy-MM-dd');
        const endDate = format(weeks[weeks.length - 1], 'yyyy-MM-dd');
        
        // Load priorities for all weeks in range
        const weekData = await priorityWeekService.getWeeksWithPriorities(startDate, endDate);
        setWeekPriorities(weekData);
      }
    } catch (error) {
      console.error('Error loading priorities:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, getMonthWeeks]);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setRemountKey(prev => prev + 1);
    }, [loadData])
  );

  const handlePrevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleWeekPress = (weekStart: Date) => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    router.push(`/(tabs)/priorities/week-detail?weekStart=${weekStartStr}`);
  };

  const handleDayPress = (day: Date) => {
    const weekStart = getWeekStartForDay(day);
    handleWeekPress(weekStart);
  };

  const handleManagePriorities = () => {
    router.push('/(tabs)/priorities/priority-list');
  };

  const weeks = getMonthWeeks();
  const monthDays = getMonthDays();
  const today = new Date();

  // Render a single day box with priority colors
  const renderDayBox = (day: Date, index: number) => {
    const weekStart = getWeekStartForDay(day);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const dayPriorities = weekPriorities.get(weekStartStr) || [];
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isToday = isSameDay(day, today);
    const heights = getPriorityHeights(dayPriorities.length);
    const dayNumber = format(day, 'd');
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayBox,
          !isCurrentMonth && styles.dayBoxOutsideMonth,
          isToday && styles.dayBoxToday,
        ]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        {dayPriorities.length > 0 ? (
          <View style={styles.dayBoxContent}>
            {dayPriorities.slice(0, 4).map((priority, pIdx) => (
              <View
                key={priority.id}
                style={[
                  styles.prioritySegment,
                  {
                    backgroundColor: priority.color,
                    flex: heights[pIdx],
                  },
                  pIdx === 0 && styles.prioritySegmentTop,
                  pIdx === Math.min(dayPriorities.length - 1, 3) && styles.prioritySegmentBottom,
                ]}
              />
            ))}
            {/* Day number overlay */}
            <View style={styles.dayNumberOverlay}>
              <Text style={[styles.dayNumber, styles.dayNumberOnColor]}>{dayNumber}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.dayBoxContent, styles.dayBoxEmpty]}>
            <Text style={styles.dayNumber}>{dayNumber}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render the month grid view
  const renderGridView = () => {
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    return (
      <View style={styles.monthGrid}>
        {/* Day of week headers */}
        <View style={styles.weekDayHeaders}>
          {weekDays.map((day, idx) => (
            <View key={idx} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Day boxes grid */}
        <View style={styles.daysGrid}>
          {monthDays.map((day, index) => renderDayBox(day, index))}
        </View>
        
        {/* Week labels on the side */}
        <View style={styles.weekLabelsContainer}>
          {weeks.map((weekStart, idx) => {
            const weekEnd = addDays(weekStart, 6);
            const isCurrentWeek = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd');
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.weekLabelRow, isCurrentWeek && styles.weekLabelRowCurrent]}
                onPress={() => handleWeekPress(weekStart)}
              >
                <Text style={[styles.weekLabelText, isCurrentWeek && styles.weekLabelTextCurrent]}>
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'd')}
                </Text>
                {isCurrentWeek && <Text style={styles.nowIndicator}>●</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render the list view (original week cards)
  const renderListView = () => (
    <View style={styles.calendarGrid}>
      {weeks.map((weekStart, idx) => {
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEnd = addDays(weekStart, 6);
        const weekPriorityList = weekPriorities.get(weekStartStr) || [];
        const isCurrentWeek = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd') === weekStartStr;
        
        return (
          <TouchableOpacity
            key={idx}
            style={[
              styles.weekCard,
              isCurrentWeek && styles.weekCardCurrent,
            ]}
            onPress={() => handleWeekPress(weekStart)}
            activeOpacity={0.7}
          >
            <View style={styles.weekHeader}>
              <Text style={[styles.weekCardLabel, isCurrentWeek && styles.weekCardLabelCurrent]}>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'd')}
              </Text>
              {isCurrentWeek && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Now</Text>
                </View>
              )}
            </View>
            
            {weekPriorityList.length > 0 ? (
              <View style={styles.priorityBars}>
                {weekPriorityList.slice(0, 5).map((priority) => (
                  <View
                    key={priority.id}
                    style={[
                      styles.priorityBar,
                      { backgroundColor: priority.color },
                    ]}
                  >
                    <Text style={styles.priorityBarText} numberOfLines={1}>
                      {priority.name}
                    </Text>
                  </View>
                ))}
                {weekPriorityList.length > 5 && (
                  <Text style={styles.moreText}>+{weekPriorityList.length - 5} more</Text>
                )}
              </View>
            ) : (
              <View style={styles.emptyWeek}>
                <Text style={styles.emptyWeekText}>Tap to add priorities</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
          <Header size="large" color={colors.teal}>
            Priorities
          </Header>

          <View style={styles.dateIndicator}>
            <Text style={styles.dateText}>
              Today: {format(new Date(), 'MMM d, yyyy')}
            </Text>
          </View>

          {/* View Toggle */}
          {priorities.length > 0 && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'grid' && styles.toggleButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>
                  📅 Grid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
                  📋 List
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Button
              title="← Prev"
              onPress={handlePrevMonth}
              variant="outline"
              size="small"
              color={colors.teal}
            />
            <Text style={styles.monthLabel}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <Button
              title="Next →"
              onPress={handleNextMonth}
              variant="outline"
              size="small"
              color={colors.teal}
            />
          </View>

          {/* Month Calendar Grid */}
          {loading && priorities.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.teal} />
              <Text style={styles.loadingText}>Loading priorities...</Text>
            </View>
          ) : priorities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>
                No priorities yet.{'\n'}Create priorities to track what matters.
              </Text>
              <Button
                title="Create Priority"
                onPress={handleManagePriorities}
                color={colors.teal}
                style={styles.createButton}
              />
            </View>
          ) : viewMode === 'grid' ? (
            <>
              {/* Legend - above grid for grid view */}
              <Card style={styles.legendCardGrid}>
                <Text style={styles.legendTitle}>Priority Colors</Text>
                <View style={styles.legendGrid}>
                  {priorities.map((priority) => (
                    <View key={priority.id} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: priority.color }]} />
                      <Text style={styles.legendTextName} numberOfLines={1}>{priority.name}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.legendHint}>
                  Box color split shows priority ranking — top priority gets the most space
                </Text>
              </Card>
              {renderGridView()}
            </>
          ) : (
            renderListView()
          )}

          {/* Manage Priorities Button */}
          {priorities.length > 0 && (
            <Button
              title="Manage Priorities"
              onPress={handleManagePriorities}
              color={colors.teal}
              style={styles.manageButton}
            />
          )}

          {/* Legend - only for list view */}
          {priorities.length > 0 && viewMode === 'list' && (
            <Card style={styles.legendCard}>
              <Text style={styles.legendTitle}>Priority Colors</Text>
              <View style={styles.legendGrid}>
                {priorities.map((priority) => (
                  <View key={priority.id} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: priority.color }]} />
                    <Text style={styles.legendTextName} numberOfLines={1}>{priority.name}</Text>
                  </View>
                ))}
              </View>
            </Card>
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
  dateIndicator: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 2,
    marginTop: spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
  },
  toggleText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
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
    marginBottom: spacing.lg,
  },
  createButton: {
    marginTop: spacing.md,
  },
  
  // Grid View Styles
  monthGrid: {
    marginBottom: spacing.md,
  },
  weekDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekDayHeader: {
    width: DAY_BOX_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GRID_GAP,
  },
  dayBox: {
    width: DAY_BOX_SIZE,
    height: DAY_BOX_SIZE,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBoxOutsideMonth: {
    opacity: 0.4,
  },
  dayBoxToday: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  dayBoxContent: {
    flex: 1,
    flexDirection: 'column',
  },
  dayBoxEmpty: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayNumberOnColor: {
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prioritySegment: {
    width: '100%',
  },
  prioritySegmentTop: {
    borderTopLeftRadius: borderRadius.sm - 1,
    borderTopRightRadius: borderRadius.sm - 1,
  },
  prioritySegmentBottom: {
    borderBottomLeftRadius: borderRadius.sm - 1,
    borderBottomRightRadius: borderRadius.sm - 1,
  },
  weekLabelsContainer: {
    marginTop: spacing.md,
  },
  weekLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
  },
  weekLabelRowCurrent: {
    backgroundColor: colors.teal + '15',
  },
  weekLabelText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  weekLabelTextCurrent: {
    color: colors.teal,
    fontWeight: '600',
  },
  nowIndicator: {
    color: colors.teal,
    fontSize: 8,
    marginLeft: spacing.xs,
  },

  // List View Styles
  calendarGrid: {
    gap: spacing.md,
  },
  weekCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCardCurrent: {
    borderColor: colors.teal,
    borderWidth: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekCardLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  weekCardLabelCurrent: {
    color: colors.teal,
  },
  currentBadge: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  priorityBars: {
    gap: spacing.xs,
  },
  priorityBar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  priorityBarText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moreText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyWeek: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyWeekText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  manageButton: {
    marginTop: spacing.lg,
  },
  legendCard: {
    marginTop: spacing.lg,
  },
  legendCardGrid: {
    marginBottom: spacing.lg,
  },
  legendTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  legendTextName: {
    ...typography.caption,
    color: colors.text,
  },
  legendHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
