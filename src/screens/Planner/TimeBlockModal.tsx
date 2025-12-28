import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Card } from "../../components";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { TimeBlock } from "../../types";

interface TimeBlockModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    block: Omit<TimeBlock, "id" | "created_at" | "updated_at" | "user_id">
  ) => void;
  onDelete?: () => void;
  initialBlock: TimeBlock | null;
  date: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)); // 12, 1, 2, ... 11
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const AM_PM = ["AM", "PM"];
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Parse HH:MM (24hr) to 12hr format
const parseTime = (
  time: string
): { hour12: number; minute: number; isPM: boolean } => {
  const [h, m] = time.split(":").map(Number);
  const isPM = h >= 12;
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, isPM };
};

// Format 12hr to HH:MM (24hr) for storage
const formatTime24 = (
  hour12: number,
  minute: number,
  isPM: boolean
): string => {
  let hour24 = hour12;
  if (isPM && hour12 !== 12) hour24 = hour12 + 12;
  if (!isPM && hour12 === 12) hour24 = 0;
  return `${hour24.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

// Format for display (12hr with AM/PM)
const formatTimeDisplay = (
  hour12: number,
  minute: number,
  isPM: boolean
): string => {
  return `${hour12}:${minute.toString().padStart(2, "0")} ${
    isPM ? "PM" : "AM"
  }`;
};

interface WheelPickerProps {
  items: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  formatItem?: (value: number) => string;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  formatItem = (v) => v.toString().padStart(2, "0"),
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Scroll to selected value on mount
  useEffect(() => {
    const index = items.indexOf(selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    // Snap to nearest item
    scrollViewRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });

    onValueChange(items[clampedIndex]);
    setIsScrolling(false);
  };

  const handleScrollBegin = () => {
    setIsScrolling(true);
  };

  return (
    <View style={wheelStyles.container}>
      {/* Selection indicator */}
      <View style={wheelStyles.selectionIndicator} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        style={wheelStyles.scrollView}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e: any) => {
          // Handle case where momentum doesn't kick in
          if (e.nativeEvent.velocity?.y === 0) {
            handleScrollEnd(e);
          }
        }}
      >
        {items.map((item, index) => {
          const isSelected = item === selectedValue && !isScrolling;
          return (
            <TouchableOpacity
              key={item}
              style={wheelStyles.item}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                onValueChange(item);
              }}
            >
              <Text
                style={[
                  wheelStyles.itemText,
                  isSelected && wheelStyles.itemTextSelected,
                ]}
              >
                {formatItem(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const wheelStyles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  selectionIndicator: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.teal + "15",
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: "400",
  },
  itemTextSelected: {
    color: colors.teal,
    fontWeight: "600",
  },
});

export const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialBlock,
  date,
}) => {
  const [title, setTitle] = useState("");
  const [startHour12, setStartHour12] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [startIsPM, setStartIsPM] = useState(false);
  const [endHour12, setEndHour12] = useState(10);
  const [endMinute, setEndMinute] = useState(0);
  const [endIsPM, setEndIsPM] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialBlock) {
        setTitle(initialBlock.title);
        const start = parseTime(initialBlock.start_time);
        const end = parseTime(initialBlock.end_time);
        setStartHour12(start.hour12);
        setStartMinute(start.minute);
        setStartIsPM(start.isPM);
        setEndHour12(end.hour12);
        setEndMinute(end.minute);
        setEndIsPM(end.isPM);
      } else {
        // Default to current hour
        const now = new Date();
        const hour24 = now.getHours();
        const minute = now.getMinutes();
        const isPM = hour24 >= 12;
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;

        // End time is 1 hour later
        let endHour24 = Math.min(hour24 + 1, 23);
        const endIsPM = endHour24 >= 12;
        let endH12 = endHour24 % 12;
        if (endH12 === 0) endH12 = 12;

        setTitle("");
        setStartHour12(hour12);
        setStartMinute(minute);
        setStartIsPM(isPM);
        setEndHour12(endH12);
        setEndMinute(minute);
        setEndIsPM(endIsPM);
      }
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [visible, initialBlock]);

  // Convert to 24hr format for comparison and storage
  const startTime24 = formatTime24(startHour12, startMinute, startIsPM);
  const endTime24 = formatTime24(endHour12, endMinute, endIsPM);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    // Validate that end time is after start time
    if (startTime24 >= endTime24) {
      return;
    }

    onSave({
      title: title.trim(),
      date,
      start_time: startTime24,
      end_time: endTime24,
    });
  };

  const renderTimePicker = (
    hour12: number,
    minute: number,
    isPM: boolean,
    onHourChange: (h: number) => void,
    onMinuteChange: (m: number) => void,
    onAMPMChange: (pm: boolean) => void,
    onDone: () => void
  ) => (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Select Time</Text>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.pickerDone}>Done</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.wheelsContainer}>
        <View style={styles.wheelWrapper}>
          <Text style={styles.wheelLabel}>Hour</Text>
          <WheelPicker
            items={HOURS_12}
            selectedValue={hour12}
            onValueChange={onHourChange}
            formatItem={(v) => v.toString()}
          />
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.wheelWrapper}>
          <Text style={styles.wheelLabel}>Min</Text>
          <WheelPicker
            items={MINUTES}
            selectedValue={minute}
            onValueChange={onMinuteChange}
          />
        </View>
        <View style={styles.ampmWrapper}>
          <Text style={styles.wheelLabel}> </Text>
          <View style={styles.ampmButtons}>
            <TouchableOpacity
              style={[styles.ampmButton, !isPM && styles.ampmButtonSelected]}
              onPress={() => onAMPMChange(false)}
            >
              <Text style={[styles.ampmText, !isPM && styles.ampmTextSelected]}>
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ampmButton, isPM && styles.ampmButtonSelected]}
              onPress={() => onAMPMChange(true)}
            >
              <Text style={[styles.ampmText, isPM && styles.ampmTextSelected]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const isValid = title.trim() && startTime24 < endTime24;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialBlock ? "Edit Event" : "New Event"}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={!isValid}>
            <Text
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <Card style={styles.inputCard}>
            <Text style={styles.label}>Event Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter event title..."
              placeholderTextColor={colors.textMuted}
              autoFocus={!initialBlock}
            />
          </Card>

          {/* Start Time */}
          <Card style={styles.inputCard}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                setShowStartPicker(!showStartPicker);
                setShowEndPicker(false);
              }}
            >
              <Text style={styles.timeButtonText}>
                {formatTimeDisplay(startHour12, startMinute, startIsPM)}
              </Text>
              <Text style={styles.timeArrow}>
                {showStartPicker ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>
            {showStartPicker &&
              renderTimePicker(
                startHour12,
                startMinute,
                startIsPM,
                setStartHour12,
                setStartMinute,
                setStartIsPM,
                () => setShowStartPicker(false)
              )}
          </Card>

          {/* End Time */}
          <Card style={styles.inputCard}>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                setShowEndPicker(!showEndPicker);
                setShowStartPicker(false);
              }}
            >
              <Text style={styles.timeButtonText}>
                {formatTimeDisplay(endHour12, endMinute, endIsPM)}
              </Text>
              <Text style={styles.timeArrow}>{showEndPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {showEndPicker &&
              renderTimePicker(
                endHour12,
                endMinute,
                endIsPM,
                setEndHour12,
                setEndMinute,
                setEndIsPM,
                () => setShowEndPicker(false)
              )}
          </Card>

          {/* Validation Message */}
          {startTime24 >= endTime24 && (
            <Text style={styles.errorText}>
              End time must be after start time
            </Text>
          )}

          {/* Delete Button */}
          {initialBlock && onDelete && (
            <Button
              title="Delete Event"
              onPress={onDelete}
              variant="outline"
              color={colors.error}
              style={styles.deleteButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    ...typography.body,
    color: colors.teal,
  },
  saveButton: {
    ...typography.body,
    color: colors.teal,
    fontWeight: "600",
  },
  saveButtonDisabled: {
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  inputCard: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    height: 52,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: "center",
  },
  timeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeButtonText: {
    ...typography.body,
    color: colors.text,
    fontSize: 18,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  timeArrow: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
  },
  pickerDone: {
    ...typography.bodySmall,
    color: colors.teal,
    fontWeight: "600",
  },
  wheelsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  wheelWrapper: {
    flex: 1,
    alignItems: "center",
  },
  wheelLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text,
    marginHorizontal: spacing.sm,
    marginTop: spacing.lg,
  },
  ampmWrapper: {
    width: 60,
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  ampmButtons: {
    height: PICKER_HEIGHT,
    justifyContent: "center",
    gap: spacing.sm,
  },
  ampmButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ampmButtonSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  ampmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  ampmTextSelected: {
    color: colors.white,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.lg,
  },
});
