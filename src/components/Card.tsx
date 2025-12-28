import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  shadow?: keyof typeof shadows;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'base',
  shadow = 'md' 
}) => {
  return (
    <View style={[
      styles.card,
      { padding: spacing[padding] },
      shadows[shadow],
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

