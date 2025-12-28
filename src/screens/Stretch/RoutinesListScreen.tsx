import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StretchingRoutinesDB, StretchingExercisesDB } from '../../services/database';
import { colors, typography, spacing } from '../../theme';
import { Card, Button, EmptyState, LoadingSpinner } from '../../components';
import type { StretchingRoutine } from '../../types';

export const RoutinesListScreen = () => {
  const router = useRouter();
  const [routines, setRoutines] = useState<StretchingRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutines = useCallback(async () => {
    const data = await StretchingRoutinesDB.getAll();
    setRoutines(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadRoutines();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutines();
  };


  const handleCreateNew = () => {
    router.push('/(tabs)/stretch/create-routine');
  };

  const handleEditRoutine = (routine: StretchingRoutine) => {
    router.push(`/(tabs)/stretch/create-routine?routineId=${routine.id}`);
  };

  const handleStartRoutine = (routine: StretchingRoutine) => {
    router.push(`/(tabs)/stretch/active-timer?routineId=${routine.id}`);
  };

  const handleDeleteRoutine = (routine: StretchingRoutine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StretchingExercisesDB.deleteByRoutineId(routine.id);
            await StretchingRoutinesDB.delete(routine.id);
            loadRoutines();
          },
        },
      ]
    );
  };

  const renderRoutineItem = ({ item }: { item: StretchingRoutine }) => (
    <Card style={styles.routineCard}>
      <TouchableOpacity 
        onPress={() => handleStartRoutine(item)}
        style={styles.routineContent}
      >
        <View style={styles.routineHeader}>
          <Text style={styles.routineName}>{item.name}</Text>
          <Text style={styles.icon}>🧘</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.routineActions}>
        <TouchableOpacity
          onPress={() => handleEditRoutine(item)}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteRoutine(item)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {routines.length === 0 ? (
          <EmptyState
            icon="🧘"
            title="No Stretching Routines Yet"
            message="Create your first routine to get started with mindful stretching."
          />
        ) : (
          <FlatList
            data={routines}
            renderItem={renderRoutineItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.teal}
              />
            }
          />
        )}
        
        <Button
          title="Create New Routine"
          onPress={handleCreateNew}
          style={styles.createButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  routineCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  routineContent: {
    padding: spacing.lg,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginLeft: spacing.md,
  },
  routineActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.teal,
    fontWeight: '600',
  },
  deleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  deleteButtonText: {
    color: colors.error,
  },
  createButton: {
    marginTop: spacing.md,
  },
});

