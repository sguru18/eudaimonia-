import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { SafeAreaView } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "../../theme";

const NOTES_KEY = "@garden/notes_content";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const EMOJI_OPTIONS = [
  // Celebrations & Fun
  "🎉",
  "🎊",
  "🥳",
  "🎈",
  "🎁",
  "🪅",
  // Hearts & Love
  "❤️",
  "💕",
  "💖",
  "💗",
  "💜",
  "🧡",
  // Stars & Sparkles
  "⭐",
  "🌟",
  "✨",
  "💫",
  "🌠",
  "⚡",
  // Nature
  "🌸",
  "🌺",
  "🌻",
  "🌷",
  "🌹",
  "🍀",
  // Animals
  "🦋",
  "🐝",
  "🐣",
  "🦄",
  "🐱",
  "🐶",
  // Weather & Sky
  "🌈",
  "☀️",
  "🌙",
  "❄️",
  "🔥",
  // Food & Treats
  "🍕",
  "🍩",
  "🍰",
  "🧁",
  "🍭",
  "🎂",
  // Misc Fun
  "🚀",
  "💎",
  "👑",
  "🏆",
  "🎯",
  "💯",
  "😭",
];

interface FallingEmoji {
  id: number;
  emoji: string;
  animatedValue: Animated.Value;
  startX: number;
  rotation: Animated.Value;
  rotationDirection: number; // 1 or -1
}

export const NotesScreen = () => {
  const richText = useRef<RichEditor>(null);
  const [content, setContent] = useState("");
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("🎉");
  const [fallingEmojis, setFallingEmojis] = useState<FallingEmoji[]>([]);
  const emojiIdRef = useRef(0);

  // Load saved notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem(NOTES_KEY);
      if (savedNotes) {
        setContent(savedNotes);
        richText.current?.setContentHTML(savedNotes);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const handleContentChange = async (html: string) => {
    setContent(html);
    // Auto-save after a short delay
    try {
      await AsyncStorage.setItem(NOTES_KEY, html);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  const spawnEmoji = useCallback(() => {
    const id = emojiIdRef.current++;
    const startX = Math.random() * (SCREEN_WIDTH - 50);
    const animatedValue = new Animated.Value(0);
    const rotation = new Animated.Value(0);
    const rotationDirection = Math.random() > 0.5 ? 1 : -1;

    const newEmoji: FallingEmoji = {
      id,
      emoji: selectedEmoji,
      animatedValue,
      startX,
      rotation,
      rotationDirection,
    };

    setFallingEmojis((prev) => [...prev, newEmoji]);

    // Animate falling and rotation
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000 + Math.random() * 1000,
        easing: Easing.quad,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000 + Math.random() * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove emoji after animation completes
      setFallingEmojis((prev) => prev.filter((e) => e.id !== id));
    });
  }, [selectedEmoji]);

  const handleEmojiButtonPress = () => {
    if (showEmojiMenu) {
      spawnEmoji();
    } else {
      spawnEmoji();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiMenu(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scroll}
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.scrollContent}
        >
          <RichEditor
            ref={richText}
            onChange={handleContentChange}
            placeholder="Start writing..."
            initialContentHTML={content}
            editorStyle={{
              backgroundColor: colors.background,
              color: colors.text,
              placeholderColor: colors.textMuted,
              contentCSSText: `
                font-family: -apple-system, system-ui;
                font-size: 17px;
                line-height: 1.6;
                color: ${colors.text};
                padding: 20px;
                padding-top: 20px;
              `,
            }}
            style={styles.editor}
          />
        </ScrollView>

        <RichToolbar
          editor={richText}
          actions={[
            actions.undo,
            actions.redo,
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.heading1,
            actions.heading2,
            actions.insertBulletsList,
            actions.setStrikethrough,
            "insertCheck",
            "dismissKeyboard",
          ]}
          iconMap={{
            [actions.heading1]: () => (
              <Text style={styles.toolbarText}>H1</Text>
            ),
            [actions.heading2]: () => (
              <Text style={styles.toolbarText}>H2</Text>
            ),
            insertCheck: () => <Text style={styles.toolbarEmoji}>✅</Text>,
            dismissKeyboard: () => <Text style={styles.toolbarText}>⌨️↓</Text>,
          }}
          onPressAddImage={() => {}}
          insertCheck={() => {
            richText.current?.insertText("✅ ");
          }}
          dismissKeyboard={() => {
            Keyboard.dismiss();
            richText.current?.blurContentEditor();
          }}
          style={styles.toolbar}
          selectedIconTint={colors.teal}
          iconTint={colors.textLight}
          disabledIconTint={colors.textMuted}
        />
      </KeyboardAvoidingView>

      {/* Falling Emojis Layer */}
      <View style={styles.emojiLayer} pointerEvents="none">
        {fallingEmojis.map((item) => {
          const translateY = item.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-60, SCREEN_HEIGHT + 60],
          });
          const rotate = item.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", `${360 * item.rotationDirection}deg`],
          });
          const opacity = item.animatedValue.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0],
          });

          return (
            <Animated.Text
              key={item.id}
              style={[
                styles.fallingEmoji,
                {
                  left: item.startX,
                  transform: [{ translateY }, { rotate }],
                  opacity,
                },
              ]}
            >
              {item.emoji}
            </Animated.Text>
          );
        })}
      </View>

      {/* Emoji Selector Dropdown */}
      {showEmojiMenu && (
        <View style={styles.emojiMenu}>
          <ScrollView
            style={styles.emojiMenuScroll}
            contentContainerStyle={styles.emojiMenuContent}
            showsVerticalScrollIndicator={true}
          >
            {EMOJI_OPTIONS.map((emoji, index) => (
              <TouchableOpacity
                key={`${emoji}-${index}`}
                style={[
                  styles.emojiOption,
                  emoji === selectedEmoji && styles.emojiOptionSelected,
                ]}
                onPress={() => handleSelectEmoji(emoji)}
              >
                <Text style={styles.emojiOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Emoji Button (Bottom Right) */}
      <View style={styles.emojiButtonContainer}>
        <TouchableOpacity
          style={styles.emojiMenuToggle}
          onPress={() => setShowEmojiMenu(!showEmojiMenu)}
        >
          <Text style={styles.emojiMenuToggleText}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={handleEmojiButtonPress}
          activeOpacity={0.7}
        >
          <Text style={styles.emojiButtonText}>{selectedEmoji}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  editor: {
    flex: 1,
    minHeight: "100%",
  },
  toolbar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  toolbarText: {
    ...typography.bodySmall,
    color: colors.textLight,
    fontWeight: "600",
  },
  toolbarEmoji: {
    fontSize: 18,
  },
  // Emoji Button Styles
  emojiButtonContainer: {
    position: "absolute",
    bottom: 80, // Above the toolbar
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  emojiMenuToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiMenuToggleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiButtonText: {
    fontSize: 28,
  },
  // Emoji Menu Styles
  emojiMenu: {
    position: "absolute",
    bottom: 145, // Above the emoji button
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    width: 220,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiMenuScroll: {
    flex: 1,
  },
  emojiMenuContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.sm,
    justifyContent: "flex-start",
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
  emojiOptionSelected: {
    backgroundColor: colors.teal + "20",
  },
  emojiOptionText: {
    fontSize: 24,
  },
  // Falling Emoji Styles
  emojiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  fallingEmoji: {
    position: "absolute",
    fontSize: 40,
    top: 0,
  },
});
