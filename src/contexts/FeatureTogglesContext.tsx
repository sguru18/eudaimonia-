import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type FeatureKey =
  | "food"
  | "planner"
  | "finances"
  | "habits"
  | "notes"
  | "stretch"
  | "priorities";

export interface FeatureToggles {
  food: boolean;
  planner: boolean;
  finances: boolean;
  habits: boolean;
  notes: boolean;
  stretch: boolean;
  priorities: boolean;
}

interface FeatureTogglesContextType {
  features: FeatureToggles;
  toggleFeature: (feature: FeatureKey) => Promise<void>;
  loading: boolean;
}

const FeatureTogglesContext = createContext<
  FeatureTogglesContextType | undefined
>(undefined);

const STORAGE_KEY = "feature_toggles";
const DEFAULT_FEATURES: FeatureToggles = {
  food: true,
  planner: true,
  finances: false, // Commented out for App Store submission, will restore later
  habits: true,
  notes: true,
  stretch: false, // Commented out for App Store submission, will restore later
  priorities: true,
};

export const FeatureTogglesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureToggles>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFeatures(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading feature toggles:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature: FeatureKey) => {
    const newFeatures = {
      ...features,
      [feature]: !features[feature],
    };

    setFeatures(newFeatures);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFeatures));
    } catch (error) {
      console.error("Error saving feature toggles:", error);
    }
  };

  return (
    <FeatureTogglesContext.Provider
      value={{ features, toggleFeature, loading }}
    >
      {children}
    </FeatureTogglesContext.Provider>
  );
};

export const useFeatureToggles = () => {
  const context = useContext(FeatureTogglesContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureToggles must be used within a FeatureTogglesProvider"
    );
  }
  return context;
};
