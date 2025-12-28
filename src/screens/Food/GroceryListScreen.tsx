import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header, Card, Input, Button } from '../../components';
import { groceryService } from '../../services/database';
import type { GroceryItem } from '../../types';

export const GroceryListScreen = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await groceryService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error loading grocery items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const newItem = await groceryService.create({
        name: newItemName.trim(),
        checked: false,
      });
      setNewItemName('');
      if (newItem) {
        // Optimistically update state without reloading
        setItems(prevItems => [newItem, ...prevItems]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleToggleItem = async (item: GroceryItem) => {
    try {
      // Optimistically update state
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id ? { ...i, checked: !i.checked } : i
        )
      );
      await groceryService.update(item.id, { checked: !item.checked });
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
      // Revert on error
      loadItems();
    }
  };

  const handleDeleteItem = async (item: GroceryItem) => {
    try {
      // Optimistically update state
      setItems(prevItems => prevItems.filter(i => i.id !== item.id));
      await groceryService.delete(item.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
      // Revert on error
      loadItems();
    }
  };

  const handleShareList = async () => {
    const uncheckedItems = items.filter(i => !i.checked);
    if (uncheckedItems.length === 0) {
      Alert.alert('Empty List', 'No items to share');
      return;
    }

    const list = uncheckedItems.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');
    const message = `🥗 Grocery List:\n\n${list}`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleClearChecked = () => {
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) return;

    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedItems.length} checked item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            for (const item of checkedItems) {
              await groceryService.delete(item.id);
            }
            loadItems();
          },
        },
      ]
    );
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadItems} />
        }
      >
        <View style={styles.content}>
          <Header size="large" color={colors.food}>
            Grocery List
          </Header>

          {/* Add Item */}
          <Card style={styles.addCard}>
            <View style={styles.addRow}>
              <Input
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="Add item..."
                style={styles.addInput}
                onSubmitEditing={handleAddItem}
              />
              <Button
                title="Add"
                onPress={handleAddItem}
                color={colors.food}
                style={styles.addButton}
              />
            </View>
          </Card>

          {/* Unchecked Items */}
          {uncheckedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>To Buy ({uncheckedItems.length})</Text>
              {uncheckedItems.map(item => (
                <GroceryItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleItem(item)}
                  onDelete={() => handleDeleteItem(item)}
                />
              ))}
            </View>
          )}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Checked ({checkedItems.length})</Text>
                <TouchableOpacity onPress={handleClearChecked}>
                  <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {checkedItems.map(item => (
                <GroceryItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleItem(item)}
                  onDelete={() => handleDeleteItem(item)}
                />
              ))}
            </View>
          )}

          {/* Actions */}
          {items.length > 0 && (
            <Button
              title="Share List"
              onPress={handleShareList}
              variant="outline"
              color={colors.food}
              style={styles.shareButton}
            />
          )}

          {items.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>
                Your grocery list is empty.{'\n'}Start by adding items above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const GroceryItemRow: React.FC<{
  item: GroceryItem;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ item, onToggle, onDelete }) => {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onToggle}>
      <View style={styles.checkbox}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
          {item.name}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
  addCard: {
    marginTop: spacing.lg,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  addInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    justifyContent: 'center',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
  },
  clearButton: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.food,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: colors.food,
    fontWeight: '600',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  shareButton: {
    marginTop: spacing.xl,
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

