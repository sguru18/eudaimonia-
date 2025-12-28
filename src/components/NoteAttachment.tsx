import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface NoteAttachmentProps {
  note?: string;
  onPress: () => void;
  onView?: () => void;
  compact?: boolean;
}

export const NoteAttachment: React.FC<NoteAttachmentProps> = ({
  note,
  onPress,
  onView,
  compact = false,
}) => {
  if (!note && compact) {
    return (
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={onPress}
      >
        <Text style={styles.addIcon}>📝</Text>
      </TouchableOpacity>
    );
  }

  if (!note) {
    return (
      <TouchableOpacity 
        style={styles.addContainer} 
        onPress={onPress}
      >
        <Text style={styles.addIcon}>📝</Text>
        <Text style={styles.addText}>Add note</Text>
      </TouchableOpacity>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactNote} 
        onPress={onView || onPress}
      >
        <Text style={styles.compactNoteIcon}>📝</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.noteContainer} 
      onPress={onView || onPress}
    >
      <Text style={styles.noteIcon}>📝</Text>
      <Text style={styles.noteText} numberOfLines={2}>
        {note}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    padding: spacing.xs,
  },
  addIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addText: {
    ...typography.body,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  compactNote: {
    padding: spacing.xs,
  },
  compactNoteIcon: {
    fontSize: 20,
    opacity: 1,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.beige,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
});

