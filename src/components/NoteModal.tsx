import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Input } from './Input';
import { Button } from './Button';

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent?: string;
  title?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  visible,
  onClose,
  onSave,
  initialContent = '',
  title = 'Add Note',
}) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (visible) {
      setContent(initialContent);
    }
  }, [visible, initialContent]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      setContent('');
      onClose();
    }
  };

  const handleCancel = () => {
    setContent('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <Input
                value={content}
                onChangeText={setContent}
                placeholder="Write your note..."
                multiline
                numberOfLines={6}
                autoCapitalize="sentences"
                style={styles.input}
              />

              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  color={colors.textMuted}
                  style={styles.button}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  disabled={!content.trim()}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headerSmall,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textMuted,
  },
  input: {
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});

