import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { priorityService } from '../../services/database';
import type { Priority } from '../../types';

export const PriorityListScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [remountKey, setRemountKey] = useState(0);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPriorities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await priorityService.getAll();
      setPriorities(data);
    } catch (error) {
      console.error('Error loading priorities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPriorities();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPriorities();
      setRemountKey(prev => prev + 1);
    }, [loadPriorities])
  );

  const handleAddPriority = () => {
    router.push('/(tabs)/priorities/priority-detail');
  };

  const handleEditPriority = (priority: Priority) => {
    router.push(`/(tabs)/priorities/priority-detail?priorityId=${priority.id}`);
  };

  const handleDeletePriority = (priority: Priority) => {
    Alert.alert(
      'Delete Priority',
      `Are you sure you want to delete "${priority.name}"? This will also remove it from all weeks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await priorityService.delete(priority.id);
            if (success) {
              loadPriorities();
            } else {
              Alert.alert('Error', 'Failed to delete priority');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPriorities} />
        }
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <Header size="large" color={colors.teal}>
            All Priorities
          </Header>

          <Text style={styles.subtitle}>
            Create and manage your priorities. Tap to edit, swipe or long-press to delete.
          </Text>

          {loading && priorities.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.teal} />
              <Text style={styles.loadingText}>Loading priorities...</Text>
            </View>
          ) : priorities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>
                No priorities yet.{'\n'}Create your first priority to get started.
              </Text>
            </View>
          ) : (
            <View style={styles.priorityList}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={styles.priorityCard}
                  onPress={() => handleEditPriority(priority)}
                  onLongPress={() => handleDeletePriority(priority)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: priority.color }]} />
                  <View style={styles.priorityInfo}>
                    <Text style={styles.priorityName}>{priority.name}</Text>
                    <Text style={styles.priorityDate}>
                      Created {new Date(priority.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePriority(priority)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Button
            title="Add New Priority"
            onPress={handleAddPriority}
            color={colors.teal}
            style={styles.addButton}
          />
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
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  priorityList: {
    gap: spacing.md,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  priorityDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
  addButton: {
    marginTop: spacing.xl,
  },
});

