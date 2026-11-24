import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RotateCcw } from 'lucide-react-native';
import { theme } from '../../theme/tokens';

interface SnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void | Promise<void>;
  onDismiss: () => void;
  durationMs?: number; // 8 segundos por defecto (Decisión #11 / US-2.3)
}

export function Snackbar({
  visible,
  message,
  onUndo,
  onDismiss,
  durationMs = 8000,
}: SnackbarProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, durationMs);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleUndoPress = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    await onUndo();
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
        onPress={handleUndoPress}
        accessibilityRole="button"
        accessibilityLabel="Deshacer eliminación"
      >
        <RotateCcw size={16} color={theme.colors.brand.primary} />
        <Text style={styles.undoText}>DESHACER</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1E232D',
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    marginRight: theme.spacing.md,
  },
  undoBtn: {
    minHeight: theme.accessibility.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  undoBtnPressed: {
    opacity: 0.7,
  },
  undoText: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.sm,
  },
});
