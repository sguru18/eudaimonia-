import { useFocusEffect } from "@react-navigation/native";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Header } from "../../components";
import {
  expenseCategoryService,
  expenseService,
} from "../../services/database";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { ExpenseCategory } from "../../types";
import { updateFinanceWidgetData } from "../../utils/widgetHelper";

export const QuickAddScreen = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [monthExpenseCount, setMonthExpenseCount] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekExpenseCount, setWeekExpenseCount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure default categories exist and load them (deduplicated)
      const cats = await expenseCategoryService.ensureDefaults();
      // Additional deduplication by id to prevent any duplicates
      const uniqueCats = Array.from(
        new Map(cats.map((cat) => [cat.id, cat])).values()
      ).sort((a, b) => a.sort_order - b.sort_order);
      setCategories(uniqueCats);

      // Load this month's expenses
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const today = format(now, "yyyy-MM-dd");

      const monthExpenses = await expenseService.getByDateRange(
        format(monthStart, "yyyy-MM-dd"),
        format(monthEnd, "yyyy-MM-dd")
      );

      setMonthTotal(monthExpenses.reduce((sum, e) => sum + e.amount, 0));
      setMonthExpenseCount(monthExpenses.length);

      // Also calculate this week's total
      const weekExpenses = monthExpenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });

      setWeekTotal(weekExpenses.reduce((sum, e) => sum + e.amount, 0));
      setWeekExpenseCount(weekExpenses.length);

      // Also calculate today's total
      const todayExpenses = monthExpenses.filter((e) => e.date === today);
      setTodayTotal(todayExpenses.reduce((sum, e) => sum + e.amount, 0));
    } catch (error) {
      console.error("Error loading data:", error);
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
    }, [loadData])
  );

  const handleAmountChange = (text: string) => {
    // Only allow numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleSave = async () => {
    if (!amount.trim() || !selectedCategory) {
      Alert.alert(
        "Missing Info",
        "Please enter an amount and select a category"
      );
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    setSaving(true);
    Keyboard.dismiss();

    try {
      await expenseService.create({
        amount: parsedAmount,
        category_id: selectedCategory.id,
        description: description.trim() || undefined,
        date: format(new Date(), "yyyy-MM-dd"),
      });

      // Reset form
      setAmount("");
      setDescription("");
      setSelectedCategory(null);

      // Refresh data
      await loadData();

      // Update widget
      await updateFinanceWidgetData();

      Alert.alert(
        "Saved!",
        `$${parsedAmount.toFixed(2)} added to ${selectedCategory.name}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save expense");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Header size="large" color={colors.finances}>
              Track Spending
            </Header>
            <Button
              title="Overview"
              onPress={() => router.push("/(tabs)/finances/overview")}
              variant="outline"
              color={colors.finances}
              style={styles.overviewButton}
            />
          </View>
          <Text style={styles.subtitle}>Log what you spend, stay aware</Text>

          {/* Monthly Summary Card - Primary Focus */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/finances/overview")}
          >
            <Card style={styles.monthCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>This Month</Text>
                <Text style={styles.summaryDate}>
                  {format(monthStart, "MMM d")} - {format(monthEnd, "MMM d")}
                </Text>
              </View>
              <Text style={styles.monthAmount}>${monthTotal.toFixed(2)}</Text>
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryCount}>
                  {monthExpenseCount}{" "}
                  {monthExpenseCount === 1 ? "expense" : "expenses"}
                </Text>
                {todayTotal > 0 && (
                  <Text style={styles.todayBadge}>
                    Today: ${todayTotal.toFixed(2)}
                  </Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>

          {/* Weekly Summary - Secondary */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/finances/overview")}
          >
            <Card style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekLabel}>This Week</Text>
                <Text style={styles.weekDate}>
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
                </Text>
              </View>
              <Text style={styles.weekAmount}>${weekTotal.toFixed(2)}</Text>
              <Text style={styles.weekCount}>
                {weekExpenseCount}{" "}
                {weekExpenseCount === 1 ? "expense" : "expenses"}
              </Text>
            </Card>
          </TouchableOpacity>

          {/* Add New Expense Form */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Add New Expense</Text>

            {/* Amount Input */}
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </Card>

            {/* Category Selection */}
            <Card style={styles.categoryCard}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory?.id === cat.id &&
                        styles.categoryButtonActive,
                      selectedCategory?.id === cat.id && {
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: cat.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedCategory?.id === cat.id && {
                          color: cat.color,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.manageCategoriesLink}
                onPress={() => router.push("/(tabs)/finances/categories")}
              >
                <Text style={styles.manageCategoriesText}>
                  Manage Categories →
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Optional Description */}
            <Card style={styles.descriptionCard}>
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </Card>

            {/* Save Button */}
            <Button
              title="Add Expense"
              onPress={handleSave}
              loading={saving}
              color={colors.finances}
              style={styles.saveButton}
            />
          </View>

          {/* Navigation */}
          <View style={styles.navButtons}>
            <Button
              title="Recurring"
              onPress={() => router.push("/(tabs)/finances/subscriptions")}
              variant="outline"
              color={colors.finances}
              style={styles.navButton}
            />
            <Button
              title="History"
              onPress={() => router.push("/(tabs)/finances/history")}
              variant="outline"
              color={colors.textMuted}
              style={styles.navButton}
            />
          </View>
        </View>
      </ScrollView>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  overviewButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 100,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  monthCard: {
    backgroundColor: colors.finances + "15",
    borderWidth: 1,
    borderColor: colors.finances + "30",
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  summaryDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  monthAmount: {
    ...typography.headerLarge,
    color: colors.finances,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700",
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  summaryCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  todayBadge: {
    ...typography.caption,
    color: colors.finances,
    fontWeight: "600",
    backgroundColor: colors.finances + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  weekCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  weekLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: "600",
  },
  weekDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  weekAmount: {
    ...typography.headerMedium,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: spacing.xs,
  },
  weekCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  formSection: {
    marginTop: spacing.lg,
  },
  formSectionTitle: {
    ...typography.label,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputCard: {
    marginTop: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    ...typography.headerLarge,
    color: colors.finances,
    fontSize: 32,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...typography.headerLarge,
    fontSize: 32,
    color: colors.text,
    padding: 0,
  },
  categoryCard: {
    marginTop: spacing.lg,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  categoryButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryLabel: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
  manageCategoriesLink: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
  },
  manageCategoriesText: {
    ...typography.caption,
    color: colors.finances,
    fontWeight: "600",
  },
  descriptionCard: {
    marginTop: spacing.lg,
  },
  descriptionInput: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  navButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  navButton: {
    flex: 1,
  },
});
