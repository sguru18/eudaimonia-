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
  
  try {
    const blocks = await timeBlockService.getByDate(dateString);
    
    const widgetBlocks: WidgetTimeBlock[] = blocks.map(block => ({
      id: block.id,
      title: block.title,
      startTime: block.start_time,
      endTime: block.end_time,
      startDisplay: formatTimeDisplay(block.start_time),
      endDisplay: formatTimeDisplay(block.end_time),
    }));
    
    return {
      date: dateString,
      dateDisplay: format(today, 'EEEE, MMM d'),
      blocks: widgetBlocks,
      currentTime,
    };
  } catch (error) {
    console.error('[PlannerWidget] Error getting widget data:', error);
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


