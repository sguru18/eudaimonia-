import { OnboardingModal } from "@/src/components";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { FeatureTogglesProvider } from "@/src/contexts/FeatureTogglesContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

export const unstable_settings = {
  initialRouteName: "index",
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace("/(auth)/sign-in");
    } else if (user && inAuthGroup) {
      // Redirect to app if authenticated
      router.replace("/(tabs)/food");
    }
  }, [user, segments, loading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <OnboardingModal userId={user?.id} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FeatureTogglesProvider>
          <RootLayoutNav />
          <StatusBar style="dark" />
        </FeatureTogglesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
