/**
 * Eudaimonia App TypeScript Types
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type CookingTimeCategory = 'under_30' | 'over_30';

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  name: string;
  notes?: string;
  makes_leftovers: boolean;
  is_cooked: boolean;
  needs_cooking: boolean;
  cooking_time_category?: CookingTimeCategory | null;
  created_at: string;
  updated_at: string;
}

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  checked: boolean;
  notes?: string;
  meal_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  name: string;
  notes?: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  color: string;
  reminder_text?: string;
  reminder_time?: string;
  reminder_enabled: boolean;
  sort_order: number;
  week_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface HabitReminder {
  id: string;
  user_id: string;
  week_start_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ReflectionType = 'gratitude' | 'weekly' | 'looking_forward' | 'affirmation';

export interface Reflection {
  id: string;
  user_id: string;
  type: ReflectionType;
  content: string;
  date: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type EntityType = 'meal' | 'grocery_item' | 'expense' | 'habit' | 'habit_completion' | 'reflection' | 'general';

export interface Note {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id?: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSetting {
  id: string;
  user_id: string;
  type: string;
  enabled: boolean;
  time?: string;
  days?: string[];
  custom_text?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
}

export interface UserSetting {
  id: string;
  user_id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export interface StretchingRoutine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StretchingExercise {
  id: string;
  routine_id: string;
  name: string;
  duration_seconds: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Priority {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface PriorityWeek {
  id: string;
  priority_id: string;
  user_id: string;
  week_start_date: string;
  rank_order: number;
  created_at: string;
  updated_at: string;
}

export interface PriorityWithRank extends Priority {
  rank_order: number;
}

export interface TimeBlock {
  id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24hr)
  end_time: string; // HH:MM (24hr)
  created_at: string;
  updated_at: string;
}

