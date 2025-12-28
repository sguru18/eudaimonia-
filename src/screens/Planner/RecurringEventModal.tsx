import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card } from "../../components";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { RecurringTimeBlock } from "../../types";
import { DAY_NAMES } from "../../types";

interface RecurringEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    block: Omit<RecurringTimeBlock, "id" | "created_at" | "updated_at" | "user_id">
  ) => void;
  onDelete?: () => void;
  initialBlock: RecurringTimeBlock | null;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// Parse HH:MM (24hr) to 12hr format
const parseTime = (
  time: string
): { hour12: number; minute: number; isPM: boolean } => {
  const [h, m] = time.split(":").map(Number);
  const isPM = h >= 12;
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const roundedMinute = Math.round(m / 5) * 5;
  return { hour12, minute: roundedMinute >= 60 ? 55 : roundedMinute, isPM };
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

interface SimplePickerProps {
  items: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  formatItem?: (value: number) => string;
}

const SimplePicker: React.FC<SimplePickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  formatItem = (v) => v.toString().padStart(2, "0"),
}) => {
  return (
    <View style={pickerStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pickerStyles.scrollContent}
      >
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <Pressable
              key={item}
              style={[
                pickerStyles.item,
                isSelected && pickerStyles.itemSelected,
              ]}
              onPress={() => onValueChange(item)}
            >
              <Text
                style={[
                  pickerStyles.itemText,
                  isSelected && pickerStyles.itemTextSelected,
                ]}
              >
                {formatItem(item)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  container: {
    height: 50,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    minWidth: 44,
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: colors.teal,
  },
  itemText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  itemTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
});

export const RecurringEventModal: React.FC<RecurringEventModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialBlock,
}) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [startHour12, setStartHour12] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [startIsPM, setStartIsPM] = useState(false);
  const [endHour12, setEndHour12] = useState(10);
  const [endMinute, setEndMinute] = useState(0);
  const [endIsPM, setEndIsPM] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [isActive, setIsActive] = useState(true);

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
        setDaysOfWeek([...initialBlock.days_of_week]);
        setIsActive(initialBlock.is_active);
      } else {
        // Default to 9am-10am, Mon-Fri
        setTitle("");
        setStartHour12(9);
        setStartMinute(0);
        setStartIsPM(false);
        setEndHour12(10);
        setEndMinute(0);
        setEndIsPM(false);
        setDaysOfWeek([false, true, true, true, true, true, false]); // Mon-Fri default
        setIsActive(true);
      }
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [visible, initialBlock]);

  const toggleDay = (index: number) => {
    const newDays = [...daysOfWeek];
    newDays[index] = !newDays[index];
    setDaysOfWeek(newDays);
  };

  const startTime24 = formatTime24(startHour12, startMinute, startIsPM);
  const endTime24 = formatTime24(endHour12, endMinute, endIsPM);

  const handleSave = () => {
    if (!title.trim()) return;
    if (startTime24 >= endTime24) return;
    if (!daysOfWeek.some(d => d)) return; // At least one day selected

    onSave({
      title: title.trim(),
      start_time: startTime24,
      end_time: endTime24,
      days_of_week: daysOfWeek,
      is_active: isActive,
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
        <Pressable
          onPress={onDone}
          style={({ pressed }) => [
            styles.doneButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.pickerDone}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.pickerRow}>
        <Text style={styles.pickerLabel}>Hour</Text>
        <SimplePicker
          items={HOURS_12}
          selectedValue={hour12}
          onValueChange={onHourChange}
          formatItem={(v) => v.toString()}
        />
      </View>

      <View style={styles.pickerRow}>
        <Text style={styles.pickerLabel}>Minute</Text>
        <SimplePicker
          items={MINUTES}
          selectedValue={minute}
          onValueChange={onMinuteChange}
        />
      </View>

      <View style={styles.ampmRow}>
        <Pressable
          style={[styles.ampmButton, !isPM && styles.ampmButtonSelected]}
          onPress={() => onAMPMChange(false)}
        >
          <Text style={[styles.ampmText, !isPM && styles.ampmTextSelected]}>
            AM
          </Text>
        </Pressable>
        <Pressable
          style={[styles.ampmButton, isPM && styles.ampmButtonSelected]}
          onPress={() => onAMPMChange(true)}
        >
          <Text style={[styles.ampmText, isPM && styles.ampmTextSelected]}>
            PM
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const isValid = title.trim() && startTime24 < endTime24 && daysOfWeek.some(d => d);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackground, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {initialBlock ? "Edit Recurring Event" : "New Recurring Event"}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={!isValid}>
              <Text
                style={[
                  styles.saveButton,
                  !isValid && styles.saveButtonDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Input */}
            <Card style={styles.inputCard}>
              <Text style={styles.label}>Event Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Morning Class, Team Meeting..."
                placeholderTextColor={colors.textMuted}
                autoFocus={!initialBlock}
              />
            </Card>

            {/* Days of Week */}
            <Card style={styles.inputCard}>
              <Text style={styles.label}>Repeat On</Text>
              <View style={styles.daysContainer}>
                {DAY_NAMES.map((day, index) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayButton,
                      daysOfWeek[index] && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        daysOfWeek[index] && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {!daysOfWeek.some(d => d) && (
                <Text style={styles.hintText}>Select at least one day</Text>
              )}
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

            {/* Active Toggle */}
            {initialBlock && (
              <Card style={styles.inputCard}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Active</Text>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      isActive && styles.toggleButtonActive,
                    ]}
                    onPress={() => setIsActive(!isActive)}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        isActive && styles.toggleTextActive,
                      ]}
                    >
                      {isActive ? "ON" : "OFF"}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.hintText}>
                  {isActive
                    ? "This event will appear on your calendar"
                    : "This event is paused and won't appear"}
                </Text>
              </Card>
            )}

            {/* Delete Button */}
            {initialBlock && onDelete && (
              <Button
                title="Delete Recurring Event"
                onPress={onDelete}
                variant="outline"
                color={colors.error}
                style={styles.deleteButton}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  dayButtonSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.white,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
  },
  doneButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pickerDone: {
    ...typography.bodySmall,
    color: colors.teal,
    fontWeight: "600",
  },
  pickerRow: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  ampmRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ampmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  ampmButtonSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  ampmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  ampmTextSelected: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButtonActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleTextActive: {
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
    marginBottom: spacing.xl,
  },
});

