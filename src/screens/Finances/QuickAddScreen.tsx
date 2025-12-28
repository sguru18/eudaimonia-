import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Input, Button, NoteModal } from '../../components';
import { expenseService } from '../../services/database';

const CATEGORIES = [
  { label: 'Food & Dining', emoji: '🍽️', value: 'food' },
  { label: 'Wellness', emoji: '🧘', value: 'wellness' },
  { label: 'Learning', emoji: '📚', value: 'learning' },
  { label: 'Transport', emoji: '🚗', value: 'transport' },
  { label: 'Shopping', emoji: '🛍️', value: 'shopping' },
  { label: 'Home', emoji: '🏠', value: 'home' },
  { label: 'Entertainment', emoji: '🎭', value: 'entertainment' },
  { label: 'Other', emoji: '💡', value: 'other' },
];

export const QuickAddScreen = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [saving, setSaving] = useState(false);


  const handleSave = async () => {
    if (!amount.trim() || !name.trim() || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await expenseService.create({
        amount: parsedAmount,
        name: name.trim(),
        category,
        date,
        notes: notes || undefined,
        is_recurring: false,
      });

      // Reset form
      setAmount('');
      setName('');
      setCategory('');
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));

      Alert.alert('Success', 'Expense added!', [
        {
          text: 'View All',
          onPress: () => router.push('/(tabs)/finances/expense-list'),
        },
        { text: 'Add Another', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
      >
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Quick Add
          </Header>
          <Text style={styles.subtitle}>
            Track your spending with awareness
          </Text>

          <Card style={styles.card}>
            <Input
              label="Amount *"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Input
              label="Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Coffee with friend"
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.value && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Date"
              value={format(new Date(date), 'MMMM d, yyyy')}
              editable={false}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <Text style={styles.noteHint}>
              Reflect on this purchase. Was it intentional? Does it align with your values?
            </Text>
            <NoteAttachment
              note={notes}
              onPress={() => setShowNoteModal(true)}
              onView={() => setShowNoteModal(true)}
            />
          </Card>

          <Button
            title="Add Expense"
            onPress={handleSave}
            loading={saving}
            color={colors.finances}
            style={styles.saveButton}
          />

          <Button
            title="View All Expenses"
            onPress={() => router.push('/(tabs)/finances/expense-list')}
            variant="outline"
            color={colors.finances}
            style={styles.viewButton}
          />
        </View>
      </ScrollView>

      <NoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={setNotes}
        initialContent={notes}
        title="Expense Notes"
      />
    </SafeAreaView>
  );
};

// Import NoteAttachment for quick access
import { NoteAttachment } from '../../components';

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
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    marginTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryButton: {
    width: '48%',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: colors.finances,
    backgroundColor: '#fcf9f4',
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.finances,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  viewButton: {
    marginTop: spacing.md,
  },
});

