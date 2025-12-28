import { Button, Card, Header, NotificationSettings } from "@/src/components";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  useFeatureToggles,
  type FeatureKey,
} from "@/src/contexts/FeatureTogglesContext";
import { colors, spacing, typography } from "@/src/theme";
import React, { useState } from "react";
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
  finances: {
    label: "Finances",
    icon: "💰",
    description: "Expense tracking & budgeting",
  },
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
  const { user, signOut, deleteAccount } = useAuth();
  const { features, toggleFeature } = useFeatureToggles();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Second confirmation for extra safety
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account and all associated data. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    const { error } = await deleteAccount();
                    setIsDeleting(false);
                    
                    if (error) {
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again or contact support."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
                // Skip stretch - commented out for App Store submission
                return featureKey !== "stretch";
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

          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <Text style={styles.dangerZoneText}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <Button
              title={isDeleting ? "Deleting..." : "Delete Account"}
              onPress={handleDeleteAccount}
              variant="outline"
              color={colors.error}
              style={styles.deleteButton}
              disabled={isDeleting}
            />
          </View>

          <View style={styles.contactNote}>
            <Text style={styles.contactText}>
              📧 For feedback, bugs, or feature requests, email us at{" "}
              <Text style={styles.contactEmail}>shguru110@gmail.com</Text>
            </Text>
          </View>
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
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.error + "30",
  },
  dangerZoneTitle: {
    ...typography.label,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  dangerZoneText: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  deleteButton: {
    borderColor: colors.error + "50",
  },
  contactNote: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  contactText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  contactEmail: {
    color: colors.teal,
    fontWeight: "600",
  },
});
