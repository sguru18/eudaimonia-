/**
 * Widget Helper Utilities
 * Functions to update widget data when habits or finances change
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWidgetDataJson, getFinanceWidgetDataJson } from '../services/widgetData';
import { syncWidgetDataToSharedStorage, syncFinanceWidgetData } from '../services/widgetDataSync';

const WIDGET_DATA_KEY = '@garden/widget_data';
const FINANCE_WIDGET_DATA_KEY = '@garden/finance_widget_data';

/**
 * Update widget data cache
 * This should be called whenever habits or completions change
 */
export async function updateWidgetData(): Promise<void> {
  try {
    const widgetData = await getWidgetDataJson();
    await AsyncStorage.setItem(WIDGET_DATA_KEY, widgetData);
    
    // Sync to shared storage for widgets
    await syncWidgetDataToSharedStorage();
  } catch (error) {
    console.error('Error updating widget data:', error);
  }
}

/**
 * Update finance widget data
 * This should be called whenever expenses change
 */
export async function updateFinanceWidgetData(): Promise<void> {
  try {
    const financeData = await getFinanceWidgetDataJson();
    await AsyncStorage.setItem(FINANCE_WIDGET_DATA_KEY, financeData);
    
    // Sync to shared storage for widgets
    await syncFinanceWidgetData();
  } catch (error) {
    console.error('Error updating finance widget data:', error);
  }
}

/**
 * Get cached widget data
 */
export async function getCachedWidgetData(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(WIDGET_DATA_KEY);
  } catch (error) {
    console.error('Error getting cached widget data:', error);
    return null;
  }
}

