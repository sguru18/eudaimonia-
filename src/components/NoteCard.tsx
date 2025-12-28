import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card } from './Card';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onPin,
  onDelete,
}) => {
  const getContextBadgeColor = () => {
    switch (note.entity_type) {
      case 'meal':
      case 'grocery_item':
        return colors.food;
      case 'expense':
        return colors.finances;
      case 'habit':
      case 'habit_completion':
        return colors.habits;
      case 'reflection':
        return colors.writing;
      default:
        return colors.textMuted;
    }
  };

  const getContextLabel = () => {
    switch (note.entity_type) {
      case 'meal':
        return 'MEAL';
      case 'grocery_item':
        return 'GROCERY';
      case 'expense':
        return 'EXPENSE';
      case 'habit':
      case 'habit_completion':
        return 'HABIT';
      case 'reflection':
        return 'REFLECTION';
      default:
        return 'NOTE';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.badge, { backgroundColor: getContextBadgeColor() }]}>
              <Text style={styles.badgeText}>{getContextLabel()}</Text>
            </View>
            {note.is_pinned && <Text style={styles.pinIcon}>📌</Text>}
          </View>
          <Text style={styles.timestamp}>
            {format(new Date(note.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>

        <Text style={styles.content}>{note.content}</Text>

        {(onPin || onDelete) && (
          <View style={styles.actions}>
            {onPin && (
              <TouchableOpacity onPress={onPin} style={styles.actionButton}>
                <Text style={styles.actionIcon}>{note.is_pinned ? '📌' : '📍'}</Text>
                <Text style={styles.actionText}>
                  {note.is_pinned ? 'Unpin' : 'Pin'}
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Text style={styles.actionIcon}>🗑</Text>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  pinIcon: {
    fontSize: 14,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
  deleteText: {
    color: colors.error,
  },
});

