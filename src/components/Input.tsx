import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  onNotePress?: () => void;
  hasNote?: boolean;
  autoComplete?: string;
  textContentType?: string;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  showPasswordToggle = false,
  editable = true,
  style,
  inputStyle,
  onNotePress,
  hasNote = false,
  autoComplete,
  textContentType,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const shouldHideText = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={shouldHideText}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete as any}
          textContentType={textContentType as any}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            !editable && styles.inputDisabled,
            (showPasswordToggle || onNotePress) && styles.inputWithButton,
            inputStyle,
          ]}
        />
        
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeButton} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.eyeIcon}>
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
        
        {onNotePress && (
          <TouchableOpacity 
            style={styles.noteButton} 
            onPress={onNotePress}
          >
            <Text style={[styles.noteIcon, hasNote && styles.noteIconActive]}>
              📝
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    // Remove lineHeight to prevent clipping of descenders (y, g, p, etc.)
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2, // Extra padding to ensure descenders aren't clipped
    paddingHorizontal: spacing.base,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md + 2, // Match single-line padding
  },
  inputFocused: {
    borderColor: colors.teal,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.divider,
    opacity: 0.6,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  inputWithButton: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: spacing.xs,
  },
  eyeIcon: {
    fontSize: 20,
  },
  noteButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    padding: spacing.xs,
  },
  noteIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  noteIconActive: {
    opacity: 1,
  },
});

