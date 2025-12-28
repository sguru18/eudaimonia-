import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { format } from 'date-fns';
import { colors, typography, spacing } from '../../theme';
import { Header, Card, Button } from '../../components';
import { expenseService } from '../../services/database';

export const ExportScreen = () => {
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const expenses = await expenseService.getAll();
      
      if (expenses.length === 0) {
        Alert.alert('No Data', 'No expenses to export');
        return;
      }

      // Generate CSV
      const headers = ['Date', 'Name', 'Category', 'Amount', 'Notes'];
      const rows = expenses.map(e => [
        e.date,
        e.name,
        e.category,
        e.amount.toString(),
        e.notes || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Share CSV
      await Share.share({
        message: csv,
        title: 'Eudaimonia - Expenses Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = async () => {
    setExporting(true);
    try {
      const expenses = await expenseService.getAll();
      
      if (expenses.length === 0) {
        Alert.alert('No Data', 'No expenses to export');
        return;
      }

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const byCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

      const summary = [
        '📊 Eudaimonia - Expense Summary',
        '',
        `Total Spent: $${total.toFixed(2)}`,
        `Total Expenses: ${expenses.length}`,
        '',
        'By Category:',
        ...Object.entries(byCategory).map(
          ([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`
        ),
        '',
        `Exported on ${format(new Date(), 'MMMM d, yyyy')}`,
      ].join('\n');

      await Share.share({ message: summary });
    } catch (error) {
      Alert.alert('Error', 'Failed to export summary');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header size="large" color={colors.finances}>
            Export Data
          </Header>
          <Text style={styles.subtitle}>
            Share your expense data for personal records
          </Text>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>CSV Export</Text>
            <Text style={styles.cardDescription}>
              Export all your expenses as a CSV file for spreadsheet analysis
            </Text>
            <Button
              title="Export CSV"
              onPress={handleExportCSV}
              loading={exporting}
              color={colors.finances}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Summary Export</Text>
            <Text style={styles.cardDescription}>
              Get a text summary of your spending by category
            </Text>
            <Button
              title="Export Summary"
              onPress={handleExportSummary}
              loading={exporting}
              variant="outline"
              color={colors.finances}
            />
          </Card>

          <View style={styles.note}>
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text style={styles.noteText}>
              Your data stays on your device. Exports are shared through your system's
              share dialog.
            </Text>
          </View>
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
  card: {
    marginTop: spacing.lg,
  },
  cardTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.beige,
    borderRadius: 8,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.textLight,
    flex: 1,
  },
});

