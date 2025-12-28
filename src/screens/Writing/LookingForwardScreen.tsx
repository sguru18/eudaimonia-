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
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { reflectionService } from '../../services/database';
import type { Reflection } from '../../types';

export const LookingForwardScreen = () => {
  const [items, setItems] = useState<Reflection[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await reflectionService.getByType('looking_forward');
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    if (!newItem.trim()) return;

    try {
      await reflectionService.create({
        type: 'looking_forward',
        content: newItem.trim(),
        date: new Date().toISOString().split('T')[0],
        is_pinned: false,
      });
      setNewItem('');
      loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reflectionService.delete(id);
      loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadItems} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.writing}>
            Looking Forward To
          </Header>
          <Text style={styles.subtitle}>
            Upcoming joys, goals, and moments to anticipate
          </Text>

          <Card style={styles.addCard}>
            <View style={styles.addRow}>
              <Input
                value={newItem}
                onChangeText={setNewItem}
                placeholder="What are you looking forward to?"
                style={styles.addInput}
                onSubmitEditing={handleAdd}
              />
              <Button
                title="Add"
                onPress={handleAdd}
                size="small"
                color={colors.writing}
              />
            </View>
          </Card>

          {items.length > 0 ? (
            <View style={styles.list}>
              {items.map(item => (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemEmoji}>✨</Text>
                    <Text style={styles.itemContent}>{item.content}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌟</Text>
              <Text style={styles.emptyText}>
                What are you excited about?{'\n'}
                Add things you're looking forward to.
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
  addCard: {
    marginTop: spacing.lg,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  addInput: {
    flex: 1,
    marginBottom: 0,
  },
  list: {
    marginTop: spacing.xl,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  itemEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  itemContent: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.textMuted,
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

