import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { format, startOfWeek } from 'date-fns';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { reflectionService } from '../../services/database';
import type { Reflection } from '../../types';

export const ReflectionScreen = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const loadReflections = async () => {
    setLoading(true);
    try {
      const data = await reflectionService.getByType('weekly');
      setReflections(data);

      // Check if there's already a reflection for this week
      const thisWeekReflection = data.find(r => r.date === thisWeek);
      if (thisWeekReflection) {
        setContent(thisWeekReflection.content);
      }
    } catch (error) {
      console.error('Error loading reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReflections();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty', 'Please write your reflection');
      return;
    }

    setSaving(true);
    try {
      const existingThisWeek = reflections.find(r => r.date === thisWeek);

      if (existingThisWeek) {
        await reflectionService.update(existingThisWeek.id, {
          content: content.trim(),
        });
      } else {
        await reflectionService.create({
          type: 'weekly',
          content: content.trim(),
          date: thisWeek,
          is_pinned: false,
        });
      }

      Alert.alert('Saved', 'Your reflection has been recorded ✨');
      loadReflections();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reflection');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const pastReflections = reflections.filter(r => r.date !== thisWeek);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadReflections} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.writing}>
            Weekly Reflection
          </Header>
          <Text style={styles.subtitle}>
            Reflect on your week with gentle awareness
          </Text>

          <Card style={styles.promptCard}>
            <Text style={styles.promptTitle}>Prompts to consider:</Text>
            <Text style={styles.prompt}>• What brought you joy this week?</Text>
            <Text style={styles.prompt}>• What challenged you?</Text>
            <Text style={styles.prompt}>• What did you learn about yourself?</Text>
            <Text style={styles.prompt}>• What do you want to carry forward?</Text>
          </Card>

          <Card style={styles.editorCard}>
            <Text style={styles.weekLabel}>
              Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMMM d')}
            </Text>
            <Input
              value={content}
              onChangeText={setContent}
              placeholder="Write your reflection..."
              multiline
              numberOfLines={10}
              autoCapitalize="sentences"
            />
            <Button
              title="Save Reflection"
              onPress={handleSave}
              loading={saving}
              color={colors.writing}
            />
          </Card>

          {/* Past Reflections */}
          {pastReflections.length > 0 && (
            <View style={styles.pastSection}>
              <Text style={styles.sectionTitle}>Past Reflections</Text>
              {pastReflections.map(reflection => (
                <Card key={reflection.id} style={styles.reflectionCard}>
                  <Text style={styles.reflectionDate}>
                    Week of {format(new Date(reflection.date), 'MMMM d, yyyy')}
                  </Text>
                  <Text style={styles.reflectionContent}>
                    {reflection.content}
                  </Text>
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
  promptCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.beige,
  },
  promptTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  prompt: {
    ...typography.bodySmall,
    color: colors.textLight,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  editorCard: {
    marginTop: spacing.lg,
  },
  weekLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  pastSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  reflectionCard: {
    marginBottom: spacing.md,
  },
  reflectionDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  reflectionContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
});

