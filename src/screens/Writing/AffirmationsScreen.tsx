import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { reflectionService } from '../../services/database';
import type { Reflection } from '../../types';

const DEFAULT_AFFIRMATIONS = [
  'I am doing my best, and that is enough.',
  'I choose calm over chaos.',
  'Every small step counts.',
  'I am worthy of rest and reflection.',
  'Progress, not perfection.',
];

export const AffirmationsScreen = () => {
  const [affirmations, setAffirmations] = useState<Reflection[]>([]);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAffirmations = async () => {
    setLoading(true);
    try {
      const data = await reflectionService.getByType('affirmation');
      setAffirmations(data);
    } catch (error) {
      console.error('Error loading affirmations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffirmations();
  }, []);

  const handleAdd = async () => {
    if (!newAffirmation.trim()) return;

    try {
      await reflectionService.create({
        type: 'affirmation',
        content: newAffirmation.trim(),
        date: new Date().toISOString().split('T')[0],
        is_pinned: false,
      });
      setNewAffirmation('');
      loadAffirmations();
    } catch (error) {
      Alert.alert('Error', 'Failed to add affirmation');
    }
  };

  const handleAddDefault = async (text: string) => {
    try {
      await reflectionService.create({
        type: 'affirmation',
        content: text,
        date: new Date().toISOString().split('T')[0],
        is_pinned: false,
      });
      loadAffirmations();
    } catch (error) {
      console.error('Error adding default affirmation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reflectionService.delete(id);
      loadAffirmations();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete affirmation');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAffirmations} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.writing}>
            Affirmations
          </Header>
          <Text style={styles.subtitle}>
            Positive reminders to carry with you
          </Text>

          <Card style={styles.addCard}>
            <Input
              value={newAffirmation}
              onChangeText={setNewAffirmation}
              placeholder="Write your own affirmation..."
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <Button
              title="Add Affirmation"
              onPress={handleAdd}
              color={colors.writing}
            />
          </Card>

          {/* Default Suggestions */}
          {affirmations.length === 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Try these:</Text>
              {DEFAULT_AFFIRMATIONS.map((text, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionCard}
                  onPress={() => handleAddDefault(text)}
                >
                  <Text style={styles.suggestionText}>{text}</Text>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* User's Affirmations */}
          {affirmations.length > 0 && (
            <View style={styles.list}>
              <Text style={styles.sectionTitle}>Your Affirmations</Text>
              {affirmations.map(affirmation => (
                <Card key={affirmation.id} style={styles.affirmationCard}>
                  <View style={styles.affirmationRow}>
                    <Text style={styles.affirmationText}>
                      {affirmation.content}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(affirmation.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
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
  addCard: {
    marginTop: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  suggestionsSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  suggestionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.beige,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontStyle: 'italic',
  },
  addIcon: {
    fontSize: 24,
    color: colors.writing,
    marginLeft: spacing.md,
  },
  list: {
    marginTop: spacing.xl,
  },
  affirmationCard: {
    marginBottom: spacing.md,
  },
  affirmationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  affirmationText: {
    ...typography.bodyLarge,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
});

