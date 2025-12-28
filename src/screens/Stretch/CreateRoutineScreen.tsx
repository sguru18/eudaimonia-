import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StretchingRoutinesDB, StretchingExercisesDB } from '../../services/database';
import { colors, typography, spacing } from '../../theme';
import { Card, Button, Input } from '../../components';
import type { StretchingExercise } from '../../types';

interface ExerciseInput {
  id?: string;
  name: string;
  duration_seconds: number;
  order_index: number;
}

export const CreateRoutineScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routineId = params.routineId as string;
  
  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (routineId) {
      loadRoutine();
    }
  }, [routineId]);

  const loadRoutine = async () => {
    if (!routineId) return;
    
    const routine = await StretchingRoutinesDB.getById(routineId);
    if (routine) {
      setRoutineName(routine.name);
    }
    
    const loadedExercises = await StretchingExercisesDB.getByRoutineId(routineId);
    setExercises(loadedExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      duration_seconds: ex.duration_seconds,
      order_index: ex.order_index,
    })));
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        duration_seconds: 30,
        order_index: exercises.length,
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseInput, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const emptyExercise = exercises.find(ex => !ex.name.trim());
    if (emptyExercise) {
      Alert.alert('Error', 'Please fill in all exercise names');
      return;
    }

    setLoading(true);

    try {
      let finalRoutineId = routineId;

      // Create or update routine
      if (routineId) {
        await StretchingRoutinesDB.update(routineId, { name: routineName });
      } else {
        const newRoutine = await StretchingRoutinesDB.create({ name: routineName });
        if (!newRoutine) {
          throw new Error('Failed to create routine');
        }
        finalRoutineId = newRoutine.id;
      }

      // Delete existing exercises if editing
      if (routineId) {
        await StretchingExercisesDB.deleteByRoutineId(routineId);
      }

      // Create all exercises
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        await StretchingExercisesDB.create({
          routine_id: finalRoutineId,
          name: exercise.name,
          duration_seconds: exercise.duration_seconds,
          order_index: i,
        });
      }

      router.back();
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.label}>Routine Name</Text>
          <Input
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="e.g., Morning Stretch, Post-Workout"
            style={styles.input}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <TouchableOpacity onPress={handleAddExercise} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {exercises.map((exercise, index) => (
          <Card key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>#{index + 1}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveExercise(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Stretch Name</Text>
            <Input
              value={exercise.name}
              onChangeText={(text) => handleUpdateExercise(index, 'name', text)}
              placeholder="e.g., Hamstring Stretch"
              style={styles.input}
            />

            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationControls}>
              <TouchableOpacity
                onPress={() => handleUpdateExercise(index, 'duration_seconds', Math.max(10, exercise.duration_seconds - 5))}
                style={styles.durationButton}
              >
                <Text style={styles.durationButtonText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.durationText}>{formatDuration(exercise.duration_seconds)}</Text>
              
              <TouchableOpacity
                onPress={() => handleUpdateExercise(index, 'duration_seconds', exercise.duration_seconds + 5)}
                style={styles.durationButton}
              >
                <Text style={styles.durationButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {exercises.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No exercises yet. Tap "+ Add Exercise" to get started.</Text>
          </Card>
        )}

        <Button
          title={routineId ? 'Save Changes' : 'Create Routine'}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  input: {
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addButtonText: {
    ...typography.bodySmall,
    color: colors.teal,
    fontWeight: '600',
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseNumber: {
    ...typography.h3,
    color: colors.teal,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  removeButtonText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  durationText: {
    ...typography.h2,
    color: colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

