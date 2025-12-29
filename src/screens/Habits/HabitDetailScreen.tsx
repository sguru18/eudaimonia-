import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { habitService } from '../../services/database';
import type { Habit } from '../../types';

const PRESET_COLORS = [
  '#9EC6C6',
  '#8FA87D',
  '#E1C16E',
  '#D4B6A1',
];

export const HabitDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const habitId = params.habitId as string;
  const weekStart = params.weekStart as string;
  
  const [existingHabit, setExistingHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadHabit = async () => {
      if (habitId) {
        try {
          const habit = await habitService.getById(habitId);
          if (habit) {
            setExistingHabit(habit);
            setName(habit.name);
            setColor(habit.color || PRESET_COLORS[0]);
            setReminderEnabled(habit.reminder_enabled || false);
            setReminderText(habit.reminder_text || '');
            setReminderTime(habit.reminder_time || '09:00');
          }
        } catch (error) {
          console.error('Error loading habit:', error);
        }
      }
      setLoading(false);
    };
    loadHabit();
  }, [habitId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    setSaving(true);
    try {
      if (existingHabit) {
        await habitService.update(existingHabit.id, {
          name: name.trim(),
          color,
          reminder_enabled: reminderEnabled,
          reminder_text: reminderText.trim() || undefined,
          reminder_time: reminderTime,
        });
      } else {
        // Use the weekStart from params, or default to current week's Monday
        const weekStartDate = weekStart || (() => {
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
          const monday = new Date(now.setDate(diff));
          return monday.toISOString().split('T')[0];
        })();

        await habitService.create({
          name: name.trim(),
          color,
          reminder_enabled: reminderEnabled,
          reminder_text: reminderText.trim() || undefined,
          reminder_time: reminderTime,
          sort_order: 0,
          week_start_date: weekStartDate,
        });
      }
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingHabit) return;

    Alert.alert(
      'Delete Habit',
      'Are you sure? This will delete this habit for this week only. Previous weeks will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await habitService.delete(existingHabit.id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: insets.top }}>
        <View style={styles.content}>
          <Header size="medium" color={colors.habits}>
            {existingHabit ? 'Edit Habit' : 'New Habit'}
          </Header>

          <Card style={styles.card}>
            <Input
              label="Habit Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning meditation"
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map(presetColor => (
                <TouchableOpacity
                  key={presetColor}
                  style={[
                    styles.colorButton,
                    { backgroundColor: presetColor },
                    color === presetColor && styles.colorButtonActive,
                  ]}
                  onPress={() => setColor(presetColor)}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Daily Reminder</Text>
                <Text style={styles.sublabel}>Gentle nudge at a set time</Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.habits }}
                thumbColor={colors.white}
              />
            </View>

            {reminderEnabled && (
              <>
                <Input
                  label="Reminder Text"
                  value={reminderText}
                  onChangeText={setReminderText}
                  placeholder="e.g., Take a deep breath 😊"
                />

                <Input
                  label="Time"
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="09:00"
                />
              </>
            )}
          </Card>

          <Button
            title={existingHabit ? 'Save Changes' : 'Create Habit'}
            onPress={handleSave}
            loading={saving}
            color={colors.habits}
            style={styles.saveButton}
          />

          {existingHabit && (
            <Button
              title="Delete Habit"
              onPress={handleDelete}
              variant="ghost"
              color={colors.error}
              style={styles.deleteButton}
            />
          )}
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
  card: {
    marginTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  switchLabel: {
    flex: 1,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

