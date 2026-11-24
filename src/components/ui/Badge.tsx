import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme/tokens';
import type { TopicStatus } from '../../types/models';

export type BadgeVariant =
  | 'not_started'
  | 'studied'
  | 'reviewed'
  | 'completed'
  | 'exam_passed'
  | 'urgent'
  | 'steady'
  | 'margin';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'not_started', color, style }: BadgeProps) {
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    if (color) {
      return {
        bg: `${color}26`, // 15% opacity
        text: color,
        border: `${color}4D`,
      };
    }

    switch (variant) {
      case 'studied':
        return {
          bg: `${theme.colors.status.studied}26`,
          text: theme.colors.status.studied,
          border: `${theme.colors.status.studied}4D`,
        };
      case 'reviewed':
      case 'completed':
      case 'margin':
        return {
          bg: `${theme.colors.status.reviewed}26`,
          text: theme.colors.status.reviewed,
          border: `${theme.colors.status.reviewed}4D`,
        };
      case 'urgent':
        return {
          bg: `${theme.colors.status.todayUrgent}26`,
          text: theme.colors.status.todayUrgent,
          border: `${theme.colors.status.todayUrgent}4D`,
        };
      case 'steady':
        return {
          bg: `${theme.colors.brand.primary}26`,
          text: theme.colors.brand.primary,
          border: `${theme.colors.brand.primary}4D`,
        };
      case 'exam_passed':
        return {
          bg: `${theme.colors.status.examPassed}26`,
          text: theme.colors.text.muted,
          border: `${theme.colors.status.examPassed}4D`,
        };
      case 'not_started':
      default:
        return {
          bg: `${theme.colors.status.notStarted}26`,
          text: theme.colors.text.muted,
          border: `${theme.colors.status.notStarted}4D`,
        };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: badgeColors.text }]}>{label}</Text>
    </View>
  );
}

export function getStatusBadgeVariant(status: TopicStatus): BadgeVariant {
  switch (status) {
    case 'STUDIED':
      return 'studied';
    case 'REVIEWED':
      return 'reviewed';
    case 'NOT_STARTED':
    default:
      return 'not_started';
  }
}

export function getStatusLabel(status: TopicStatus): string {
  switch (status) {
    case 'STUDIED':
      return 'Estudiado';
    case 'REVIEWED':
      return 'Repasado';
    case 'NOT_STARTED':
    default:
      return 'No visto';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
  },
});
