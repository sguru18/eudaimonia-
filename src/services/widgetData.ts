/**
 * Widget Data Service
 * Provides data for lock screen widgets
 */

import { format, startOfWeek } from 'date-fns';
import { habitService, habitCompletionService, expenseService } from './database';
import type { Habit } from '../types';

export interface UnfinishedHabit {
  id: string;
  name: string;
  color: string;
}

export interface FinanceWidgetData {
  todayTotal: number;
  expenseCount: number;
  lastUpdated: string;
}

/**
 * Get unfinished habits for today
 */
export async function getUnfinishedHabitsForToday(): Promise<UnfinishedHabit[]> {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    // Get habits for current week
    let habits = await habitService.getByWeek(weekStartStr);
    
    // If no habits for this week, try to copy from previous week
    if (habits.length === 0) {
      const previousWeekStart = format(
        new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      await habitService.ensureWeekHabits(weekStartStr, previousWeekStart);
      habits = await habitService.getByWeek(weekStartStr);
    }

    // Get today's completions
    const todayCompletions = await habitCompletionService.getByDateRange(
      todayStr,
      todayStr
    );

    // Find habits that are not completed today
    const completedHabitIds = new Set(
      todayCompletions.map(c => c.habit_id)
    );

    const unfinishedHabits = habits
      .filter(habit => !completedHabitIds.has(habit.id))
      .map(habit => ({
        id: habit.id,
        name: habit.name,
        color: habit.color,
      }));

    return unfinishedHabits;
  } catch (error) {
    console.error('Error getting unfinished habits:', error);
    return [];
  }
}

/**
 * Get today's spending data for finance widget
 */
export async function getTodaySpendingData(): Promise<FinanceWidgetData> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const expenses = await expenseService.getByDate(today);
    
    const todayTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      todayTotal,
      expenseCount: expenses.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting today spending data:', error);
    return {
      todayTotal: 0,
      expenseCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get widget data as JSON string for sharing with widgets
 */
export async function getWidgetDataJson(): Promise<string> {
  const unfinishedHabits = await getUnfinishedHabitsForToday();
  return JSON.stringify({
    unfinishedHabits,
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Get finance widget data as JSON string
 */
export async function getFinanceWidgetDataJson(): Promise<string> {
  const data = await getTodaySpendingData();
  return JSON.stringify(data);
}

