import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StretchingRoutinesDB, StretchingExercisesDB } from '../../services/database';
import { ttsService } from '../../services/tts';
import { backgroundMusicService } from '../../services/backgroundMusic';
import { colors, typography, spacing } from '../../theme';
import type { StretchingRoutine, StretchingExercise } from '../../types';

enum TimerState {
  LOADING = 'loading',
  REST = 'rest',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETE = 'complete',
}

export const ActiveTimerScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routineId = params.routineId as string;

  const [routine, setRoutine] = useState<StretchingRoutine | null>(null);
  const [exercises, setExercises] = useState<StretchingExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.LOADING);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnnouncedHalfway = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load routine and exercises
  useEffect(() => {
    loadRoutineData();
    return () => {
      cleanup();
    };
  }, [routineId]);

  // Timer logic
  useEffect(() => {
    if (timerState === TimerState.ACTIVE || timerState === TimerState.REST) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [timerState]);

  // Check for halfway point (for vibration and "switch sides" announcement)
  useEffect(() => {
    if (timerState === TimerState.ACTIVE && exercises.length > 0) {
      const currentExercise = exercises[currentExerciseIndex];
      const halfwayPoint = Math.ceil(currentExercise.duration_seconds / 2);
      
      if (timeRemaining === halfwayPoint && !hasAnnouncedHalfway.current) {
        // Double vibration
        Vibration.vibrate([0, 200, 100, 200]);
        
        // Announce "switch sides"
        ttsService.announceSwitchSides();
        
        hasAnnouncedHalfway.current = true;
      }
    }
  }, [timeRemaining, timerState]);

  // Progress animation
  useEffect(() => {
    if (exercises.length > 0 && currentExerciseIndex < exercises.length) {
      const currentExercise = exercises[currentExerciseIndex];
      const progress = timerState === TimerState.REST 
        ? 1 
        : 1 - (timeRemaining / currentExercise.duration_seconds);
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [timeRemaining, timerState]);

  const loadRoutineData = async () => {
    try {
      const loadedRoutine = await StretchingRoutinesDB.getById(routineId);
      const loadedExercises = await StretchingExercisesDB.getByRoutineId(routineId);
      
      if (!loadedRoutine || loadedExercises.length === 0) {
        router.back();
        return;
      }

      setRoutine(loadedRoutine);
      setExercises(loadedExercises);
      
      // Start with first exercise
      startExercise(0, loadedExercises);
    } catch (error) {
      console.error('Error loading routine:', error);
      router.back();
    }
  };

  const startExercise = async (index: number, exerciseList: StretchingExercise[]) => {
    if (index >= exerciseList.length) {
      handleRoutineComplete();
      return;
    }

    const exercise = exerciseList[index];
    setCurrentExerciseIndex(index);
    setTimeRemaining(exercise.duration_seconds);
    setTimerState(TimerState.ACTIVE);
    hasAnnouncedHalfway.current = false;

    // Announce stretch name
    await ttsService.announceStretch(exercise.name);

    // Start background music on first exercise
    if (index === 0) {
      await backgroundMusicService.play();
    }
  };

  const handleTimerComplete = () => {
    if (timerState === TimerState.REST) {
      // Rest period done, start next exercise
      startExercise(currentExerciseIndex + 1, exercises);
    } else {
      // Exercise done, start rest period
      if (currentExerciseIndex < exercises.length - 1) {
        setTimerState(TimerState.REST);
        setTimeRemaining(5); // 5 second rest
      } else {
        // Last exercise done
        handleRoutineComplete();
      }
    }
  };

  const handleRoutineComplete = async () => {
    setTimerState(TimerState.COMPLETE);
    await ttsService.announceComplete();
    
    // Gentle success vibration
    Vibration.vibrate([0, 100, 50, 100]);
    
    // Stop music after a moment
    setTimeout(() => {
      backgroundMusicService.stop();
    }, 2000);
  };

  const handlePause = () => {
    if (timerState === TimerState.ACTIVE || timerState === TimerState.REST) {
      setTimerState(TimerState.PAUSED);
      backgroundMusicService.pause();
    }
  };

  const handleResume = () => {
    if (timerState === TimerState.PAUSED) {
      setTimerState(TimerState.ACTIVE);
      backgroundMusicService.resume();
    }
  };

  const handleSkip = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setTimerState(TimerState.REST);
      setTimeRemaining(5);
    } else {
      handleRoutineComplete();
    }
  };

  const handleExit = () => {
    cleanup();
    router.back();
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    backgroundMusicService.stop();
    ttsService.stop();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (timerState === TimerState.LOADING) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (timerState === TimerState.COMPLETE) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.teal} />
        <View style={styles.completeContainer}>
          <Text style={styles.completeIcon}>✨</Text>
          <Text style={styles.completeTitle}>Complete!</Text>
          <Text style={styles.completeMessage}>
            You finished "{routine?.name}". Well done! 🧘
          </Text>
          <TouchableOpacity onPress={handleExit} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const isResting = timerState === TimerState.REST;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.teal} />
      
      {/* Exit Button */}
      <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
        <Text style={styles.exitButtonText}>✕ Exit</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentExerciseIndex + 1} / {exercises.length}
          </Text>
        </View>

        {/* Exercise Name or Rest */}
        <View style={styles.exerciseContainer}>
          {isResting ? (
            <>
              <Text style={styles.restLabel}>Rest</Text>
              <Text style={styles.nextExerciseLabel}>Next: {exercises[currentExerciseIndex + 1]?.name}</Text>
            </>
          ) : (
            <>
              <Text style={styles.exerciseName}>{currentExercise?.name}</Text>
            </>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {timerState === TimerState.PAUSED ? (
            <TouchableOpacity onPress={handleResume} style={styles.playButton}>
              <Text style={styles.playButtonText}>Resume</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePause} style={styles.pauseButton}>
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
          )}

          {!isResting && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.teal,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'flex-start',
  },
  exitButton: {
    alignSelf: 'flex-start',
    padding: spacing.md,
    marginLeft: spacing.md,
  },
  exitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressText: {
    ...typography.bodyLarge,
    color: colors.white,
    opacity: 0.8,
  },
  exerciseContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  exerciseName: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    letterSpacing: 0.5,
  },
  restLabel: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  nextExerciseLabel: {
    ...typography.bodyLarge,
    color: colors.white,
    opacity: 0.8,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
  },
  spacer: {
    flex: 1,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xl * 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  playButton: {
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 30,
  },
  playButtonText: {
    ...typography.bodyLarge,
    color: colors.teal,
    fontWeight: '700',
  },
  pauseButton: {
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
  },
  pauseButtonText: {
    ...typography.bodyLarge,
    color: colors.white,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  skipButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completeIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  completeTitle: {
    ...typography.display,
    color: colors.white,
    marginBottom: spacing.md,
  },
  completeMessage: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.xl * 2,
  },
  doneButton: {
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 30,
  },
  doneButtonText: {
    ...typography.bodyLarge,
    color: colors.teal,
    fontWeight: '700',
  },
  loadingText: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
});

