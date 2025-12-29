/**
 * Planner Widget Data Service
 * Prepares time block data for the iOS widget
 */

import { format } from 'date-fns';
import { timeBlockService } from './database';
import type { TimeBlock } from '../types';

export interface WidgetTimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  startDisplay: string; // "9:00 AM"
  endDisplay: string; // "10:00 AM"
}

export interface PlannerWidgetData {
  date: string; // YYYY-MM-DD
  dateDisplay: string; // "Monday, Dec 30"
  blocks: WidgetTimeBlock[];
  currentTime: string; // HH:MM
}

// Format time for display (12-hour format)
const formatTimeDisplay = (time: string): string => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
};

/**
 * Get today's time blocks formatted for the widget
 */
export async function getPlannerWidgetData(): Promise<PlannerWidgetData> {
  const today = new Date();
  const dateString = format(today, 'yyyy-MM-dd');
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log('[PlannerWidgetData] 📅 Fetching data for date:', dateString);
  console.log('[PlannerWidgetData] 🕐 Current time:', currentTime);
  
  try {
    const blocks = await timeBlockService.getByDate(dateString);
    console.log('[PlannerWidgetData] 📋 Found', blocks.length, 'blocks for', dateString);
    
    const widgetBlocks: WidgetTimeBlock[] = blocks.map(block => {
      // Remove seconds from time if present (convert "13:00:00" to "13:00")
      const formatTimeForWidget = (time: string) => {
        return time.includes(':') && time.split(':').length === 3 
          ? time.substring(0, 5) // Take only HH:MM
          : time;
      };
      
      return {
        id: block.id,
        title: block.title,
        startTime: formatTimeForWidget(block.start_time),
        endTime: formatTimeForWidget(block.end_time),
        startDisplay: formatTimeDisplay(block.start_time),
        endDisplay: formatTimeDisplay(block.end_time),
      };
    });
    
    console.log('[PlannerWidgetData] ✅ Created', widgetBlocks.length, 'widget blocks');
    widgetBlocks.forEach((block, index) => {
      console.log(`[PlannerWidgetData]   Block ${index + 1}: ${block.title} (${block.startTime} - ${block.endTime})`);
    });
    
    const result = {
      date: dateString,
      dateDisplay: format(today, 'EEEE, MMM d'),
      blocks: widgetBlocks,
      currentTime,
    };
    
    console.log('[PlannerWidgetData] 📦 Final data:', JSON.stringify(result, null, 2).substring(0, 500));
    
    return result;
  } catch (error) {
    console.error('[PlannerWidgetData] ❌ Error getting widget data:', error);
    return {
      date: dateString,
      dateDisplay: format(today, 'EEEE, MMM d'),
      blocks: [],
      currentTime,
    };
  }
}

/**
 * Get planner widget data as JSON string for native module
 */
export async function getPlannerWidgetDataJSON(): Promise<string> {
  const data = await getPlannerWidgetData();
  return JSON.stringify(data);
}


