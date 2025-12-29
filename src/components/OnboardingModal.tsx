import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "../theme";
import { Button } from "./Button";

const ONBOARDING_COMPLETE_KEY = "onboarding_complete";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: "🥗",
    title: "Food Planner",
    description: "Plan your weekly meals and generate shopping lists.",
    color: colors.sage,
  },
  {
    icon: "📅",
    title: "Day Planner",
    description:
      "Organize your day with time blocks. Schedule tasks and activities with an intuitive visual planner.",
    color: colors.teal,
  },
  {
    icon: "✓",
    title: "Habits",
    description:
      "Build positive routines by tracking daily habits. Watch your streaks grow and celebrate your consistency.",
    color: colors.mint,
  },
  {
    icon: "💰",
    title: "Finances",
    description:
      "Track your spending, manage your budget, and gain insights into your financial habits. Stay on top of your money with ease.",
    color: colors.finances,
  },
  {
    icon: "📝",
    title: "Notes",
    description:
      "Capture thoughts, ideas, and reflections. Quick notes for anything you want to remember.",
    color: colors.writing,
  },
  {
    icon: "🎯",
    title: "Priorities",
    description:
      "Focus on what matters most each week. Track your top priorities and visualize your progress over time.",
    color: colors.lavender,
  },
];

interface OnboardingModalProps {
  userId: string | undefined;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId }) => {
  const [visible, setVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (userId) {
      checkOnboardingStatus();
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      // Animate in when visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem(
        `${ONBOARDING_COMPLETE_KEY}_${userId}`
      );
      if (!onboardingComplete) {
        // Small delay to let the app settle before showing modal
        setTimeout(() => setVisible(true), 500);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(
        `${ONBOARDING_COMPLETE_KEY}_${userId}`,
        "true"
      );
      setVisible(false);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      setVisible(false);
    }
  };

  const handleNext = () => {
    if (currentPage < FEATURES.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {FEATURES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage && styles.dotActive,
            index === currentPage && {
              backgroundColor: FEATURES[currentPage].color,
            },
          ]}
        />
      ))}
    </View>
  );

  const currentFeature = FEATURES[currentPage];
  const isLastPage = currentPage === FEATURES.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {currentPage === 0 ? (
              <>
                <Text style={styles.welcomeTitle}>Welcome to Eudaimonia!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Your companion for a balanced life
                </Text>
              </>
            ) : (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Feature Card */}
          <View
            style={[
              styles.featureCard,
              { borderLeftColor: currentFeature.color },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: currentFeature.color + "20" },
              ]}
            >
              <Text style={styles.featureIcon}>{currentFeature.icon}</Text>
            </View>
            <Text style={styles.featureTitle}>{currentFeature.title}</Text>
            <Text style={styles.featureDescription}>
              {currentFeature.description}
            </Text>
          </View>

          {/* Dots */}
          {renderDots()}

          {/* Footer */}
          <View style={styles.footer}>
            {currentPage === 0 && (
              <Text style={styles.footerNote}>
                💡 You can toggle any feature on or off in your Profile settings
              </Text>
            )}

            <Button
              title={isLastPage ? "Get Started" : "Next"}
              onPress={handleNext}
              color={currentFeature.color}
              style={styles.nextButton}
            />

            {currentPage === 0 && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>Skip introduction</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: "85%",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    minHeight: 60,
    justifyContent: "center",
  },
  welcomeTitle: {
    ...typography.headerLarge,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  skipButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
  featureCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  featureIcon: {
    fontSize: 36,
  },
  featureTitle: {
    ...typography.headerSmall,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  featureDescription: {
    ...typography.body,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.teal,
  },
  footer: {
    alignItems: "center",
  },
  footerNote: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  nextButton: {
    width: "100%",
    marginBottom: spacing.md,
  },
  skipLink: {
    padding: spacing.sm,
  },
  skipLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
});
