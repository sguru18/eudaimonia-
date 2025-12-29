/**
 * Notification Service
 * Handle scheduling and managing notifications using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationSetting } from '../types';

// Configure notification behavior
// This handler controls how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // On iOS, this ensures notifications show even when app is in foreground
    // Background/lock screen notifications are handled by the system automatically
  }),
});

export const notificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // On iOS, explicitly request alert, badge, and sound permissions
      const permissionRequest: Notifications.NotificationPermissionsRequest = Platform.OS === 'ios' 
        ? {
            ios: {
              allowAlert: true,
              allowBadge: false,
              allowSound: true,
              allowDisplayInCarPlay: true,
              allowCriticalAlerts: false,
              provideAppNotificationSettings: false,
              allowProvisional: false,
              allowAnnouncements: false,
            },
          }
        : {};

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync(permissionRequest);
        finalStatus = status;
      }

      // On iOS, also check if alert permission is specifically granted
      if (Platform.OS === 'ios' && finalStatus === 'granted') {
        const permissions = await Notifications.getPermissionsAsync();
        if (permissions.ios?.status === Notifications.IosAuthorizationStatus.DENIED) {
          console.warn('iOS notification alert permission denied');
          return false;
        }
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted. Status:', finalStatus);
        return false;
      }

      // On Android, also request exact alarm permissions if needed
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          showBadge: false,
        });
      }

      console.log('Notification permissions granted successfully');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Check if permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  },

  /**
   * Schedule a notification based on a notification setting
   */
  async scheduleNotification(setting: NotificationSetting): Promise<void> {
    try {
      // First check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Cannot schedule notification: permissions not granted');
        return;
      }

      if (!setting.enabled || !setting.time) {
        return;
      }

      // Cancel any existing notification with this ID
      await this.cancelNotification(setting.id);

      const [hours, minutes] = (setting.time || '09:00').split(':').map(Number);
      
      // If days are specified and not all 7 days, schedule for each selected day
      if (setting.days && setting.days.length > 0 && setting.days.length < 7) {
        // Schedule for each selected day
        for (const dayStr of setting.days) {
          const dayOfWeek = parseInt(dayStr, 10);
          const trigger = this.getWeeklyTrigger(hours, minutes, dayOfWeek);
          
          await Notifications.scheduleNotificationAsync({
            identifier: `${setting.id}_${dayOfWeek}`,
            content: {
              title: 'Eudaimonia',
              body: setting.custom_text || 'Time for mindful reflection',
              sound: true,
              data: { notificationId: setting.id, type: setting.type },
            },
            trigger,
          });
        }
      } else {
        // Daily notification (either no days specified, or all 7 days selected)
        const trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };

        await Notifications.scheduleNotificationAsync({
          identifier: setting.id,
          content: {
            title: 'Eudaimonia',
            body: setting.custom_text || 'Time for mindful reflection',
            sound: true,
            data: { notificationId: setting.id, type: setting.type },
          },
          trigger,
        });
      }

      const scheduled = await this.getAllScheduledNotifications();
      console.log(`Notification scheduled: ${setting.id}. Total scheduled: ${scheduled.length}`);
      console.log('Scheduled notification details:', {
        id: setting.id,
        time: setting.time,
        days: setting.days,
        enabled: setting.enabled,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error; // Re-throw to help with debugging
    }
  },

  /**
   * Cancel a notification by ID
   */
  async cancelNotification(id: string): Promise<void> {
    try {
      // Cancel all variations (daily and weekly)
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of allNotifications) {
        if (
          notification.identifier === id ||
          notification.identifier.startsWith(`${id}_`)
        ) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log('Notification cancelled:', id);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  },

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  /**
   * Get weekly trigger for a specific day of week
   * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   * expo-notifications uses 1-7 where 1=Monday, 7=Sunday
   */
  getWeeklyTrigger(hours: number, minutes: number, dayOfWeek: number): Notifications.WeeklyTriggerInput {
    // Convert: 0 (Sunday) -> 7, 1 (Monday) -> 1, ..., 6 (Saturday) -> 6
    const weekday = dayOfWeek === 0 ? 7 : dayOfWeek;
    return {
      weekday,
      hour: hours,
      minute: minutes,
      repeats: true,
    };
  },

  /**
   * Reschedule all notifications from settings
   */
  async rescheduleAllNotifications(settings: NotificationSetting[]): Promise<void> {
    try {
      // Cancel all existing notifications
      await this.cancelAllNotifications();

      // Schedule all enabled notifications
      for (const setting of settings) {
        if (setting.enabled) {
          await this.scheduleNotification(setting);
        }
      }
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
    }
  },
};

