import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, RotateCw, Sparkles, Zap } from 'lucide-react-native';
import { theme } from '../theme/tokens';
import type { RecommendationCandidate } from '../types/models';
import { Button } from './ui/Button';

interface SuggestionCardProps {
  candidate: RecommendationCandidate;
  onStart: (durationMinutes: number) => void;
  onNext: () => void;
}

export function SuggestionCard({ candidate, onStart, onNext }: SuggestionCardProps) {
  const { subject, topic, reason } = candidate;

  const getReasonLabel = () => {
    switch (reason) {
      case 'FINAL_REVIEW':
        return 'Repaso final sugerido';
      case 'LOW_FRICTION_START':
        return 'Arranque con baja fricción';
      case 'STANDARD_STUDY':
      default:
        return 'Próximo paso recomendado';
    }
  };

  return (
    <View style={styles.card}>
      {/* Etiqueta superior */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Sparkles size={14} color={theme.colors.brand.primary} />
          <Text style={styles.badgeText}>{getReasonLabel()}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cycleBtn, pressed && styles.cycleBtnPressed]}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Ver otra sugerencia"
        >
          <RotateCw size={14} color={theme.colors.text.secondary} />
          <Text style={styles.cycleText}>Otra</Text>
        </Pressable>
      </View>

      {/* Info de la materia y tema */}
      <Text style={styles.subjectName}>{subject.name}</Text>
      <Text style={styles.topicTitle} numberOfLines={2}>
        {topic.title}
      </Text>

      {/* Botón principal de Empezar */}
      <Button
        title="Empezar sesión (25 min)"
        onPress={() => onStart(25)}
        icon={<Play size={20} color={theme.colors.text.primary} fill={theme.colors.text.primary} />}
        style={styles.startBtn}
      />

      {/* P-005: Micro-bloque anti-procrastinación de 5 minutos */}
      <Pressable
        style={({ pressed }) => [styles.fiveMinLink, pressed && styles.fiveMinLinkPressed]}
        onPress={() => onStart(5)}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión corta de 5 minutos"
      >
        <Zap size={14} color={theme.colors.status.studied} />
        <Text style={styles.fiveMinText}>
          ¿Cuesta arrancar hoy? Probá solo 5 minutos
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C222D',
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.brand.primary}1A`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.brand.primaryLight,
  },
  cycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.xs,
  },
  cycleBtnPressed: {
    opacity: 0.6,
  },
  cycleText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  subjectName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  topicTitle: {
    fontSize: theme.typography.sizes.title,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  startBtn: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  fiveMinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.xs,
    minHeight: 36,
  },
  fiveMinLinkPressed: {
    opacity: 0.7,
  },
  fiveMinText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.status.studied,
    fontWeight: theme.typography.weights.medium,
  },
});
