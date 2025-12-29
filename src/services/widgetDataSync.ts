/**
 * Widget Data Sync Service
 * Syncs planner widget data to shared storage for iOS App Groups and Android SharedPreferences
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlannerWidgetDataJSON } from './plannerWidgetData';

// iOS App Group identifier (must match the one in Xcode)
const IOS_APP_GROUP = 'group.com.sriharigurugubelli.gardenapp';
const PLANNER_WIDGET_DATA_KEY = '@garden/planner_widget_data';

/**
 * Sync widget data to shared storage
 * This allows the widget extension to access the data
 */
export async function syncWidgetDataToSharedStorage(): Promise<void> {
  try {
    const plannerWidgetData = await getPlannerWidgetDataJSON();
    
    // Store in AsyncStorage as backup
    await AsyncStorage.setItem(PLANNER_WIDGET_DATA_KEY, plannerWidgetData);
    
    if (Platform.OS === 'ios') {
      // For iOS, use native module to sync to App Groups
      const { WidgetDataSync } = NativeModules;
      if (WidgetDataSync) {
        try {
          // Sync planner data
          if (WidgetDataSync.syncPlannerToAppGroup) {
            await WidgetDataSync.syncPlannerToAppGroup(plannerWidgetData);
          }
        } catch (error) {
          console.error('Failed to sync to App Group:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing widget data to shared storage:', error);
  }
}

/**
 * Sync only planner widget data
 * Call this when time blocks change
 */
export async function syncPlannerWidgetData(): Promise<void> {
  try {
    console.log('[WidgetSync] Starting planner widget data sync...');
    const plannerWidgetData = await getPlannerWidgetDataJSON();
    console.log('[WidgetSync] Got planner widget data, length:', plannerWidgetData.length);
    console.log('[WidgetSync] Data preview:', plannerWidgetData.substring(0, 200));
    
    await AsyncStorage.setItem(PLANNER_WIDGET_DATA_KEY, plannerWidgetData);
    console.log('[WidgetSync] Saved to AsyncStorage');
    
    if (Platform.OS === 'ios') {
      // Try to get the module - sometimes it's under a different name
      const { WidgetDataSync } = NativeModules;
      console.log('[WidgetSync] NativeModules object:', Object.keys(NativeModules));
      console.log('[WidgetSync] NativeModules.WidgetDataSync:', WidgetDataSync);
      console.log('[WidgetSync] WidgetDataSync type:', typeof WidgetDataSync);
      console.log('[WidgetSync] Available methods:', WidgetDataSync ? Object.keys(WidgetDataSync) : 'none');
      
      if (WidgetDataSync && typeof WidgetDataSync.syncPlannerToAppGroup === 'function') {
        try {
          console.log('[WidgetSync] Calling native syncPlannerToAppGroup...');
          await WidgetDataSync.syncPlannerToAppGroup(plannerWidgetData);
          console.log('[WidgetSync] ✅ Successfully synced to App Group');
        } catch (error) {
          console.error('[WidgetSync] ❌ Failed to sync planner to App Group:', error);
          console.error('[WidgetSync] Error details:', JSON.stringify(error));
        }
      } else {
        console.warn('[WidgetSync] ⚠️ WidgetDataSync module not available - you may need to rebuild the app');
        console.warn('[WidgetSync] The module was added/changed - please do a clean rebuild:');
        console.warn('[WidgetSync]   1. In Xcode: Product → Clean Build Folder (Cmd+Shift+K)');
        console.warn('[WidgetSync]   2. Rebuild the app');
      }
    }
  } catch (error) {
    console.error('[WidgetSync] ❌ Error syncing planner widget data:', error);
  }
}


