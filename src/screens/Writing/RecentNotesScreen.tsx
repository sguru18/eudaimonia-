import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Button, NoteCard } from '../../components';
import { useNotes } from '../../hooks/useNotes';
import type { EntityType } from '../../types';

const FILTERS: { label: string; value: EntityType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Food', value: 'meal' },
  { label: 'Finances', value: 'expense' },
  { label: 'Habits', value: 'habit' },
  { label: 'Reflections', value: 'reflection' },
];

export const RecentNotesScreen = () => {
  const router = useRouter();
  const { notes, loading, deleteNote, togglePin, refresh } = useNotes();
  const [filter, setFilter] = useState<EntityType | 'all'>('all');

  const filteredNotes = filter === 'all' 
    ? notes 
    : notes.filter(note => note.entity_type === filter);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.writing}>
            Writing
          </Header>
          <Text style={styles.subtitle}>
            All your reflections in one place
          </Text>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterTab,
                  filter === f.value && styles.filterTabActive,
                ]}
                onPress={() => setFilter(f.value)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === f.value && styles.filterTabTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.comingSoonText}>
              Writing prompts coming soon...
            </Text>
            {/* TODO: Add routes for Gratitude, Reflection, and Looking Forward screens
            <Button
              title="Gratitude"
              onPress={() => router.push('/(tabs)/notes/gratitude')}
              variant="outline"
              size="small"
              color={colors.writing}
              style={styles.quickButton}
            />
            */}
          </View>

          {/* Notes List */}
          {filteredNotes.length > 0 ? (
            <View style={styles.notesList}>
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPin={() => togglePin(note.id)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✍️</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'No notes yet.\nStart writing to see your reflections here.'
                  : `No ${filter} notes yet.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterScroll: {
    marginBottom: spacing.lg,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterTabActive: {
    borderColor: colors.writing,
    backgroundColor: '#f8f5f2',
  },
  filterTabText: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.writing,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickButton: {
    flex: 1,
    minWidth: 100,
  },
  comingSoonText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    width: '100%',
  },
  notesList: {
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

