import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme/tokens';
import type { Topic } from '../../types/models';
import { calculateWeightedProgress } from '../../utils/urgencyEngine';

export { calculateWeightedProgress };

interface ProgressBarProps {
  topics?: Topic[];
  percentage?: number;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  topics,
  percentage: propPercentage,
  showLabel = true,
  style,
}: ProgressBarProps) {
  let percentage = propPercentage ?? 0;
  let reviewedPercent = percentage;
  let studiedPercent = 0;

  if (topics) {
    const stats = calculateWeightedProgress(topics);
    percentage = stats.percentage;
    reviewedPercent = stats.reviewedPercent;
    studiedPercent = stats.studiedPercent;
  }

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Progreso</Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      )}

      {/* Barra segmentada */}
      <View style={styles.track}>
        {/* Segmento repasado (verde) */}
        {reviewedPercent > 0 && (
          <View
            style={[
              styles.segment,
              {
                width: `${reviewedPercent}%`,
                backgroundColor: theme.colors.status.reviewed,
              },
            ]}
          />
        )}
        {/* Segmento estudiado (ámbar) */}
        {studiedPercent > 0 && (
          <View
            style={[
              styles.segment,
              {
                width: `${studiedPercent}%`,
                backgroundColor: theme.colors.status.studied,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  percentText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  track: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border.subtle,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
});
