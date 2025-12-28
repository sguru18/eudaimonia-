import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, EmptyState, Header, LoadingSpinner } from "../../components";
import { recurringTimeBlockService } from "../../services/database";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { RecurringTimeBlock } from "../../types";
import { DAY_NAMES } from "../../types";
import { RecurringEventModal } from "./RecurringEventModal";

// Format HH:MM (24hr) to 12hr format for display
const formatTimeAMPM = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const isPM = hours >= 12;
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
};

// Get selected days as string
const formatDays = (days: boolean[]): string => {
  const selectedDays = days
    .map((selected, index) => (selected ? DAY_NAMES[index] : null))
    .filter(Boolean);
  
  // Check for common patterns
  const isWeekdays = days[1] && days[2] && days[3] && days[4] && days[5] && !days[0] && !days[6];
  const isWeekends = days[0] && days[6] && !days[1] && !days[2] && !days[3] && !days[4] && !days[5];
  const isEveryDay = days.every(d => d);
  
  if (isEveryDay) return "Every day";
  if (isWeekdays) return "Weekdays";
  if (isWeekends) return "Weekends";
  
  return selectedDays.join(", ");
};

export const RecurringEventsScreen = () => {
  const router = useRouter();
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringTimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<RecurringTimeBlock | null>(null);

  const loadData = useCallback(async () => {
    try {
      const blocks = await recurringTimeBlockService.getAll();
      setRecurringBlocks(blocks);
    } catch (error) {
      console.error("Error loading recurring blocks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setSelectedBlock(null);
    setModalVisible(true);
  };

  const handleEditBlock = (block: RecurringTimeBlock) => {
    setSelectedBlock(block);
    setModalVisible(true);
  };

  const handleSaveBlock = async (
    blockData: Omit<RecurringTimeBlock, "id" | "created_at" | "updated_at" | "user_id">
  ) => {
    try {
      if (selectedBlock) {
        await recurringTimeBlockService.update(selectedBlock.id, blockData);
      } else {
        await recurringTimeBlockService.create(blockData);
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error("Error saving recurring block:", error);
      Alert.alert("Error", "Failed to save recurring event");
    }
  };

  const handleDeleteBlock = (block: RecurringTimeBlock) => {
    Alert.alert(
      "Delete Recurring Event",
      `Are you sure you want to delete "${block.title}"? This will remove it from all future days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await recurringTimeBlockService.delete(block.id);
            if (success) {
              setModalVisible(false);
              loadData();
            } else {
              Alert.alert("Error", "Failed to delete recurring event");
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (block: RecurringTimeBlock) => {
    await recurringTimeBlockService.toggleActive(block.id);
    loadData();
  };

  const renderItem = ({ item }: { item: RecurringTimeBlock }) => (
    <Card style={[styles.eventCard, !item.is_active && styles.eventCardInactive]}>
      <TouchableOpacity
        style={styles.eventContent}
        onPress={() => handleEditBlock(item)}
        activeOpacity={0.7}
      >
        <View style={styles.eventMain}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, !item.is_active && styles.eventTitleInactive]}>
              {item.title}
            </Text>
            {!item.is_active && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedText}>Paused</Text>
              </View>
            )}
          </View>
          <Text style={styles.eventTime}>
            {formatTimeAMPM(item.start_time)} - {formatTimeAMPM(item.end_time)}
          </Text>
          <Text style={styles.eventDays}>{formatDays(item.days_of_week)}</Text>
        </View>
        <View style={styles.eventActions}>
          <Pressable
            style={styles.toggleButton}
            onPress={() => handleToggleActive(item)}
            hitSlop={8}
          >
            <Ionicons
              name={item.is_active ? "pause-circle-outline" : "play-circle-outline"}
              size={28}
              color={item.is_active ? colors.textMuted : colors.teal}
            />
          </Pressable>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.teal} />
        </TouchableOpacity>
        <Header size="medium" color={colors.teal}>
          Recurring Events
        </Header>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={28} color={colors.teal} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          Set up events that repeat on specific days of the week. These will automatically appear on your daily planner.
        </Text>
      </View>

      {/* List */}
      {recurringBlocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔄"
            title="No Recurring Events"
            subtitle="Add events that repeat weekly, like classes or meetings"
          />
          <Button
            title="Add Recurring Event"
            onPress={handleAddNew}
            color={colors.teal}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={recurringBlocks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal */}
      <RecurringEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveBlock}
        onDelete={selectedBlock ? () => handleDeleteBlock(selectedBlock) : undefined}
        initialBlock={selectedBlock}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  addButton: {
    padding: spacing.xs,
  },
  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.teal + "10",
  },
  description: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 20,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventCardInactive: {
    opacity: 0.7,
  },
  eventContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventMain: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eventTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventTitleInactive: {
    color: colors.textMuted,
  },
  pausedBadge: {
    backgroundColor: colors.textMuted + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  pausedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "500",
  },
  eventTime: {
    ...typography.bodySmall,
    color: colors.teal,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  eventDays: {
    ...typography.caption,
    color: colors.textMuted,
  },
  eventActions: {
    marginLeft: spacing.md,
  },
  toggleButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
});

