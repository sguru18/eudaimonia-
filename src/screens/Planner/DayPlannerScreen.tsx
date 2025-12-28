import { useFocusEffect } from "@react-navigation/native";
import { addDays, format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Header } from "../../components";
import { timeBlockService } from "../../services/database";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { TimeBlock } from "../../types";
import { TimeBlockModal } from "./TimeBlockModal";

const HOUR_HEIGHT = 60; // Height of each hour row in pixels
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const TIME_COLUMN_WIDTH = 50;
const SCREEN_WIDTH = Dimensions.get("window").width;
const TOP_PADDING = 20; // Space above 12am

// Convert HH:MM to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Convert minutes from midnight to Y position (accounting for top padding)
const minutesToPosition = (minutes: number): number => {
  return TOP_PADDING + (minutes / 60) * HOUR_HEIGHT;
};

// Format hour for display (12-hour format)
const formatHour = (hour: number): string => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

// Format HH:MM time to AM/PM display
const formatTimeAMPM = (time: string): string => {
  const [hourStr, minute] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const isPM = hour >= 12;
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minute} ${isPM ? "PM" : "AM"}`;
};

export const DayPlannerScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  const dateString = format(currentDate, "yyyy-MM-dd");

  // Update current time indicator every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimePosition(minutesToPosition(minutes));
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount and when date changes
  useEffect(() => {
    const now = new Date();
    const isTodayView = format(now, "yyyy-MM-dd") === dateString;

    if (isTodayView && scrollViewRef.current) {
      // Calculate current time position
      const minutes = now.getHours() * 60 + now.getMinutes();
      const position = minutesToPosition(minutes);
      // Scroll to show current time near the top of the visible area
      const scrollPosition = Math.max(0, position - 150);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
      }, 500);
    } else {
      // For other days, scroll to 8am
      const scrollPosition = minutesToPosition(8 * 60) - 50;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 300);
    }
  }, [dateString]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const blocks = await timeBlockService.getByDate(dateString);
      setTimeBlocks(blocks);
    } catch (error) {
      console.error("Error loading time blocks:", error);
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  useEffect(() => {
    loadData();
  }, [dateString]);

  // Auto-scroll when screen is focused
  const scrollToCurrentTime = useCallback(() => {
    const now = new Date();
    const isTodayView = format(now, "yyyy-MM-dd") === dateString;

    if (isTodayView && scrollViewRef.current) {
      const minutes = now.getHours() * 60 + now.getMinutes();
      const position = minutesToPosition(minutes);
      const scrollPosition = Math.max(0, position - 150);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
      }, 400);
    } else {
      const scrollPosition = minutesToPosition(8 * 60) - 50;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 300);
    }
  }, [dateString]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      scrollToCurrentTime();
    }, [loadData, scrollToCurrentTime])
  );

  const handlePrevDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddBlock = () => {
    setSelectedBlock(null);
    setModalVisible(true);
  };

  const handleEditBlock = (block: TimeBlock) => {
    setSelectedBlock(block);
    setModalVisible(true);
  };

  const handleDeleteBlock = (block: TimeBlock) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${block.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await timeBlockService.delete(block.id);
            if (success) {
              loadData();
            } else {
              Alert.alert("Error", "Failed to delete event");
            }
          },
        },
      ]
    );
  };

  const handleSaveBlock = async (
    block: Omit<TimeBlock, "id" | "created_at" | "updated_at" | "user_id">
  ) => {
    if (selectedBlock) {
      // Update existing
      const updated = await timeBlockService.update(selectedBlock.id, block);
      if (updated) {
        loadData();
        setModalVisible(false);
      } else {
        Alert.alert("Error", "Failed to update event");
      }
    } else {
      // Create new
      const created = await timeBlockService.create(block);
      if (created) {
        loadData();
        setModalVisible(false);
      } else {
        Alert.alert("Error", "Failed to create event");
      }
    }
  };

  const isToday = format(new Date(), "yyyy-MM-dd") === dateString;

  // Render a time block on the timeline
  const renderTimeBlock = (block: TimeBlock) => {
    const startMinutes = timeToMinutes(block.start_time);
    const endMinutes = timeToMinutes(block.end_time);
    const top = minutesToPosition(startMinutes);
    const height = Math.max(minutesToPosition(endMinutes - startMinutes), 30);

    return (
      <TouchableOpacity
        key={block.id}
        style={[
          styles.timeBlock,
          {
            top,
            height,
            left: TIME_COLUMN_WIDTH + spacing.sm,
            right: spacing.lg,
          },
        ]}
        onPress={() => handleEditBlock(block)}
        onLongPress={() => handleDeleteBlock(block)}
        activeOpacity={0.8}
      >
        <Text style={styles.timeBlockTitle} numberOfLines={1}>
          {block.title}
        </Text>
        <Text style={styles.timeBlockTime}>
          {formatTimeAMPM(block.start_time)} - {formatTimeAMPM(block.end_time)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Section */}
      <View style={styles.headerContent}>
        <Header size="large" color={colors.teal}>
          Day Planner
        </Header>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <Button
            title="←"
            onPress={handlePrevDay}
            variant="outline"
            size="small"
            color={colors.teal}
          />
          <TouchableOpacity onPress={handleToday} style={styles.dateDisplay}>
            <Text style={styles.dateText}>
              {format(currentDate, "EEEE, MMM d")}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </TouchableOpacity>
          <Button
            title="→"
            onPress={handleNextDay}
            variant="outline"
            size="small"
            color={colors.teal}
          />
        </View>
      </View>

      {/* Timeline - Takes up remaining space */}
      {loading && timeBlocks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.timeline}
            contentContainerStyle={styles.timelineContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadData} />
            }
          >
            {/* Top padding space */}
            <View style={styles.topPadding} />

            {/* Hour rows */}
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourRow}>
                <View style={styles.hourLabelContainer}>
                  <Text style={styles.hourLabel}>{formatHour(hour)}</Text>
                </View>
                <View style={styles.hourLine} />
              </View>
            ))}

            {/* Time blocks */}
            {timeBlocks.map(renderTimeBlock)}

            {/* Current time indicator */}
            {isToday && (
              <View
                style={[
                  styles.currentTimeIndicator,
                  { top: currentTimePosition },
                ]}
              >
                <View style={styles.currentTimeDot} />
                <View style={styles.currentTimeLine} />
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Add Event Button - Fixed at bottom */}
      <View
        style={[
          styles.addButtonContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
        ]}
      >
        <Button
          title="+ Add Event"
          onPress={handleAddBlock}
          color={colors.teal}
        />
      </View>

      {/* Time Block Modal */}
      <TimeBlockModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveBlock}
        onDelete={
          selectedBlock ? () => handleDeleteBlock(selectedBlock) : undefined
        }
        initialBlock={selectedBlock}
        date={dateString}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  todayBadge: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  todayBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "600",
    fontSize: 10,
  },
  addButtonContainer: {
    marginHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.base,
  },
  timelineContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    height: TOP_PADDING + HOUR_HEIGHT * 24,
    position: "relative",
  },
  topPadding: {
    height: TOP_PADDING,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hourLabelContainer: {
    width: TIME_COLUMN_WIDTH,
    paddingRight: spacing.sm,
    alignItems: "flex-end",
  },
  hourLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  timeBlock: {
    position: "absolute",
    backgroundColor: colors.teal,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
    overflow: "hidden",
  },
  timeBlockTitle: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: "600",
  },
  timeBlockTime: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    marginTop: 2,
  },
  currentTimeIndicator: {
    position: "absolute",
    left: TIME_COLUMN_WIDTH - 4,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#FF3B30",
  },
});
