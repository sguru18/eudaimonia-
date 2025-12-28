import { Platform } from 'react-native';

/**
 * Eudaimonia App Typography
 * Allura for cursive headers, System fonts for body text (Vend Sans-like)
 */

export const fonts = {
  // Cursive font for headers and special text
  cursive: Platform.select({
    ios: 'Noteworthy-Bold', // iOS cursive fallback (or 'Bradley Hand')
    android: 'cursive',
    default: 'cursive',
  }),
  
  // Clean sans-serif for body text (system font)
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Medium weight for buttons and emphasis
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  
  // Bold for strong emphasis
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  huge: 40,
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

// Typography presets for common use cases
export const typography = {
  // Headers (cursive)
  headerLarge: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.xxxl,
    lineHeight: fontSizes.xxxl * lineHeights.tight,
  },
  headerMedium: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * lineHeights.tight,
  },
  headerSmall: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  
  // Body text (sans-serif)
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  // Buttons and UI elements
  button: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  buttonSmall: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  
  // Captions and labels
  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
} as const;

