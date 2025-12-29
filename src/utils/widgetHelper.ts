/**
 * Widget Helper Utilities
 * Functions to update planner widget data when time blocks change
 */

import { syncPlannerWidgetData } from '../services/widgetDataSync';

/**
 * Update planner widget data
 * This should be called whenever time blocks change
 */
export async function updatePlannerWidgetData(): Promise<void> {
  try {
    await syncPlannerWidgetData();
  } catch (error) {
    console.error('Error updating planner widget data:', error);
  }
}


