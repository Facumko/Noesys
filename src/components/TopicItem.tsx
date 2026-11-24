import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Circle, Clock, Zap } from 'lucide-react-native';
import { theme } from '../theme/tokens';
import type { Topic } from '../types/models';
import { Badge, getStatusBadgeVariant, getStatusLabel } from './ui/Badge';

interface TopicItemProps {
  topic: Topic;
  onPress: () => void;
  onCycleStatus: () => void | Promise<void>;
  onCycleDifficulty: () => void | Promise<void>;
}

export function TopicItem({
  topic,
  onPress,
  onCycleStatus,
  onCycleDifficulty,
}: TopicItemProps) {
  const handleStatusPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics no soportado en web
    }
    await onCycleStatus();
  };

  const handleDifficultyPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics no soportado en web
    }
    await onCycleDifficulty();
  };

  const renderStatusIcon = () => {
    if (topic.status === 'REVIEWED') {
      return <CheckCircle2 size={24} color={theme.colors.status.reviewed} />;
    }
    if (topic.status === 'STUDIED') {
      return <Clock size={24} color={theme.colors.status.studied} />;
    }
    return <Circle size={24} color={theme.colors.status.notStarted} />;
  };

  const renderDifficultyLightning = () => {
    const color =
      topic.difficulty === 1
        ? theme.colors.difficulty.easy
        : topic.difficulty === 2
        ? theme.colors.difficulty.medium
        : theme.colors.difficulty.hard;

    return (
      <View style={styles.difficultyContainer}>
        {Array.from({ length: topic.difficulty }).map((_, i) => (
          <Zap key={i} size={14} color={color} fill={color} />
        ))}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tema ${topic.title}, estado ${getStatusLabel(topic.status)}`}
    >
      {/* Botón de 1 toque para ciclar estado (US-1.5) */}
      <Pressable
        style={styles.statusTouchArea}
        onPress={handleStatusPress}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar estado, actual ${getStatusLabel(topic.status)}`}
      >
        {renderStatusIcon()}
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {topic.title}
        </Text>
        <View style={styles.metaRow}>
          <Badge
            label={getStatusLabel(topic.status)}
            variant={getStatusBadgeVariant(topic.status)}
          />
          {topic.time_spent_seconds > 0 && (
            <Text style={styles.timeText}>
              {Math.round(topic.time_spent_seconds / 60)} min
            </Text>
          )}
        </View>
      </View>

      {/* Botón de 1 toque para ciclar dificultad (US-1.5) */}
      <Pressable
        style={styles.difficultyTouchArea}
        onPress={handleDifficultyPress}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar dificultad, actual nivel ${topic.difficulty}`}
      >
        {renderDifficultyLightning()}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: 64,
  },
  pressed: {
    backgroundColor: theme.colors.background.cardHighlight,
  },
  statusTouchArea: {
    minWidth: theme.accessibility.minTouchTarget,
    minHeight: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  difficultyTouchArea: {
    minWidth: theme.accessibility.minTouchTarget,
    minHeight: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
