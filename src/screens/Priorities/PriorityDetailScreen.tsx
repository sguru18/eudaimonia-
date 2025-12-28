import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { priorityService } from '../../services/database';
import type { Priority } from '../../types';

// Predefined color palette for priorities
const COLOR_PALETTE = [
  '#5A7F7A', // Teal
  '#8FA87D', // Sage green
  '#9EC6C6', // Mint
  '#E1C16E', // Gold/Sand
  '#D4B6A1', // Parchment/tan
  '#D4A5A5', // Soft red
  '#A5A5D4', // Soft purple
  '#7AA5D4', // Soft blue
  '#D4A5C6', // Soft pink
  '#A5D4B6', // Soft green
  '#D4C6A5', // Soft orange
  '#6B8E8E', // Dark teal
];

export const PriorityDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { priorityId } = useLocalSearchParams<{ priorityId?: string }>();
  const [remountKey, setRemountKey] = useState(0);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingPriority, setExistingPriority] = useState<Priority | null>(null);

  const isEditing = !!priorityId;

  useEffect(() => {
    if (priorityId) {
      loadPriority();
    }
  }, [priorityId]);

  useFocusEffect(
    useCallback(() => {
      setRemountKey(prev => prev + 1);
    }, [])
  );

  const loadPriority = async () => {
    if (!priorityId) return;
    
    setLoading(true);
    try {
      const priority = await priorityService.getById(priorityId);
      if (priority) {
        setExistingPriority(priority);
        setName(priority.name);
        setColor(priority.color);
      }
    } catch (error) {
      console.error('Error loading priority:', error);
      Alert.alert('Error', 'Failed to load priority');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a priority name');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && existingPriority) {
        await priorityService.update(existingPriority.id, {
          name: name.trim(),
          color,
        });
      } else {
        await priorityService.create({
          name: name.trim(),
          color,
        });
      }
      router.back();
    } catch (error) {
      console.error('Error saving priority:', error);
      Alert.alert('Error', 'Failed to save priority');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingPriority) return;

    Alert.alert(
      'Delete Priority',
      `Are you sure you want to delete "${existingPriority.name}"? This will also remove it from all weeks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await priorityService.delete(existingPriority.id);
            if (success) {
              router.back();
            } else {
              Alert.alert('Error', 'Failed to delete priority');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={{ height: insets.top }} />
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <Header size="large" color={colors.teal}>
            {isEditing ? 'Edit Priority' : 'New Priority'}
          </Header>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={[styles.previewBar, { backgroundColor: color }]}>
              <Text style={styles.previewText}>
                {name.trim() || 'Priority Name'}
              </Text>
            </View>
          </View>

          {/* Name Input */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter priority name..."
              placeholderTextColor={colors.textMuted}
              autoFocus={!isEditing}
              maxLength={50}
            />
          </Card>

          {/* Color Picker */}
          <Card style={styles.colorCard}>
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Text style={styles.colorCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Save Button */}
          <Button
            title={saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Priority')}
            onPress={handleSave}
            color={colors.teal}
            style={styles.saveButton}
            disabled={saving || !name.trim()}
          />

          {/* Delete Button (only for editing) */}
          {isEditing && existingPriority && (
            <Button
              title="Delete Priority"
              onPress={handleDelete}
              variant="outline"
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.teal,
    fontWeight: '600',
  },
  previewSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  previewBar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  previewText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputCard: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    height: 52,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'center',
  },
  colorCard: {
    marginBottom: spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  colorCheckmark: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});

