/**
 * Widget Data Service
 * Provides data for lock screen widgets
 */

import { format, startOfWeek } from 'date-fns';
import { habitService, habitCompletionService } from './database';
import type { Habit } from '../types';

export interface UnfinishedHabit {
  id: string;
  name: string;
  color: string;
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
 * Get widget data as JSON string for sharing with widgets
 */
export async function getWidgetDataJson(): Promise<string> {
  const unfinishedHabits = await getUnfinishedHabitsForToday();
  return JSON.stringify({
    unfinishedHabits,
    lastUpdated: new Date().toISOString(),
  });
}

