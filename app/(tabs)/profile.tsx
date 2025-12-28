import { Button, Card, Header, NotificationSettings } from "@/src/components";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  useFeatureToggles,
  type FeatureKey,
} from "@/src/contexts/FeatureTogglesContext";
import { colors, spacing, typography } from "@/src/theme";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FEATURE_INFO: Partial<
  Record<FeatureKey, { label: string; icon: string; description: string }>
> = {
  food: {
    label: "Food Planner",
    icon: "🥗",
    description: "Meal planning & grocery lists",
  },
  planner: {
    label: "Day Planner",
    icon: "📅",
    description: "Daily schedule & time blocks",
  },
  // Finances - commented out for App Store submission, will restore later
  // finances: {
  //   label: "Finances",
  //   icon: "💰",
  //   description: "Expense tracking & budgeting",
  // },
  habits: {
    label: "Habits",
    icon: "✓",
    description: "Habit tracking",
  },
  notes: {
    label: "Notes",
    icon: "📝",
    description: "Quick notes & journaling",
  },
  priorities: {
    label: "Priorities",
    icon: "🎯",
    description: "Weekly priority tracking & visualization",
  },
  // Stretch - commented out for App Store submission, will restore later
  // stretch: {
  //   label: "Stretch",
  //   icon: "🧘",
  //   description: "Guided stretching routines",
  // },
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { features, toggleFeature } = useFeatureToggles();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Header size="large" color={colors.teal}>
            Profile
          </Header>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <NotificationSettings />

          <View style={styles.divider} />

          <Card style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </Card>

          {/* <Card style={styles.card}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.valueSmall}>{user?.id}</Text>
          </Card> */}

          <Card style={styles.card}>
            <Text style={styles.label}>Account Created</Text>
            <Text style={styles.value}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "N/A"}
            </Text>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enabled Features</Text>
            <Text style={styles.sectionText}>
              Toggle features to customize your tabs
            </Text>
          </View>

          <Card style={styles.featuresCard}>
            {(Object.keys(FEATURE_INFO) as FeatureKey[])
              .filter((featureKey) => {
                // Skip finances and stretch - commented out for App Store submission
                return featureKey !== "finances" && featureKey !== "stretch";
              })
              .map((featureKey) => {
                const feature = FEATURE_INFO[featureKey];
                if (!feature) return null;

                return (
                  <View key={featureKey} style={styles.featureRow}>
                    <View style={styles.featureInfo}>
                      <View style={styles.featureHeader}>
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                        <Text style={styles.featureLabel}>{feature.label}</Text>
                      </View>
                      <Text style={styles.featureDescription}>
                        {feature.description}
                      </Text>
                    </View>
                    <Switch
                      value={features[featureKey]}
                      onValueChange={() => toggleFeature(featureKey)}
                      trackColor={{ false: colors.border, true: colors.teal }}
                      thumbColor={colors.white}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                );
              })}
          </Card>

          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            color={colors.error}
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  card: {
    marginTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  valueSmall: {
    ...typography.caption,
    color: colors.text,
    fontFamily: "monospace",
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.textLight,
    lineHeight: 22,
  },
  featuresCard: {
    marginTop: spacing.md,
    padding: 0,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featureInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  featureLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textLight,
    marginLeft: 28, // Align with label (icon width + margin)
  },
  signOutButton: {
    marginTop: spacing.lg,
  },
});
