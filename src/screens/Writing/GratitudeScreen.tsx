import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { reflectionService } from '../../services/database';
import type { Reflection } from '../../types';

export const GratitudeScreen = () => {
  const [gratitudes, setGratitudes] = useState<Reflection[]>([]);
  const [todayContent, setTodayContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadGratitudes = async () => {
    setLoading(true);
    try {
      const data = await reflectionService.getByType('gratitude');
      setGratitudes(data);

      // Check if there's already a gratitude for today
      const todayGratitude = data.find(g => g.date === today);
      if (todayGratitude) {
        setTodayContent(todayGratitude.content);
      }
    } catch (error) {
      console.error('Error loading gratitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGratitudes();
  }, []);

  const handleSave = async () => {
    if (!todayContent.trim()) {
      Alert.alert('Empty', 'Please write something you\'re grateful for');
      return;
    }

    setSaving(true);
    try {
      const existingToday = gratitudes.find(g => g.date === today);

      if (existingToday) {
        await reflectionService.update(existingToday.id, {
          content: todayContent.trim(),
        });
      } else {
        await reflectionService.create({
          type: 'gratitude',
          content: todayContent.trim(),
          date: today,
          is_pinned: false,
        });
      }

      Alert.alert('Saved', 'Your gratitude has been recorded 🙏');
      loadGratitudes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save gratitude');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const pastGratitudes = gratitudes.filter(g => g.date !== today);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGratitudes} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.writing}>
            Gratitude
          </Header>
          <Text style={styles.subtitle}>
            What are you grateful for today?
          </Text>

          <Card style={styles.todayCard}>
            <Text style={styles.dateLabel}>
              {format(new Date(), 'EEEE, MMMM d')}
            </Text>
            <Input
              value={todayContent}
              onChangeText={setTodayContent}
              placeholder="I'm grateful for..."
              multiline
              numberOfLines={4}
              autoCapitalize="sentences"
            />
            <Button
              title="Save Today's Gratitude"
              onPress={handleSave}
              loading={saving}
              color={colors.writing}
            />
          </Card>

          {/* Past Gratitudes */}
          {pastGratitudes.length > 0 && (
            <View style={styles.pastSection}>
              <Text style={styles.sectionTitle}>Past Gratitudes</Text>
              {pastGratitudes.map(gratitude => (
                <Card key={gratitude.id} style={styles.gratitudeCard}>
                  <Text style={styles.gratitudeDate}>
                    {format(new Date(gratitude.date), 'MMMM d, yyyy')}
                  </Text>
                  <Text style={styles.gratitudeContent}>
                    {gratitude.content}
                  </Text>
                </Card>
              ))}
            </View>
          )}

          {pastGratitudes.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🙏</Text>
              <Text style={styles.emptyText}>
                Start your gratitude practice today.{'\n'}
                Come back daily to build a habit.
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
  todayCard: {
    marginTop: spacing.lg,
  },
  dateLabel: {
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
  gratitudeCard: {
    marginBottom: spacing.md,
  },
  gratitudeDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  gratitudeContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
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

