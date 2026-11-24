import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Play, Clock, Zap } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAppStore } from '../../src/store/useAppStore';
import * as subtasksRepo from '../../src/db/subtasksRepo';
import * as topicsRepo from '../../src/db/topicsRepo';
import type { Subtask, Topic } from '../../src/types/models';
import { Badge, getStatusBadgeVariant, getStatusLabel } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { SubtaskList } from '../../src/components/SubtaskList';

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { cycleTopicStatus, cycleTopicDifficulty } = useAppStore();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchTopicData = async () => {
    if (!id) return;
    const t = await topicsRepo.getTopicById(db, id);
    if (t) {
      setTopic(t);
      setNotes(t.notes ?? '');
      const subs = await subtasksRepo.getSubtasksByTopicId(db, id);
      setSubtasks(subs);
    }
  };

  useEffect(() => {
    fetchTopicData();
  }, [id, db]);

  if (!topic) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Tema no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCycleStatus = async () => {
    await cycleTopicStatus(db, topic.id, topic.subject_id);
    await fetchTopicData();
  };

  const handleCycleDifficulty = async () => {
    await cycleTopicDifficulty(db, topic.id, topic.subject_id);
    await fetchTopicData();
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await topicsRepo.updateTopic(db, topic.id, { notes: notes.trim() });
    setIsSavingNotes(false);
  };

  // Subtasks actions
  const handleAddSubtask = async (title: string) => {
    const created = await subtasksRepo.createSubtask(db, {
      topic_id: topic.id,
      title,
    });
    setSubtasks((prev) => [...prev, created]);
  };

  const handleToggleSubtask = async (subtaskId: string, current: number) => {
    const nextVal = await subtasksRepo.toggleSubtask(db, subtaskId, current);
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, is_completed: nextVal } : s))
    );
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await subtasksRepo.deleteSubtask(db, subtaskId);
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const handleStartTimer = (minutes: number) => {
    router.push(
      `/focus-timer?topicId=${topic.id}&subjectId=${topic.subject_id}&durationMinutes=${minutes}` as any
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a la materia"
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Detalle del tema
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título y metadatos */}
        <Text style={styles.title}>{topic.title}</Text>

        <View style={styles.controlsRow}>
          {/* Badge interactivo de estado */}
          <Pressable onPress={handleCycleStatus}>
            <Badge
              label={getStatusLabel(topic.status)}
              variant={getStatusBadgeVariant(topic.status)}
              style={styles.interactiveBadge}
            />
          </Pressable>

          {/* Dificultad interactiva */}
          <Pressable
            style={styles.difficultyBtn}
            onPress={handleCycleDifficulty}
            accessibilityRole="button"
            accessibilityLabel={`Dificultad nivel ${topic.difficulty}`}
          >
            <Zap size={14} color={theme.colors.status.studied} />
            <Text style={styles.difficultyText}>Dificultad: {topic.difficulty}/3</Text>
          </Pressable>

          {/* Tiempo estudiado */}
          <View style={styles.timeBadge}>
            <Clock size={14} color={theme.colors.text.muted} />
            <Text style={styles.timeText}>
              {Math.round(topic.time_spent_seconds / 60)} min
            </Text>
          </View>
        </View>

        {/* Botón principal de estudio */}
        <Button
          title="Estudiar este tema (25 min)"
          onPress={() => handleStartTimer(25)}
          icon={<Play size={20} color={theme.colors.text.primary} fill={theme.colors.text.primary} />}
          style={styles.studyBtn}
        />

        {/* US-3.3: Micro-pasos interactivos */}
        <SubtaskList
          subtasks={subtasks}
          onAdd={handleAddSubtask}
          onToggle={handleToggleSubtask}
          onDelete={handleDeleteSubtask}
        />

        {/* US-3.3: Notas y enlaces */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionHeader}>Notas y enlaces del tema</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            placeholder="Anotá fórmulas clave, dudas o links a tu Drive/apuntes..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {isSavingNotes && (
            <Text style={styles.savingText}>Guardando notas...</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.base,
  },
  title: {
    fontSize: theme.typography.sizes.title,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  interactiveBadge: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  difficultyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background.card,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  difficultyText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  studyBtn: {
    marginBottom: theme.spacing.xl,
  },
  notesSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  notesInput: {
    minHeight: 120,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
  },
  savingText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
    textAlign: 'right',
  },
});
