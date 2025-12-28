/**
 * Widget Data Sync Service
 * Syncs widget data to shared storage for iOS App Groups and Android SharedPreferences
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWidgetDataJson, getFinanceWidgetDataJson } from './widgetData';
import { getPlannerWidgetDataJSON } from './plannerWidgetData';

// iOS App Group identifier (must match the one in Xcode)
const IOS_APP_GROUP = 'group.com.sriharigurugubelli.gardenapp';
const WIDGET_DATA_KEY = '@garden/widget_data';
const PLANNER_WIDGET_DATA_KEY = '@garden/planner_widget_data';
const FINANCE_WIDGET_DATA_KEY = '@garden/finance_widget_data';

/**
 * Sync widget data to shared storage
 * This allows the widget extension to access the data
 */
export async function syncWidgetDataToSharedStorage(): Promise<void> {
  try {
    const widgetData = await getWidgetDataJson();
    const plannerWidgetData = await getPlannerWidgetDataJSON();
    const financeWidgetData = await getFinanceWidgetDataJson();
    
    // Store in AsyncStorage as backup
    await AsyncStorage.setItem(WIDGET_DATA_KEY, widgetData);
    await AsyncStorage.setItem(PLANNER_WIDGET_DATA_KEY, plannerWidgetData);
    await AsyncStorage.setItem(FINANCE_WIDGET_DATA_KEY, financeWidgetData);
    
    if (Platform.OS === 'ios') {
      // For iOS, use native module to sync to App Groups
      const { WidgetDataSync } = NativeModules;
      if (WidgetDataSync) {
        try {
          await WidgetDataSync.syncToAppGroup(widgetData);
          // Also sync planner data with a different key
          if (WidgetDataSync.syncPlannerToAppGroup) {
            await WidgetDataSync.syncPlannerToAppGroup(plannerWidgetData);
          }
          // Sync finance data
          if (WidgetDataSync.syncFinanceToAppGroup) {
            await WidgetDataSync.syncFinanceToAppGroup(financeWidgetData);
          }
        } catch (error) {
          console.error('Failed to sync to App Group:', error);
        }
      }
    } else if (Platform.OS === 'android') {
      // For Android, use native module to sync to SharedPreferences
      const { WidgetDataSync } = NativeModules;
      if (WidgetDataSync) {
        try {
          await WidgetDataSync.syncToSharedPreferences(widgetData);
        } catch (error) {
          console.error('Failed to sync to SharedPreferences:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing widget data to shared storage:', error);
  }
}

/**
 * Sync only finance widget data
 * Call this when expenses change
 */
export async function syncFinanceWidgetData(): Promise<void> {
  try {
    const financeWidgetData = await getFinanceWidgetDataJson();
    
    await AsyncStorage.setItem(FINANCE_WIDGET_DATA_KEY, financeWidgetData);
    
    if (Platform.OS === 'ios') {
      const { WidgetDataSync } = NativeModules;
      if (WidgetDataSync?.syncFinanceToAppGroup) {
        try {
          await WidgetDataSync.syncFinanceToAppGroup(financeWidgetData);
        } catch (error) {
          console.error('Failed to sync finance to App Group:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing finance widget data:', error);
  }
}

