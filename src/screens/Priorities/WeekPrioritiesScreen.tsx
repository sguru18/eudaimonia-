import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { format, addDays, parseISO } from 'date-fns';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { priorityService, priorityWeekService } from '../../services/database';
import type { Priority, PriorityWithRank } from '../../types';

export const WeekPrioritiesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weekStart } = useLocalSearchParams<{ weekStart: string }>();
  const [remountKey, setRemountKey] = useState(0);
  
  const [allPriorities, setAllPriorities] = useState<Priority[]>([]);
  const [weekPriorities, setWeekPriorities] = useState<PriorityWithRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse weekStart as local date to avoid timezone issues
  const weekStartDate = weekStart ? parseISO(weekStart) : new Date();
  const weekEndDate = addDays(weekStartDate, 6);

  const loadData = useCallback(async () => {
    if (!weekStart) return;
    
    setLoading(true);
    try {
      // Load all priorities
      const priorities = await priorityService.getAll();
      setAllPriorities(priorities);
      
      // Load priorities assigned to this week
      const assigned = await priorityWeekService.getByWeek(weekStart);
      setWeekPriorities(assigned);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [weekStart]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setRemountKey(prev => prev + 1);
    }, [loadData])
  );

  // Get priorities not yet assigned to this week
  const unassignedPriorities = allPriorities.filter(
    p => !weekPriorities.find(wp => wp.id === p.id)
  );

  const handleAddPriority = (priority: Priority) => {
    const newRank = weekPriorities.length + 1;
    const newPriorityWithRank: PriorityWithRank = {
      ...priority,
      rank_order: newRank,
    };
    setWeekPriorities([...weekPriorities, newPriorityWithRank]);
    setHasChanges(true);
  };

  const handleRemovePriority = (priorityId: string) => {
    setWeekPriorities(prev => {
      const filtered = prev.filter(p => p.id !== priorityId);
      // Recalculate ranks
      return filtered.map((p, idx) => ({ ...p, rank_order: idx + 1 }));
    });
    setHasChanges(true);
  };

  const handleMoveUp = (priorityId: string) => {
    const idx = weekPriorities.findIndex(p => p.id === priorityId);
    if (idx <= 0) return;
    
    const newList = [...weekPriorities];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    // Recalculate ranks
    const reranked = newList.map((p, i) => ({ ...p, rank_order: i + 1 }));
    setWeekPriorities(reranked);
    setHasChanges(true);
  };

  const handleMoveDown = (priorityId: string) => {
    const idx = weekPriorities.findIndex(p => p.id === priorityId);
    if (idx < 0 || idx >= weekPriorities.length - 1) return;
    
    const newList = [...weekPriorities];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    // Recalculate ranks
    const reranked = newList.map((p, i) => ({ ...p, rank_order: i + 1 }));
    setWeekPriorities(reranked);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!weekStart) return;
    
    setSaving(true);
    try {
      // First, remove all priorities from this week
      for (const priority of allPriorities) {
        await priorityWeekService.removeFromWeek(priority.id, weekStart);
      }
      
      // Then add the new priorities with their ranks
      for (const priority of weekPriorities) {
        await priorityWeekService.assignToWeek(priority.id, weekStart, priority.rank_order);
      }
      
      setHasChanges(false);
      Alert.alert('Saved', 'Week priorities updated successfully');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: async () => { await handleSave(); router.back(); } },
        ]
      );
    } else {
      router.back();
    }
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
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            {hasChanges && (
              <TouchableOpacity onPress={handleSave} style={styles.saveHeaderButton}>
                <Text style={styles.saveHeaderButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          <Header size="large" color={colors.teal}>
            Week Priorities
          </Header>

          <Text style={styles.weekRange}>
            {format(weekStartDate, 'MMMM d')} - {format(weekEndDate, 'd, yyyy')}
          </Text>

          {/* Assigned Priorities - Ordered by importance */}
          <Text style={styles.sectionTitle}>This Week's Priorities</Text>
          <Text style={styles.sectionSubtitle}>
            Top = Most Important. Use arrows to reorder.
          </Text>

          {weekPriorities.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No priorities assigned to this week.{'\n'}Add priorities below.
              </Text>
            </Card>
          ) : (
            <View style={styles.priorityList}>
              {weekPriorities.map((priority, idx) => (
                <View key={priority.id} style={styles.priorityRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{idx + 1}</Text>
                  </View>
                  <View
                    style={[styles.priorityBar, { backgroundColor: priority.color }]}
                  >
                    <Text style={styles.priorityBarText} numberOfLines={1}>
                      {priority.name}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.arrowButton, idx === 0 && styles.arrowButtonDisabled]}
                      onPress={() => handleMoveUp(priority.id)}
                      disabled={idx === 0}
                    >
                      <Text style={[styles.arrowText, idx === 0 && styles.arrowTextDisabled]}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.arrowButton, idx === weekPriorities.length - 1 && styles.arrowButtonDisabled]}
                      onPress={() => handleMoveDown(priority.id)}
                      disabled={idx === weekPriorities.length - 1}
                    >
                      <Text style={[styles.arrowText, idx === weekPriorities.length - 1 && styles.arrowTextDisabled]}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePriority(priority.id)}
                    >
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Unassigned Priorities */}
          {unassignedPriorities.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.addSectionTitle]}>Add to This Week</Text>
              <View style={styles.unassignedList}>
                {unassignedPriorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    style={styles.unassignedItem}
                    onPress={() => handleAddPriority(priority)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorDot, { backgroundColor: priority.color }]} />
                    <Text style={styles.unassignedText}>{priority.name}</Text>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Create new priority link */}
          <TouchableOpacity
            style={styles.createNewLink}
            onPress={() => router.push('/(tabs)/priorities/priority-detail')}
          >
            <Text style={styles.createNewText}>+ Create New Priority</Text>
          </TouchableOpacity>

          {/* Save Button */}
          {hasChanges && (
            <Button
              title={saving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              color={colors.teal}
              style={styles.saveButton}
              disabled={saving}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saveHeaderButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.teal,
    borderRadius: borderRadius.sm,
  },
  saveHeaderButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  weekRange: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  emptyCard: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  priorityList: {
    gap: spacing.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  priorityBar: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  priorityBarText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  arrowTextDisabled: {
    color: colors.textMuted,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
  },
  addSectionTitle: {
    marginTop: spacing.xl,
  },
  unassignedList: {
    gap: spacing.sm,
  },
  unassignedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  unassignedText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  addIcon: {
    fontSize: 20,
    color: colors.teal,
    fontWeight: '600',
  },
  createNewLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createNewText: {
    ...typography.body,
    color: colors.teal,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

