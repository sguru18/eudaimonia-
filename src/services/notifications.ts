/**
 * Notification Service
 * Handle scheduling and managing notifications
 * 
 * NOTE: For full implementation, install and configure:
 * - @react-native-community/push-notification-ios (iOS)
 * - react-native-push-notification (Android)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@garden/notification_settings';

export interface NotificationSetting {
  id: string;
  type: string;
  enabled: boolean;
  time?: string;
  days?: string[];
  customText?: string;
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: 'gratitude_morning',
    type: 'daily_prompt',
    enabled: true,
    time: '09:00',
    customText: 'Take a moment for gratitude 🙏',
  },
  {
    id: 'reflection_evening',
    type: 'daily_prompt',
    enabled: false,
    time: '20:00',
    customText: 'Evening reflection time ✨',
  },
  {
    id: 'meal_prep_reminder',
    type: 'meal_reminder',
    enabled: false,
    time: '18:00',
    customText: 'Time to prep tomorrow\'s meals 🥗',
  },
  {
    id: 'finance_weekly_review',
    type: 'finance_reminder',
    enabled: false,
    time: '10:00',
    days: ['Sunday'],
    customText: 'Review this week\'s spending 💰',
  },
];

export const notificationService = {
  async getSettings(): Promise<NotificationSetting[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSetting(setting: NotificationSetting): Promise<void> {
    try {
      const settings = await this.getSettings();
      const index = settings.findIndex(s => s.id === setting.id);
      
      if (index >= 0) {
        settings[index] = setting;
      } else {
        settings.push(setting);
      }
      
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      
      // Schedule or cancel notification based on enabled state
      if (setting.enabled) {
        this.scheduleNotification(setting);
      } else {
        this.cancelNotification(setting.id);
      }
    } catch (error) {
      console.error('Error saving notification setting:', error);
    }
  },

  scheduleNotification(setting: NotificationSetting): void {
    console.log('Scheduling notification:', setting);
    
    // TODO: Implement actual notification scheduling
    // Example using react-native-push-notification:
    /*
    PushNotification.localNotificationSchedule({
      id: setting.id,
      title: 'Eudaimonia',
      message: setting.customText || 'Time for mindful reflection',
      date: this.getScheduleDate(setting.time),
      repeatType: 'day', // or 'week' based on setting
      allowWhileIdle: true,
    });
    */
  },

  cancelNotification(id: string): void {
    console.log('Cancelling notification:', id);
    
    // TODO: Implement actual notification cancellation
    // Example:
    // PushNotification.cancelLocalNotification(id);
  },

  async requestPermissions(): Promise<boolean> {
    try {
      // TODO: Request notification permissions
      // This would vary by platform
      console.log('Requesting notification permissions...');
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  getScheduleDate(time?: string): Date {
    const [hours, minutes] = (time || '09:00').split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  },
};

