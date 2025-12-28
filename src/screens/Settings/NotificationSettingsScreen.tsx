import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { notificationService, NotificationSetting } from '../../services/notifications';

export const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = async (setting: NotificationSetting) => {
    const updated = { ...setting, enabled: !setting.enabled };
    await notificationService.saveSetting(updated);
    loadSettings();
  };

  const handleUpdateTime = async (setting: NotificationSetting, time: string) => {
    const updated = { ...setting, time };
    await notificationService.saveSetting(updated);
    loadSettings();
  };

  const handleUpdateText = async (setting: NotificationSetting, text: string) => {
    const updated = { ...setting, customText: text };
    await notificationService.saveSetting(updated);
  };

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted');
    } else {
      Alert.alert('Denied', 'Please enable notifications in Settings');
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'daily_prompt':
        return 'Daily Prompt';
      case 'meal_reminder':
        return 'Meal Reminder';
      case 'finance_reminder':
        return 'Finance Check-in';
      case 'habit_reminder':
        return 'Habit Reminder';
      default:
        return 'Notification';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'daily_prompt':
        return colors.writing;
      case 'meal_reminder':
        return colors.food;
      case 'finance_reminder':
        return colors.finances;
      case 'habit_reminder':
        return colors.habits;
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header size="large" color={colors.teal}>
            Notifications
          </Header>
          <Text style={styles.subtitle}>
            Gentle reminders, entirely under your control
          </Text>

          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>
              ℹ️ Notifications help you stay mindful without being intrusive. 
              You can customize each reminder to match your rhythm.
            </Text>
            <Button
              title="Enable Notifications"
              onPress={requestPermissions}
              variant="outline"
              size="small"
              color={colors.teal}
              style={styles.permissionButton}
            />
          </Card>

          {settings.map(setting => (
            <Card key={setting.id} style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <View style={styles.headerLeft}>
                  <View 
                    style={[
                      styles.typeBadge, 
                      { backgroundColor: getTypeColor(setting.type) }
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getTypeLabel(setting.type)}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => handleToggle(setting)}
                  trackColor={{ false: colors.border, true: colors.teal }}
                  thumbColor={colors.white}
                />
              </View>

              {setting.enabled && (
                <>
                  <Input
                    label="Reminder Text"
                    value={setting.customText || ''}
                    onChangeText={(text) => handleUpdateText(setting, text)}
                    placeholder="Custom reminder message"
                  />
                  
                  <Input
                    label="Time"
                    value={setting.time || '09:00'}
                    onChangeText={(time) => handleUpdateTime(setting, time)}
                    placeholder="HH:MM"
                  />

                  {setting.days && setting.days.length > 0 && (
                    <View style={styles.daysSection}>
                      <Text style={styles.label}>Days</Text>
                      <Text style={styles.daysText}>
                        {setting.days.join(', ')}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card>
          ))}

          <Card style={styles.quietCard}>
            <Text style={styles.quietTitle}>Quiet Mode</Text>
            <Text style={styles.quietText}>
              Temporarily silence all notifications when you need focused time.
            </Text>
            <Button
              title="Enable Quiet Mode"
              onPress={() => Alert.alert('Quiet Mode', 'Coming soon')}
              variant="outline"
              color={colors.textMuted}
              style={styles.quietButton}
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.beige,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  permissionButton: {
    marginTop: spacing.sm,
  },
  settingCard: {
    marginTop: spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  typeBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  daysSection: {
    marginTop: spacing.md,
  },
  daysText: {
    ...typography.body,
    color: colors.textLight,
  },
  quietCard: {
    marginTop: spacing.xxxl,
    borderWidth: 2,
    borderColor: colors.border,
  },
  quietTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  quietText: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  quietButton: {
    width: '100%',
  },
});

