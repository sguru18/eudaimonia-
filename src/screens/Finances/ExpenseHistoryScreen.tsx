import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button, LoadingSpinner } from '../../components';
import { expenseService, expenseCategoryService } from '../../services/database';
import type { ExpenseWithCategory, ExpenseCategory, Expense } from '../../types';

export const ExpenseHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const [remountKey, setRemountKey] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [exps, cats] = await Promise.all([
        expenseService.getAllWithCategories(),
        expenseCategoryService.getAll(),
      ]);
      setExpenses(exps);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setRemountKey(prev => prev + 1);
    }, [loadData])
  );

  // Filter expenses by category
  const filteredExpenses = filterCategory
    ? expenses.filter(e => e.category_id === filterCategory)
    : expenses;

  // Group by date
  const expensesByDate = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, ExpenseWithCategory[]>);

  const dates = Object.keys(expensesByDate).sort((a, b) => b.localeCompare(a));

  const openEditModal = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditDescription(expense.description || '');
    setEditCategoryId(expense.category_id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingExpense) return;

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await expenseService.update(editingExpense.id, {
        amount: parsedAmount,
        description: editDescription.trim() || undefined,
        category_id: editCategoryId,
      });

      setShowModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this $${expense.amount.toFixed(2)} expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.delete(expense.id);
              setShowModal(false);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        key={remountKey}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Expense History
          </Header>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !filterCategory && styles.filterChipActive,
              ]}
              onPress={() => setFilterCategory(null)}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  !filterCategory && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  filterCategory === cat.id && styles.filterChipActive,
                  filterCategory === cat.id && { borderColor: cat.color },
                ]}
                onPress={() => setFilterCategory(cat.id)}
              >
                <View 
                  style={[styles.filterDot, { backgroundColor: cat.color }]} 
                />
                <Text 
                  style={[
                    styles.filterChipText,
                    filterCategory === cat.id && { color: cat.color },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {filterCategory ? 'Category Total' : 'All Time Total'}
              </Text>
              <Text style={styles.summaryAmount}>${totalFiltered.toFixed(2)}</Text>
            </View>
            <Text style={styles.summaryCount}>
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
            </Text>
          </Card>

          {/* Expense List */}
          {dates.length > 0 ? (
            dates.map(date => (
              <View key={date} style={styles.dateSection}>
                <Text style={styles.dateLabel}>
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </Text>
                {expensesByDate[date].map(expense => (
                  <TouchableOpacity
                    key={expense.id}
                    style={styles.expenseCard}
                    onPress={() => openEditModal(expense)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expenseMain}>
                      <View style={styles.expenseInfo}>
                        {expense.category && (
                          <View style={styles.categoryTag}>
                            <View 
                              style={[
                                styles.categoryDot, 
                                { backgroundColor: expense.category.color }
                              ]} 
                            />
                            <Text style={styles.categoryText}>
                              {expense.category.name}
                            </Text>
                          </View>
                        )}
                        {expense.description && (
                          <Text style={styles.description} numberOfLines={1}>
                            {expense.description}
                          </Text>
                        )}
                        <Text style={styles.timestamp}>
                          {format(new Date(expense.created_at), 'h:mm a')}
                        </Text>
                      </View>
                      <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={styles.dateTotalRow}>
                  <Text style={styles.dateTotalLabel}>Day Total</Text>
                  <Text style={styles.dateTotalAmount}>
                    ${expensesByDate[date].reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>
                No expenses recorded yet.{'\n'}
                Start tracking to see your history.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
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
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      editCategoryId === cat.id && styles.categoryOptionActive,
                      editCategoryId === cat.id && { borderColor: cat.color },
                    ]}
                    onPress={() => setEditCategoryId(cat.id)}
                  >
                    <View 
                      style={[styles.categoryOptionDot, { backgroundColor: cat.color }]} 
                    />
                    <Text 
                      style={[
                        styles.categoryOptionText,
                        editCategoryId === cat.id && { color: cat.color },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What was this for?"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            {/* Date Info */}
            {editingExpense && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(editingExpense.date), 'MMMM d, yyyy')}
                </Text>
              </View>
            )}

            {/* Delete Button */}
            <Button
              title="Delete Expense"
              onPress={() => editingExpense && handleDelete(editingExpense)}
              variant="outline"
              color={colors.error}
              style={styles.deleteButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: spacing.xxxl,
  },
  filterScroll: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.finances,
    backgroundColor: colors.finances + '10',
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
  filterChipTextActive: {
    color: colors.finances,
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  summaryRow: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    ...typography.headerMedium,
    color: colors.finances,
    marginTop: spacing.xs,
  },
  summaryCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  dateSection: {
    marginTop: spacing.xl,
  },
  dateLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  description: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.bodyLarge,
    color: colors.finances,
    fontWeight: '700',
  },
  dateTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dateTotalLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dateTotalAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    ...typography.headerMedium,
    color: colors.finances,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...typography.headerMedium,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryOptionActive: {
    borderWidth: 2,
  },
  categoryOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryOptionText: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
  descriptionInput: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoSection: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
  },
  deleteButton: {
    marginTop: spacing.xl,
  },
});

