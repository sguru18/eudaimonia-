import { format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Header, Input } from '../../components';
import { mealService, userSettingsService } from '../../services/database';
import { borderRadius, colors, spacing, typography } from '../../theme';
import type { CookingTimeCategory, Meal, MealType } from '../../types';

export const MealDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const date = params.date as string;
  const mealType = params.mealType as MealType;
  const mealId = params.mealId as string;
  
  const [existingMeal, setExistingMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [needsCooking, setNeedsCooking] = useState(false);
  const [cookingTimeCategory, setCookingTimeCategory] = useState<CookingTimeCategory | null>(null);
  const [mealOptionsList, setMealOptionsList] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadMeal = async () => {
      if (mealId) {
        try {
          const meal = await mealService.getById(mealId);
          if (meal) {
            setExistingMeal(meal);
            setName(meal.name);
            setNeedsCooking(meal.needs_cooking || false);
            setCookingTimeCategory(meal.cooking_time_category || null);
          }
        } catch (error) {
          console.error('Error loading meal:', error);
        }
      }
      
      // Load the global options list
      try {
        const optionsList = await userSettingsService.getMealOptionsList();
        setMealOptionsList(optionsList);
      } catch (error) {
        console.error('Error loading options list:', error);
      }
      
      setLoading(false);
    };
    loadMeal();
  }, [mealId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    setSaving(true);
    try {
      if (existingMeal) {
        // Update existing meal
        await mealService.update(existingMeal.id, {
          name: name.trim(),
          needs_cooking: needsCooking,
          cooking_time_category: needsCooking ? cookingTimeCategory : null,
        });
      } else {
        // Create new meal
        await mealService.create({
          date,
          meal_type: mealType as MealType,
          name: name.trim(),
          needs_cooking: needsCooking,
          cooking_time_category: needsCooking ? cookingTimeCategory : null,
          makes_leftovers: false,
          is_cooked: false,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingMeal) return;

    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await mealService.delete(existingMeal.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSaveOptions = async () => {
    await userSettingsService.saveMealOptionsList(mealOptionsList);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}>
        <View style={styles.content}>
          <Header size="medium" color={colors.food}>
            {existingMeal ? 'Edit Meal' : 'Add Meal'}
          </Header>

          <Card style={styles.card}>
            <Text style={styles.dateLabel}>
              {format(parseISO(date), 'EEEE, MMMM d')} • {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>

            <Input
              label="Meal Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Grilled Chicken Salad"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Needs Cooking</Text>
                <Text style={styles.sublabel}>Requires cooking/preparation</Text>
              </View>
              <Switch
                value={needsCooking}
                onValueChange={(value) => {
                  setNeedsCooking(value);
                  if (!value) {
                    setCookingTimeCategory(null);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.food }}
                thumbColor={colors.white}
              />
            </View>

            {needsCooking && (
              <View style={styles.cookingTimeContainer}>
                <Text style={styles.cookingTimeLabel}>Cooking Time</Text>
                <View style={styles.cookingTimeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.cookingTimeButton,
                      cookingTimeCategory === 'under_30' && styles.cookingTimeButtonActive,
                    ]}
                    onPress={() => setCookingTimeCategory('under_30')}
                  >
                    <Text
                      style={[
                        styles.cookingTimeButtonText,
                        cookingTimeCategory === 'under_30' && styles.cookingTimeButtonTextActive,
                      ]}
                    >
                      Under 30 min
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cookingTimeButton,
                      cookingTimeCategory === 'over_30' && styles.cookingTimeButtonActive,
                    ]}
                    onPress={() => setCookingTimeCategory('over_30')}
                  >
                    <Text
                      style={[
                        styles.cookingTimeButtonText,
                        cookingTimeCategory === 'over_30' && styles.cookingTimeButtonTextActive,
                      ]}
                    >
                      30+ min
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Meal Options Section */}
          <Card style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Options</Text>
            <TextInput
              style={styles.optionsInput}
              value={mealOptionsList}
              onChangeText={setMealOptionsList}
              onBlur={handleSaveOptions}
              placeholder="e.g.,&#10;Grilled chicken&#10;Pasta carbonara&#10;Chipotle&#10;Thai place on Main St"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </Card>

          <Button
            title={existingMeal ? 'Save Changes' : 'Add Meal'}
            onPress={handleSave}
            loading={saving}
            color={colors.food}
            style={styles.saveButton}
          />

          {existingMeal && (
            <Button
              title="Delete Meal"
              onPress={handleDelete}
              variant="ghost"
              color={colors.error}
              style={styles.deleteButton}
            />
          )}
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.food} />
        </View>
      )}
    </KeyboardAvoidingView>
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
  dateLabel: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  switchLabel: {
    flex: 1,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  cookingTimeContainer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cookingTimeLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cookingTimeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cookingTimeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  cookingTimeButtonActive: {
    borderColor: colors.food,
    backgroundColor: colors.food + '15', // Light green tint
  },
  cookingTimeButtonText: {
    ...typography.body,
    color: colors.text,
  },
  cookingTimeButtonTextActive: {
    color: colors.food,
    fontWeight: '600',
  },
  optionsCard: {
    marginTop: spacing.lg,
  },
  optionsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionsSublabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  optionsInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 150,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

