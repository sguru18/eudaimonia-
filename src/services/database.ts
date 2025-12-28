/**
 * Database CRUD Operations
 * Local-first with Supabase sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type {
  Meal,
  GroceryItem,
  Expense,
  Habit,
  HabitCompletion,
  HabitReminder,
  Reflection,
  Note,
  NotificationSetting,
  StretchingRoutine,
  StretchingExercise,
  UserSetting,
  Priority,
  PriorityWeek,
  PriorityWithRank,
  TimeBlock,
} from '../types';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }
  return user.id;
}

// Local storage keys
const KEYS = {
  MEALS: '@garden/meals',
  GROCERY_ITEMS: '@garden/grocery_items',
  EXPENSES: '@garden/expenses',
  HABITS: '@garden/habits',
  HABIT_COMPLETIONS: '@garden/habit_completions',
  HABIT_REMINDERS: '@garden/habit_reminders',
  REFLECTIONS: '@garden/reflections',
  NOTES: '@garden/notes',
  NOTIFICATION_SETTINGS: '@garden/notification_settings',
  STRETCHING_ROUTINES: '@garden/stretching_routines',
  STRETCHING_EXERCISES: '@garden/stretching_exercises',
  USER_SETTINGS: '@garden/user_settings',
  PRIORITIES: '@garden/priorities',
  PRIORITY_WEEKS: '@garden/priority_weeks',
  TIME_BLOCKS: '@garden/time_blocks',
  PENDING_SYNC: '@garden/pending_sync',
};

// Generic local storage helpers
async function getLocalData<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting local data for ${key}:`, error);
    return [];
  }
}

async function setLocalData<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting local data for ${key}:`, error);
  }
}

// Meal operations
export const mealService = {
  async getAll(): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Cache locally
      if (data) {
        await setLocalData(KEYS.MEALS, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching meals:', error);
      // Fallback to local data
      return getLocalData<Meal>(KEYS.MEALS);
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching meals by date:', error);
      const allMeals = await getLocalData<Meal>(KEYS.MEALS);
      return allMeals.filter(m => m.date >= startDate && m.date <= endDate);
    }
  },

  async getById(id: string): Promise<Meal | null> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching meal by id:', error);
      const allMeals = await getLocalData<Meal>(KEYS.MEALS);
      return allMeals.find(m => m.id === id) || null;
    }
  },

  async create(meal: Omit<Meal, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Meal | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('meals')
        .insert({ ...meal, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local cache
      if (data) {
        const meals = await getLocalData<Meal>(KEYS.MEALS);
        await setLocalData(KEYS.MEALS, [data, ...meals]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating meal:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Meal>): Promise<Meal | null> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local cache
      if (data) {
        const meals = await getLocalData<Meal>(KEYS.MEALS);
        const updatedMeals = meals.map(m => m.id === id ? data : m);
        await setLocalData(KEYS.MEALS, updatedMeals);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating meal:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local cache
      const meals = await getLocalData<Meal>(KEYS.MEALS);
      await setLocalData(KEYS.MEALS, meals.filter(m => m.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  },
};

// Grocery item operations
export const groceryService = {
  async getAll(): Promise<GroceryItem[]> {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.GROCERY_ITEMS, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      return getLocalData<GroceryItem>(KEYS.GROCERY_ITEMS);
    }
  },

  async create(item: Omit<GroceryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<GroceryItem | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({ ...item, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const items = await getLocalData<GroceryItem>(KEYS.GROCERY_ITEMS);
        await setLocalData(KEYS.GROCERY_ITEMS, [data, ...items]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating grocery item:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<GroceryItem>): Promise<GroceryItem | null> {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const items = await getLocalData<GroceryItem>(KEYS.GROCERY_ITEMS);
        const updatedItems = items.map(i => i.id === id ? data : i);
        await setLocalData(KEYS.GROCERY_ITEMS, updatedItems);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating grocery item:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const items = await getLocalData<GroceryItem>(KEYS.GROCERY_ITEMS);
      await setLocalData(KEYS.GROCERY_ITEMS, items.filter(i => i.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting grocery item:', error);
      return false;
    }
  },
};

// Expense operations
export const expenseService = {
  async getAll(): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.EXPENSES, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return getLocalData<Expense>(KEYS.EXPENSES);
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses by date:', error);
      const allExpenses = await getLocalData<Expense>(KEYS.EXPENSES);
      return allExpenses.filter(e => e.date >= startDate && e.date <= endDate);
    }
  },

  async create(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Expense | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const expenses = await getLocalData<Expense>(KEYS.EXPENSES);
        await setLocalData(KEYS.EXPENSES, [data, ...expenses]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const expenses = await getLocalData<Expense>(KEYS.EXPENSES);
        const updatedExpenses = expenses.map(e => e.id === id ? data : e);
        await setLocalData(KEYS.EXPENSES, updatedExpenses);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const expenses = await getLocalData<Expense>(KEYS.EXPENSES);
      await setLocalData(KEYS.EXPENSES, expenses.filter(e => e.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  },
};

// Habit operations
export const habitService = {
  async getAll(): Promise<Habit[]> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.HABITS, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching habits:', error);
      return getLocalData<Habit>(KEYS.HABITS);
    }
  },

  async getByWeek(weekStartDate: string): Promise<Habit[]> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('week_start_date', weekStartDate)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching habits for week:', error);
      const allHabits = await getLocalData<Habit>(KEYS.HABITS);
      return allHabits.filter(h => h.week_start_date === weekStartDate);
    }
  },

  async getById(id: string): Promise<Habit | null> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching habit by id:', error);
      const allHabits = await getLocalData<Habit>(KEYS.HABITS);
      return allHabits.find(h => h.id === id) || null;
    }
  },

  async create(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Habit | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('habits')
        .insert({ ...habit, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const habits = await getLocalData<Habit>(KEYS.HABITS);
        await setLocalData(KEYS.HABITS, [...habits, data]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating habit:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Habit>): Promise<Habit | null> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const habits = await getLocalData<Habit>(KEYS.HABITS);
        const updatedHabits = habits.map(h => h.id === id ? data : h);
        await setLocalData(KEYS.HABITS, updatedHabits);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating habit:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const habits = await getLocalData<Habit>(KEYS.HABITS);
      await setLocalData(KEYS.HABITS, habits.filter(h => h.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  },

  async copyToWeek(sourceWeekStart: string, targetWeekStart: string): Promise<number> {
    try {
      const userId = await getCurrentUserId();
      
      // Call the database function to copy habits
      const { data, error } = await supabase.rpc('copy_habits_to_week', {
        p_user_id: userId,
        p_source_week_start: sourceWeekStart,
        p_target_week_start: targetWeekStart,
      });

      if (error) throw error;
      
      // Return the number of habits copied
      return data || 0;
    } catch (error) {
      console.error('Error copying habits to week:', error);
      return 0;
    }
  },

  async ensureWeekHabits(weekStartDate: string, previousWeekStart: string): Promise<Habit[]> {
    try {
      // Check if habits exist for this week
      const existingHabits = await this.getByWeek(weekStartDate);
      
      if (existingHabits.length > 0) {
        return existingHabits;
      }

      // No habits for this week, copy from previous week
      const copiedCount = await this.copyToWeek(previousWeekStart, weekStartDate);
      
      if (copiedCount > 0) {
        // Fetch the newly copied habits
        return await this.getByWeek(weekStartDate);
      }

      // No habits in previous week either
      return [];
    } catch (error) {
      console.error('Error ensuring week habits:', error);
      return [];
    }
  },
};

// Habit completion operations
export const habitCompletionService = {
  async getByHabit(habitId: string): Promise<HabitCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching habit completions:', error);
      const allCompletions = await getLocalData<HabitCompletion>(KEYS.HABIT_COMPLETIONS);
      return allCompletions.filter(c => c.habit_id === habitId);
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<HabitCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completions by date:', error);
      const allCompletions = await getLocalData<HabitCompletion>(KEYS.HABIT_COMPLETIONS);
      return allCompletions.filter(c => c.date >= startDate && c.date <= endDate);
    }
  },

  async toggle(habitId: string, date: string, notes?: string): Promise<HabitCompletion | null> {
    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .single();
      
      if (existing) {
        // Delete if exists
        await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);
        
        const completions = await getLocalData<HabitCompletion>(KEYS.HABIT_COMPLETIONS);
        await setLocalData(KEYS.HABIT_COMPLETIONS, completions.filter(c => c.id !== existing.id));
        
        return null;
      } else {
        // Create if doesn't exist
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({ habit_id: habitId, date, notes })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          const completions = await getLocalData<HabitCompletion>(KEYS.HABIT_COMPLETIONS);
          await setLocalData(KEYS.HABIT_COMPLETIONS, [data, ...completions]);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      return null;
    }
  },
};

// Habit reminder operations
export const habitReminderService = {
  async getByWeek(weekStartDate: string): Promise<HabitReminder | null> {
    try {
      const { data, error } = await supabase
        .from('habit_reminders')
        .select('*')
        .eq('week_start_date', weekStartDate)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (data) {
        await setLocalData(KEYS.HABIT_REMINDERS, [data]);
      }
      
      return data || null;
    } catch (error) {
      console.error('Error fetching habit reminder:', error);
      const allReminders = await getLocalData<HabitReminder>(KEYS.HABIT_REMINDERS);
      return allReminders.find(r => r.week_start_date === weekStartDate) || null;
    }
  },

  async upsert(weekStartDate: string, content: string): Promise<HabitReminder | null> {
    try {
      const userId = await getCurrentUserId();
      
      // Check if reminder exists for this week
      const existing = await this.getByWeek(weekStartDate);
      
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('habit_reminders')
          .update({ content })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          const reminders = await getLocalData<HabitReminder>(KEYS.HABIT_REMINDERS);
          await setLocalData(KEYS.HABIT_REMINDERS, reminders.map(r => r.id === data.id ? data : r));
        }
        
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('habit_reminders')
          .insert({ user_id: userId, week_start_date: weekStartDate, content })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          const reminders = await getLocalData<HabitReminder>(KEYS.HABIT_REMINDERS);
          await setLocalData(KEYS.HABIT_REMINDERS, [...reminders, data]);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error upserting habit reminder:', error);
      return null;
    }
  },
};

// Reflection operations
export const reflectionService = {
  async getAll(): Promise<Reflection[]> {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.REFLECTIONS, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching reflections:', error);
      return getLocalData<Reflection>(KEYS.REFLECTIONS);
    }
  },

  async getByType(type: string): Promise<Reflection[]> {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('type', type)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reflections by type:', error);
      const allReflections = await getLocalData<Reflection>(KEYS.REFLECTIONS);
      return allReflections.filter(r => r.type === type);
    }
  },

  async create(reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Reflection | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('reflections')
        .insert({ ...reflection, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const reflections = await getLocalData<Reflection>(KEYS.REFLECTIONS);
        await setLocalData(KEYS.REFLECTIONS, [data, ...reflections]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating reflection:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Reflection>): Promise<Reflection | null> {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const reflections = await getLocalData<Reflection>(KEYS.REFLECTIONS);
        const updatedReflections = reflections.map(r => r.id === id ? data : r);
        await setLocalData(KEYS.REFLECTIONS, updatedReflections);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating reflection:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const reflections = await getLocalData<Reflection>(KEYS.REFLECTIONS);
      await setLocalData(KEYS.REFLECTIONS, reflections.filter(r => r.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting reflection:', error);
      return false;
    }
  },
};

// Note operations
export const noteService = {
  async getAll(): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.NOTES, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return getLocalData<Note>(KEYS.NOTES);
    }
  },

  async getByEntity(entityType: string, entityId: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes by entity:', error);
      const allNotes = await getLocalData<Note>(KEYS.NOTES);
      return allNotes.filter(n => n.entity_type === entityType && n.entity_id === entityId);
    }
  },

  async create(note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Note | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('notes')
        .insert({ ...note, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const notes = await getLocalData<Note>(KEYS.NOTES);
        await setLocalData(KEYS.NOTES, [data, ...notes]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const notes = await getLocalData<Note>(KEYS.NOTES);
        const updatedNotes = notes.map(n => n.id === id ? data : n);
        await setLocalData(KEYS.NOTES, updatedNotes);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const notes = await getLocalData<Note>(KEYS.NOTES);
      await setLocalData(KEYS.NOTES, notes.filter(n => n.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },
};

// Notification Settings operations
export const notificationSettingsService = {
  async getAll(): Promise<NotificationSetting[]> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.NOTIFICATION_SETTINGS, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return getLocalData<NotificationSetting>(KEYS.NOTIFICATION_SETTINGS);
    }
  },

  async getById(id: string): Promise<NotificationSetting | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notification setting by id:', error);
      const allSettings = await getLocalData<NotificationSetting>(KEYS.NOTIFICATION_SETTINGS);
      return allSettings.find(s => s.id === id) || null;
    }
  },

  async getByType(type: string): Promise<NotificationSetting | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('type', type)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    } catch (error) {
      console.error('Error fetching notification setting by type:', error);
      return null;
    }
  },

  async create(setting: Omit<NotificationSetting, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<NotificationSetting | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({ ...setting, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const settings = await getLocalData<NotificationSetting>(KEYS.NOTIFICATION_SETTINGS);
        await setLocalData(KEYS.NOTIFICATION_SETTINGS, [data, ...settings]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating notification setting:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<NotificationSetting>): Promise<NotificationSetting | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const settings = await getLocalData<NotificationSetting>(KEYS.NOTIFICATION_SETTINGS);
        const updatedSettings = settings.map(s => s.id === id ? data : s);
        await setLocalData(KEYS.NOTIFICATION_SETTINGS, updatedSettings);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return null;
    }
  },

  async upsert(type: string, updates: Partial<NotificationSetting>): Promise<NotificationSetting | null> {
    try {
      // Check if setting exists for this type
      const existing = await this.getByType(type);
      
      if (existing) {
        return await this.update(existing.id, updates);
      } else {
        return await this.create({ type, ...updates } as any);
      }
    } catch (error) {
      console.error('Error upserting notification setting:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const settings = await getLocalData<NotificationSetting>(KEYS.NOTIFICATION_SETTINGS);
      await setLocalData(KEYS.NOTIFICATION_SETTINGS, settings.filter(s => s.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting notification setting:', error);
      return false;
    }
  },
};

// Stretching Routines Database Functions
export const StretchingRoutinesDB = {
  async getAll(): Promise<StretchingRoutine[]> {
    try {
      // Try local first
      const localRoutines = await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
      
      // Try Supabase sync
      const { data, error } = await supabase
        .from('stretching_routines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        await setLocalData(KEYS.STRETCHING_ROUTINES, data);
        return data;
      }
      
      return localRoutines;
    } catch (error) {
      console.error('Error fetching stretching routines:', error);
      return await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
    }
  },

  async getById(id: string): Promise<StretchingRoutine | null> {
    try {
      const { data, error } = await supabase
        .from('stretching_routines')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching routine:', error);
      const routines = await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
      return routines.find(r => r.id === id) || null;
    }
  },

  async create(routine: Omit<StretchingRoutine, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<StretchingRoutine | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('stretching_routines')
        .insert({ ...routine, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      const routines = await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
      await setLocalData(KEYS.STRETCHING_ROUTINES, [...routines, data]);
      
      return data;
    } catch (error) {
      console.error('Error creating routine:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<StretchingRoutine>): Promise<StretchingRoutine | null> {
    try {
      const { data, error } = await supabase
        .from('stretching_routines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const routines = await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
      await setLocalData(
        KEYS.STRETCHING_ROUTINES,
        routines.map(r => r.id === id ? data : r)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating routine:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stretching_routines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const routines = await getLocalData<StretchingRoutine>(KEYS.STRETCHING_ROUTINES);
      await setLocalData(KEYS.STRETCHING_ROUTINES, routines.filter(r => r.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting routine:', error);
      return false;
    }
  },
};

// Stretching Exercises Database Functions
export const StretchingExercisesDB = {
  async getByRoutineId(routineId: string): Promise<StretchingExercise[]> {
    try {
      // Try local first
      const localExercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      const filteredLocal = localExercises.filter(e => e.routine_id === routineId);
      
      // Try Supabase sync
      const { data, error } = await supabase
        .from('stretching_exercises')
        .select('*')
        .eq('routine_id', routineId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Update local cache for this routine's exercises
        const otherExercises = localExercises.filter(e => e.routine_id !== routineId);
        await setLocalData(KEYS.STRETCHING_EXERCISES, [...otherExercises, ...data]);
        return data;
      }
      
      return filteredLocal;
    } catch (error) {
      console.error('Error fetching stretching exercises:', error);
      const exercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      return exercises.filter(e => e.routine_id === routineId);
    }
  },

  async create(exercise: Partial<StretchingExercise>): Promise<StretchingExercise | null> {
    try {
      const { data, error } = await supabase
        .from('stretching_exercises')
        .insert(exercise)
        .select()
        .single();
      
      if (error) throw error;
      
      const exercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      await setLocalData(KEYS.STRETCHING_EXERCISES, [...exercises, data]);
      
      return data;
    } catch (error) {
      console.error('Error creating exercise:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<StretchingExercise>): Promise<StretchingExercise | null> {
    try {
      const { data, error } = await supabase
        .from('stretching_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const exercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      await setLocalData(
        KEYS.STRETCHING_EXERCISES,
        exercises.map(e => e.id === id ? data : e)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating exercise:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stretching_exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const exercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      await setLocalData(KEYS.STRETCHING_EXERCISES, exercises.filter(e => e.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }
  },

  async deleteByRoutineId(routineId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stretching_exercises')
        .delete()
        .eq('routine_id', routineId);
      
      if (error) throw error;
      
      const exercises = await getLocalData<StretchingExercise>(KEYS.STRETCHING_EXERCISES);
      await setLocalData(KEYS.STRETCHING_EXERCISES, exercises.filter(e => e.routine_id !== routineId));
      
      return true;
    } catch (error) {
      console.error('Error deleting exercises:', error);
      return false;
    }
  },
};

// User Settings operations
export const userSettingsService = {
  async getSetting(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      return data?.setting_value || null;
    } catch (error) {
      console.error('Error fetching user setting:', error);
      const allSettings = await getLocalData<UserSetting>(KEYS.USER_SETTINGS);
      const setting = allSettings.find(s => s.setting_key === key);
      return setting?.setting_value || null;
    }
  },

  async upsertSetting(key: string, value: string): Promise<UserSetting | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase.rpc('upsert_user_setting', {
        p_user_id: userId,
        p_setting_key: key,
        p_setting_value: value,
      });
      
      if (error) throw error;
      
      // Update local cache
      if (data) {
        const settings = await getLocalData<UserSetting>(KEYS.USER_SETTINGS);
        const existingIndex = settings.findIndex(s => s.setting_key === key);
        if (existingIndex >= 0) {
          settings[existingIndex] = data;
        } else {
          settings.push(data);
        }
        await setLocalData(KEYS.USER_SETTINGS, settings);
      }
      
      return data;
    } catch (error) {
      console.error('Error upserting user setting:', error);
      return null;
    }
  },

  async getMealOptionsList(): Promise<string> {
    try {
      const list = await this.getSetting('meal_options_list');
      return list || '';
    } catch (error) {
      console.error('Error fetching meal options list:', error);
      return '';
    }
  },

  async saveMealOptionsList(list: string): Promise<boolean> {
    try {
      await this.upsertSetting('meal_options_list', list);
      return true;
    } catch (error) {
      console.error('Error saving meal options list:', error);
      return false;
    }
  },
};

// Priority operations
export const priorityService = {
  async getAll(): Promise<Priority[]> {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        await setLocalData(KEYS.PRIORITIES, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching priorities:', error);
      return getLocalData<Priority>(KEYS.PRIORITIES);
    }
  },

  async getById(id: string): Promise<Priority | null> {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching priority by id:', error);
      const allPriorities = await getLocalData<Priority>(KEYS.PRIORITIES);
      return allPriorities.find(p => p.id === id) || null;
    }
  },

  async create(priority: Omit<Priority, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Priority | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('priorities')
        .insert({ ...priority, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const priorities = await getLocalData<Priority>(KEYS.PRIORITIES);
        await setLocalData(KEYS.PRIORITIES, [...priorities, data]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating priority:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Priority>): Promise<Priority | null> {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const priorities = await getLocalData<Priority>(KEYS.PRIORITIES);
        const updatedPriorities = priorities.map(p => p.id === id ? data : p);
        await setLocalData(KEYS.PRIORITIES, updatedPriorities);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating priority:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      // First delete all priority_weeks for this priority
      await supabase
        .from('priority_weeks')
        .delete()
        .eq('priority_id', id);
      
      // Then delete the priority
      const { error } = await supabase
        .from('priorities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local cache
      const priorities = await getLocalData<Priority>(KEYS.PRIORITIES);
      await setLocalData(KEYS.PRIORITIES, priorities.filter(p => p.id !== id));
      
      const priorityWeeks = await getLocalData<PriorityWeek>(KEYS.PRIORITY_WEEKS);
      await setLocalData(KEYS.PRIORITY_WEEKS, priorityWeeks.filter(pw => pw.priority_id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting priority:', error);
      return false;
    }
  },
};

// Priority Week operations
export const priorityWeekService = {
  async getByWeek(weekStartDate: string): Promise<PriorityWithRank[]> {
    try {
      // First get priority_weeks for this week
      const { data: priorityWeeksData, error: pwError } = await supabase
        .from('priority_weeks')
        .select('*')
        .eq('week_start_date', weekStartDate)
        .order('rank_order', { ascending: true });
      
      if (pwError) throw pwError;
      
      if (!priorityWeeksData || priorityWeeksData.length === 0) {
        return [];
      }
      
      // Get the priorities for those IDs
      const priorityIds = priorityWeeksData.map(pw => pw.priority_id);
      const { data: prioritiesData, error: pError } = await supabase
        .from('priorities')
        .select('*')
        .in('id', priorityIds);
      
      if (pError) throw pError;
      
      // Combine them
      const result: PriorityWithRank[] = priorityWeeksData.map(pw => {
        const priority = prioritiesData?.find(p => p.id === pw.priority_id);
        if (priority) {
          return { ...priority, rank_order: pw.rank_order };
        }
        return null;
      }).filter(Boolean) as PriorityWithRank[];
      
      return result;
    } catch (error) {
      console.error('Error fetching priorities for week:', error);
      // Fallback to local
      const allPriorityWeeks = await getLocalData<PriorityWeek>(KEYS.PRIORITY_WEEKS);
      const allPriorities = await getLocalData<Priority>(KEYS.PRIORITIES);
      const weekPriorities = allPriorityWeeks
        .filter(pw => pw.week_start_date === weekStartDate)
        .sort((a, b) => a.rank_order - b.rank_order);
      
      return weekPriorities.map(pw => {
        const priority = allPriorities.find(p => p.id === pw.priority_id);
        if (priority) {
          return { ...priority, rank_order: pw.rank_order };
        }
        return null;
      }).filter(Boolean) as PriorityWithRank[];
    }
  },

  async assignToWeek(priorityId: string, weekStartDate: string, rankOrder: number): Promise<PriorityWeek | null> {
    try {
      const userId = await getCurrentUserId();
      
      // Check if already exists
      const { data: existing } = await supabase
        .from('priority_weeks')
        .select('*')
        .eq('priority_id', priorityId)
        .eq('week_start_date', weekStartDate)
        .single();
      
      if (existing) {
        // Update rank
        const { data, error } = await supabase
          .from('priority_weeks')
          .update({ rank_order: rankOrder })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          const priorityWeeks = await getLocalData<PriorityWeek>(KEYS.PRIORITY_WEEKS);
          await setLocalData(KEYS.PRIORITY_WEEKS, priorityWeeks.map(pw => pw.id === data.id ? data : pw));
        }
        
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('priority_weeks')
          .insert({
            priority_id: priorityId,
            user_id: userId,
            week_start_date: weekStartDate,
            rank_order: rankOrder,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          const priorityWeeks = await getLocalData<PriorityWeek>(KEYS.PRIORITY_WEEKS);
          await setLocalData(KEYS.PRIORITY_WEEKS, [...priorityWeeks, data]);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error assigning priority to week:', error);
      return null;
    }
  },

  async updateWeekRanks(weekStartDate: string, priorityRanks: { priorityId: string; rankOrder: number }[]): Promise<boolean> {
    try {
      // Update each priority's rank for this week
      for (const { priorityId, rankOrder } of priorityRanks) {
        await this.assignToWeek(priorityId, weekStartDate, rankOrder);
      }
      return true;
    } catch (error) {
      console.error('Error updating week ranks:', error);
      return false;
    }
  },

  async removeFromWeek(priorityId: string, weekStartDate: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('priority_weeks')
        .delete()
        .eq('priority_id', priorityId)
        .eq('week_start_date', weekStartDate);
      
      if (error) throw error;
      
      // Update local cache
      const priorityWeeks = await getLocalData<PriorityWeek>(KEYS.PRIORITY_WEEKS);
      await setLocalData(
        KEYS.PRIORITY_WEEKS,
        priorityWeeks.filter(pw => !(pw.priority_id === priorityId && pw.week_start_date === weekStartDate))
      );
      
      return true;
    } catch (error) {
      console.error('Error removing priority from week:', error);
      return false;
    }
  },

  async getWeeksWithPriorities(startDate: string, endDate: string): Promise<Map<string, PriorityWithRank[]>> {
    try {
      // Get all priority_weeks in range
      const { data: priorityWeeksData, error: pwError } = await supabase
        .from('priority_weeks')
        .select('*')
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .order('rank_order', { ascending: true });
      
      if (pwError) throw pwError;
      
      if (!priorityWeeksData || priorityWeeksData.length === 0) {
        return new Map();
      }
      
      // Get all unique priority IDs
      const priorityIds = [...new Set(priorityWeeksData.map(pw => pw.priority_id))];
      const { data: prioritiesData, error: pError } = await supabase
        .from('priorities')
        .select('*')
        .in('id', priorityIds);
      
      if (pError) throw pError;
      
      // Group by week
      const weekMap = new Map<string, PriorityWithRank[]>();
      
      for (const pw of priorityWeeksData) {
        const priority = prioritiesData?.find(p => p.id === pw.priority_id);
        if (!priority) continue;
        
        const priorityWithRank: PriorityWithRank = { ...priority, rank_order: pw.rank_order };
        
        if (weekMap.has(pw.week_start_date)) {
          weekMap.get(pw.week_start_date)!.push(priorityWithRank);
        } else {
          weekMap.set(pw.week_start_date, [priorityWithRank]);
        }
      }
      
      // Sort each week's priorities by rank
      weekMap.forEach((priorities) => {
        priorities.sort((a, b) => a.rank_order - b.rank_order);
      });
      
      return weekMap;
    } catch (error) {
      console.error('Error fetching weeks with priorities:', error);
      return new Map();
    }
  },
};

// Time Block operations
export const timeBlockService = {
  async getByDate(date: string): Promise<TimeBlock[]> {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        // Update local cache for this date
        const allBlocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
        const otherBlocks = allBlocks.filter(b => b.date !== date);
        await setLocalData(KEYS.TIME_BLOCKS, [...otherBlocks, ...data]);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      const allBlocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
      return allBlocks.filter(b => b.date === date).sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
  },

  async getById(id: string): Promise<TimeBlock | null> {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching time block by id:', error);
      const allBlocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
      return allBlocks.find(b => b.id === id) || null;
    }
  },

  async create(block: Omit<TimeBlock, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<TimeBlock | null> {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('time_blocks')
        .insert({ ...block, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const blocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
        await setLocalData(KEYS.TIME_BLOCKS, [...blocks, data]);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating time block:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<TimeBlock>): Promise<TimeBlock | null> {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const blocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
        const updatedBlocks = blocks.map(b => b.id === id ? data : b);
        await setLocalData(KEYS.TIME_BLOCKS, updatedBlocks);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating time block:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      const blocks = await getLocalData<TimeBlock>(KEYS.TIME_BLOCKS);
      await setLocalData(KEYS.TIME_BLOCKS, blocks.filter(b => b.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting time block:', error);
      return false;
    }
  },
};

