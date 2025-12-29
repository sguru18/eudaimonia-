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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Button, LoadingSpinner } from '../../components';
import { subscriptionService, expenseCategoryService } from '../../services/database';
import type { Subscription, SubscriptionWithCategory, ExpenseCategory } from '../../types';

export const SubscriptionsScreen = () => {
  const insets = useSafeAreaInsets();
  const [remountKey, setRemountKey] = useState(0);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('1');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, cats] = await Promise.all([
        subscriptionService.getAllWithCategories(),
        expenseCategoryService.getAll(),
      ]);
      setSubscriptions(subs);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
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

  const monthlyTotal = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + s.amount, 0);

  const openAddModal = () => {
    setEditingSub(null);
    setName('');
    setAmount('');
    setBillingDay('1');
    setSelectedCategoryId(categories[0]?.id || '');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (sub: SubscriptionWithCategory) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setBillingDay(sub.billing_day.toString());
    setSelectedCategoryId(sub.category_id);
    setIsActive(sub.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const parsedDay = parseInt(billingDay);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      Alert.alert('Error', 'Please enter a valid billing day (1-31)');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setSaving(true);
    try {
      if (editingSub) {
        await subscriptionService.update(editingSub.id, {
          name: name.trim(),
          amount: parsedAmount,
          billing_day: parsedDay,
          category_id: selectedCategoryId,
          is_active: isActive,
        });
      } else {
        await subscriptionService.create({
          name: name.trim(),
          amount: parsedAmount,
          billing_day: parsedDay,
          category_id: selectedCategoryId,
          is_active: isActive,
        });
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save subscription');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sub: Subscription) => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete "${sub.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionService.delete(sub.id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (sub: Subscription) => {
    try {
      await subscriptionService.toggleActive(sub.id);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  if (loading && subscriptions.length === 0) {
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
      >
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Subscriptions
          </Header>
          <Text style={styles.subtitle}>
            Track your recurring payments
          </Text>

          {/* Monthly Total */}
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Monthly Total</Text>
            <Text style={styles.totalAmount}>${monthlyTotal.toFixed(2)}</Text>
            <Text style={styles.totalCount}>
              {subscriptions.filter(s => s.is_active).length} active subscriptions
            </Text>
          </Card>

          {/* Add Button */}
          <Button
            title="+ Add Subscription"
            onPress={openAddModal}
            color={colors.finances}
            style={styles.addButton}
          />

          {/* Subscriptions List */}
          {subscriptions.length > 0 ? (
            <View style={styles.subsList}>
              {subscriptions.map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subItem, !sub.is_active && styles.subItemInactive]}
                  onPress={() => openEditModal(sub)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subMain}>
                    <View style={styles.subInfo}>
                      <View style={styles.subHeader}>
                        <Text style={[styles.subName, !sub.is_active && styles.textInactive]}>
                          {sub.name}
                        </Text>
                        {!sub.is_active && (
                          <View style={styles.pausedBadge}>
                            <Text style={styles.pausedBadgeText}>Paused</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.subMeta}>
                        {sub.category && (
                          <View style={styles.categoryTag}>
                            <View 
                              style={[styles.categoryDot, { backgroundColor: sub.category.color }]} 
                            />
                            <Text style={styles.categoryText}>{sub.category.name}</Text>
                          </View>
                        )}
                        <Text style={styles.billingDay}>
                          Bills on the {sub.billing_day}{getOrdinalSuffix(sub.billing_day)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.subAmount, !sub.is_active && styles.textInactive]}>
                      ${sub.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.subActions}>
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => handleToggleActive(sub)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {sub.is_active ? 'Pause' : 'Resume'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(sub)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>↻</Text>
              <Text style={styles.emptyText}>
                No subscriptions yet.{'\n'}
                Add your recurring payments to track them.
              </Text>
            </View>
          )}
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
              {editingSub ? 'Edit Subscription' : 'New Subscription'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Netflix, Spotify, etc."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Billing Day */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Billing Day (1-31)</Text>
              <TextInput
                style={styles.textInput}
                value={billingDay}
                onChangeText={setBillingDay}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
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
                      selectedCategoryId === cat.id && styles.categoryOptionActive,
                      selectedCategoryId === cat.id && { borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View 
                      style={[styles.categoryOptionDot, { backgroundColor: cat.color }]} 
                    />
                    <Text 
                      style={[
                        styles.categoryOptionText,
                        selectedCategoryId === cat.id && { color: cat.color },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Active Toggle */}
            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.divider, true: colors.finances + '50' }}
                thumbColor={isActive ? colors.finances : colors.textMuted}
              />
            </View>
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
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.purple + '15',
    borderWidth: 1,
    borderColor: colors.purple + '30',
  },
  totalLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    ...typography.headerLarge,
    color: colors.purple,
    fontSize: 40,
    lineHeight: 48,
    marginVertical: spacing.sm,
  },
  totalCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  addButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  subsList: {
    gap: spacing.md,
  },
  subItem: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subItemInactive: {
    opacity: 0.7,
    backgroundColor: colors.divider,
  },
  subMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subInfo: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  textInactive: {
    color: colors.textMuted,
  },
  pausedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.textMuted + '20',
    borderRadius: borderRadius.sm,
  },
  pausedBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  billingDay: {
    ...typography.caption,
    color: colors.textMuted,
  },
  subAmount: {
    ...typography.bodyLarge,
    color: colors.purple,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
  subActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleButtonText: {
    ...typography.caption,
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
  textInput: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    ...typography.bodyLarge,
    color: colors.finances,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...typography.body,
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
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
});

