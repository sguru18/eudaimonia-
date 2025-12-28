/**
 * Eudaimonia App Color Palette
 * Based on the Wellness Color Palette
 */

export const colors = {
  // Background & Neutrals
  background: '#FAFAF7', // Warm off-white
  beige: '#E8DCC8', // Light beige
  black: '#2B2B2B', // Soft black
  
  // Module Accent Colors
  food: '#8FA87D', // Sage green (Food module)
  finances: '#E1C16E', // Sand/gold (Finances module) - using approximation
  habits: '#9EC6C6', // Mint/aqua (Habits module)
  writing: '#D4B6A1', // Parchment/tan (Writing module) - using approximation
  
  // Additional Palette Colors
  teal: '#5A7F7A', // Dark teal (primary accent/links)
  mint: '#9EC6C6', // Mint
  lavender: '#E5E0E8', // Soft lavender
  sage: '#8FA87D', // Sage
  purple: '#8B7B9E', // Soft purple (for recurring events)
  
  // UI States
  active: '#5A7F7A', // Teal for active states
  success: '#8FA87D', // Sage for success
  warning: '#E1C16E', // Sand for warnings
  error: '#D4A5A5', // Soft red (derived)
  
  // Text
  text: '#2B2B2B', // Primary text
  textLight: '#6B6B6B', // Secondary text
  textMuted: '#9B9B9B', // Muted text
  
  // Overlays & Borders
  overlay: 'rgba(43, 43, 43, 0.5)',
  border: '#E0DDD9',
  divider: '#F0EDE8',
  
  // White & Transparent
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;

