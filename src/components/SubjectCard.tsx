import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Archive } from 'lucide-react-native';
import { theme } from '../theme/tokens';
import type { Subject, Topic } from '../types/models';
import {
  formatDisplayDate,
  getRelativeExamLabel,
  isExamPassed,
} from '../utils/dateHelpers';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';

interface SubjectCardProps {
  subject: Subject;
  topics?: Topic[];
  onPress: () => void;
  onArchive?: () => void;
  completed?: boolean;
}

export function SubjectCard({
  subject,
  topics,
  onPress,
  onArchive,
  completed = false,
}: SubjectCardProps) {
  const passed = isExamPassed(subject.exam_date);
  const relativeLabel = getRelativeExamLabel(subject.exam_date);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Materia ${subject.name}, examen el ${formatDisplayDate(subject.exam_date)}`}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: subject.color_hex || theme.colors.brand.primary },
              ]}
            />
            <Text style={styles.name} numberOfLines={2}>
              {subject.name}
            </Text>
          </View>
          <ChevronRight size={20} color={theme.colors.text.muted} />
        </View>

        {/* US-2.1: Barra de progreso segmentada ponderada */}
        {topics && topics.length > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar topics={topics} showLabel={false} />
          </View>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>
            {formatDisplayDate(subject.exam_date)}
          </Text>

          <View style={styles.badgeRow}>
            {completed ? (
              <Badge label="Completada" variant="completed" />
            ) : passed ? (
              <Badge label="Examen pasado" variant="exam_passed" />
            ) : (
              <Badge
                label={relativeLabel}
                variant={
                  relativeLabel === 'Rinde hoy'
                    ? 'urgent'
                    : relativeLabel === 'Rinde mañana'
                    ? 'steady'
                    : 'not_started'
                }
              />
            )}

            {passed && onArchive && (
              <Pressable
                style={({ pressed }) => [
                  styles.archiveBtn,
                  pressed && styles.archiveBtnPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
                accessibilityRole="button"
                accessibilityLabel="Archivar materia vencida"
              >
                <Archive size={16} color={theme.colors.text.secondary} />
                <Text style={styles.archiveText}>Archivar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    minHeight: 76,
  },
  cardPressed: {
    backgroundColor: theme.colors.background.cardHighlight,
    borderColor: theme.colors.brand.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  progressContainer: {
    marginVertical: theme.spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.background.cardHighlight,
    minHeight: 32,
  },
  archiveBtnPressed: {
    opacity: 0.7,
  },
  archiveText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
});
