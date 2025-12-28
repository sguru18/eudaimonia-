import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button } from '../../components';
import { expenseCategoryService } from '../../services/database';
import type { ExpenseCategory } from '../../types';

const PRESET_COLORS = [
  '#E07A5F', '#81B29A', '#3D405B', '#F2CC8F',
  '#9B5DE5', '#00BBF9', '#00F5D4', '#9B9B9B',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

export const CategoriesScreen = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await expenseCategoryService.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor(PRESET_COLORS[0]);
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await expenseCategoryService.update(editingCategory.id, {
          name: categoryName.trim(),
          color: categoryColor,
        });
      } else {
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
        await expenseCategoryService.create({
          name: categoryName.trim(),
          color: categoryColor,
          is_default: false,
          sort_order: maxOrder + 1,
        });
      }

      setShowModal(false);
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: ExpenseCategory) => {
    if (category.is_default) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Expenses with this category will show as uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseCategoryService.delete(category.id);
              loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Categories
          </Header>
          <Text style={styles.subtitle}>
            Organize your spending
          </Text>

          {/* Add Button */}
          <Button
            title="+ Add Category"
            onPress={openAddModal}
            color={colors.finances}
            style={styles.addButton}
          />

          {/* Categories List */}
          <View style={styles.categoryList}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => openEditModal(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryInfo}>
                  <View 
                    style={[styles.categoryDot, { backgroundColor: category.color }]} 
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(category)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  {!category.is_default && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(category)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Category name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Color Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      categoryColor === color && styles.colorOptionActive,
                    ]}
                    onPress={() => setCategoryColor(color)}
                  >
                    {categoryColor === color && (
                      <Text style={styles.colorCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View 
                  style={[styles.previewDot, { backgroundColor: categoryColor }]} 
                />
                <Text style={styles.previewName}>
                  {categoryName || 'Category Name'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  addButton: {
    marginBottom: spacing.lg,
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  defaultBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    ...typography.bodySmall,
    color: colors.finances,
    fontWeight: '600',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '600',
    marginTop: -2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  cancelButton: {
    ...typography.body,
    color: colors.textLight,
  },
  saveButton: {
    ...typography.body,
    color: colors.finances,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  colorCheck: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  previewSection: {
    marginTop: spacing.lg,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.md,
  },
  previewName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

