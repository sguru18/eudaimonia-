import { Button, Card, Input } from "@/src/components";
import { useAuth } from "@/src/contexts/AuthContext";
import { colors, spacing, typography } from "@/src/theme";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Sign In Failed", error.message);
    } else {
      router.replace("/(tabs)/food");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.icon}>🌱</Text>
            <Text style={styles.title}>Eudaimonia</Text>
            <Text style={styles.definition}>
              defined as: a true feeling of joy independent of all things
            </Text>

            <Card style={styles.card}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                color={colors.teal}
                style={styles.button}
              />
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Text style={styles.link}>Sign Up</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headerLarge,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  definition: {
    ...typography.body,
    color: colors.teal,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    ...typography.body,
    color: colors.textLight,
  },
  link: {
    ...typography.body,
    color: colors.teal,
    fontWeight: "600",
  },
});
