import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card } from './Card';
import { Button } from './Button';
import { notificationSettingsService } from '../services/database';
import { notificationService } from '../services/notifications';
import type { NotificationSetting } from '../types';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] = useState<NotificationSetting | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await notificationService.checkPermissions();
    setHasPermissions(granted);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await notificationSettingsService.getAll();
      setSettings(data);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (setting: NotificationSetting) => {
    // If enabling, check permissions first
    if (!setting.enabled) {
      const granted = await notificationService.checkPermissions();
      if (!granted) {
        const requested = await notificationService.requestPermissions();
        if (!requested) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive reminders.',
            [{ text: 'OK' }]
          );
          setHasPermissions(false);
          return;
        }
        setHasPermissions(true);
      }
    }

    const updated = await notificationSettingsService.update(setting.id, {
      enabled: !setting.enabled,
    });
    if (updated) {
      setSettings(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    }
  };

  const handleEdit = (setting: NotificationSetting) => {
    setEditingNotification(setting);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingNotification(null);
    setIsCreating(true);
  };

  const handleSave = async (time: string, customText: string, type: string, days?: string[]) => {
    try {
      // Check permissions before creating/updating
      const granted = await notificationService.checkPermissions();
      if (!granted) {
        const requested = await notificationService.requestPermissions();
        if (!requested) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
        setHasPermissions(true);
      }

      if (editingNotification) {
        // Update existing
        const updated = await notificationSettingsService.update(editingNotification.id, {
          time,
          custom_text: customText,
          type,
          days: days ? JSON.parse(JSON.stringify(days)) : undefined,
        });
        if (updated) {
          setSettings(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        }
      } else {
        // Create new
        const newSetting = await notificationSettingsService.create({
          type: type || `custom_${Date.now()}`,
          enabled: true,
          time,
          custom_text: customText,
          days: days ? JSON.parse(JSON.stringify(days)) : undefined,
        });
        if (newSetting) {
          setSettings(prev => [...prev, newSetting]);
        }
      }

      setEditingNotification(null);
      setIsCreating(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification');
      console.error(error);
    }
  };

  const handleDelete = async (setting: NotificationSetting) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await notificationSettingsService.delete(setting.id);
            if (success) {
              setSettings(prev => prev.filter(s => s.id !== setting.id));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </Card>
    );
  }

  const handleRequestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      setHasPermissions(true);
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert(
        'Permissions Denied',
        'Please enable notifications in your device settings to receive reminders.'
      );
    }
  };


  return (
    <>
      <Card style={styles.card}>
        {!hasPermissions && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              🔔 Notifications are disabled. Enable them to receive reminders.
            </Text>
            <Button
              title="Enable Notifications"
              onPress={handleRequestPermissions}
              color={colors.teal}
              style={styles.permissionButton}
            />
          </View>
        )}
        
        {settings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications set up yet</Text>
            <Text style={styles.emptySubtext}>Create custom reminders for your daily practices</Text>
          </View>
        ) : (
          settings.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.notificationRow,
                index < settings.length - 1 && styles.notificationRowBorder,
              ]}
            >
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationLabel}>
                  {setting.custom_text || 'Reminder'}
                </Text>
                <Text style={styles.notificationTime}>
                  {setting.time || '09:00'} • {setting.enabled ? 'Active' : 'Paused'}
                  {setting.days && setting.days.length > 0 && setting.days.length < 7 && 
                    ` • ${setting.days.length} days`}
                </Text>
              </View>
              <View style={styles.notificationActions}>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => handleToggle(setting)}
                  trackColor={{ false: colors.border, true: colors.teal }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.border}
                />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(setting)}
                >
                  <Text style={styles.iconButtonText}>⚙️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(setting)}
                >
                  <Text style={styles.iconButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonIcon}>＋</Text>
          <Text style={styles.addButtonText}>Add Notification</Text>
        </TouchableOpacity>
      </Card>

      {(editingNotification || isCreating) && (
        <NotificationEditor
          setting={editingNotification}
          onSave={handleSave}
          onClose={() => {
            setEditingNotification(null);
            setIsCreating(false);
          }}
        />
      )}
    </>
  );
};

interface NotificationEditorProps {
  setting: NotificationSetting | null;
  onSave: (time: string, customText: string, type: string, days?: string[]) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday', short: 'M' },
  { value: '2', label: 'Tuesday', short: 'T' },
  { value: '3', label: 'Wednesday', short: 'W' },
  { value: '4', label: 'Thursday', short: 'R' },
  { value: '5', label: 'Friday', short: 'F' },
  { value: '6', label: 'Saturday', short: 'S' },
  { value: '0', label: 'Sunday', short: 'U' },
];

const NotificationEditor: React.FC<NotificationEditorProps> = ({
  setting,
  onSave,
  onClose,
}) => {
  const [time, setTime] = useState(setting?.time || '09:00');
  const [customText, setCustomText] = useState(setting?.custom_text || '');
  const [type, setType] = useState(setting?.type || '');
  const [isRecurring, setIsRecurring] = useState(
    setting ? (setting.days === undefined || setting.days === null || setting.days.length > 0) : true
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    setting?.days || ['0', '1', '2', '3', '4', '5', '6']
  );

  const handleSave = () => {
    if (!customText.trim()) {
      Alert.alert('Error', 'Please enter a notification message');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Error', 'Please enter a time');
      return;
    }
    if (isRecurring && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }
    
    const days = isRecurring ? selectedDays : undefined;
    onSave(time, customText.trim(), type || `custom_${Date.now()}`, days);
  };

  const toggleDay = (dayValue: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue].sort();
      }
    });
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {setting ? 'Edit Notification' : 'New Notification'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={styles.textAreaInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder="e.g., Time for morning gratitude 🙏"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                autoFocus={!setting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time *</Text>
              <TextInput
                style={styles.timeInput}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.formHint}>Use 24-hour format (e.g., 09:00 or 18:30)</Text>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Repeat</Text>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.border, true: colors.teal }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.border}
                />
              </View>
              <Text style={styles.formHint}>
                {isRecurring ? 'Notification will repeat on selected days' : 'One-time notification'}
              </Text>
            </View>

            {isRecurring && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Days</Text>
                <View style={styles.daysGrid}>
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected,
                        ]}
                        onPress={() => toggleDay(day.value)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              title={setting ? 'Save Changes' : 'Create Notification'}
              onPress={handleSave}
              color={colors.teal}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  permissionBanner: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  permissionText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  notificationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textLight,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  iconButtonText: {
    fontSize: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  addButtonIcon: {
    fontSize: 20,
    color: colors.teal,
    marginRight: spacing.sm,
  },
  addButtonText: {
    ...typography.body,
    color: colors.teal,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headerSmall,
    color: colors.text,
  },
  closeButton: {
    ...typography.headerSmall,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  modalScroll: {
    flexGrow: 0,
  },
  buttonContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  formHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  timeInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
  },
  textAreaInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textLight,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  dayButtonText: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

