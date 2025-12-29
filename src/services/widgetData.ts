/**
 * Widget Data Service
 * Provides data for lock screen widgets
 */

import { format } from 'date-fns';
import { expenseService } from './database';

export interface FinanceWidgetData {
  todayTotal: number;
  expenseCount: number;
  lastUpdated: string;
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
 * Get finance widget data as JSON string
 */
export async function getFinanceWidgetDataJson(): Promise<string> {
  const data = await getTodaySpendingData();
  return JSON.stringify(data);
}

