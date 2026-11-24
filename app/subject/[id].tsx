import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Plus, FileText, Trash2, Calendar } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAppStore } from '../../src/store/useAppStore';
import { formatDisplayDate, getRelativeExamLabel } from '../../src/utils/dateHelpers';
import { TopicItem } from '../../src/components/TopicItem';
import { Badge } from '../../src/components/ui/Badge';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Snackbar } from '../../src/components/ui/Snackbar';
import type { Topic } from '../../src/types/models';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();

  const {
    subjects,
    topicsBySubject,
    loadTopics,
    createTopic,
    cycleTopicStatus,
    cycleTopicDifficulty,
    deleteTopic,
    deleteSubject,
  } = useAppStore();

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // US-2.3: Deshacer eliminación de tema (snackbar de 8 segundos)
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [deletedTopicBackup, setDeletedTopicBackup] = useState<Topic | null>(null);

  const subject = subjects.find((s) => s.id === id);
  const topics = id ? topicsBySubject[id] ?? [] : [];

  useEffect(() => {
    if (id) {
      loadTopics(db, id);
    }
  }, [id, db]);

  if (!subject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Materia no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  // US-1.4: Input rápido de temas
  const handleAddTopic = async () => {
    if (!newTopicTitle.trim() || isAdding || !id) return;
    try {
      setIsAdding(true);
      await createTopic(db, {
        subject_id: id,
        title: newTopicTitle.trim(),
        difficulty: 1,
      });
      setNewTopicTitle('');
    } finally {
      setIsAdding(false);
    }
  };

  // US-2.3: Eliminar tema con opción de deshacer en 8 segundos
  const handleTopicLongPress = (topic: Topic) => {
    Alert.alert(
      'Eliminar tema',
      `¿Deseás eliminar "${topic.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletedTopicBackup(topic);
            await deleteTopic(db, topic.id, subject.id);
            setSnackbarVisible(true);
          },
        },
      ]
    );
  };

  const handleUndoTopicDelete = async () => {
    if (!deletedTopicBackup) return;
    await createTopic(db, {
      subject_id: deletedTopicBackup.subject_id,
      title: deletedTopicBackup.title,
      difficulty: deletedTopicBackup.difficulty,
    });
    setDeletedTopicBackup(null);
  };

  const handleDeleteSubject = () => {
    Alert.alert(
      'Eliminar materia',
      `¿Seguro que querés eliminar ${subject.name}? Se borrarán también sus temas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteSubject(db, subject.id);
            router.back();
          },
        },
      ]
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
          accessibilityLabel="Volver al inicio"
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.topBarActions}>
          <Pressable
            style={styles.actionIconBtn}
            onPress={() => router.push(`/subject/import?subjectId=${subject.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel="Importar programa masivo"
          >
            <FileText size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable
            style={styles.actionIconBtn}
            onPress={handleDeleteSubject}
            accessibilityRole="button"
            accessibilityLabel="Eliminar materia"
          >
            <Trash2 size={20} color={theme.colors.difficulty.hard} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabecera de materia */}
        <View style={styles.subjectHeader}>
          <View
            style={[
              styles.colorBar,
              { backgroundColor: subject.color_hex || theme.colors.brand.primary },
            ]}
          />
          <Text style={styles.subjectTitle}>{subject.name}</Text>
          <View style={styles.dateMeta}>
            <Calendar size={16} color={theme.colors.text.muted} />
            <Text style={styles.dateText}>
              {formatDisplayDate(subject.exam_date)}
            </Text>
            <Badge label={getRelativeExamLabel(subject.exam_date)} />
          </View>

          {/* US-2.1: Barra de progreso segmentada */}
          {topics.length > 0 && (
            <View style={styles.progressBox}>
              <ProgressBar topics={topics} />
            </View>
          )}
        </View>

        {/* US-1.4: Input rápido para agregar tema */}
        <View style={styles.quickAddCard}>
          <TextInput
            style={styles.quickInput}
            value={newTopicTitle}
            onChangeText={setNewTopicTitle}
            placeholder="Nuevo tema (ej: Unidad 4: Integrales)"
            placeholderTextColor={theme.colors.text.muted}
            onSubmitEditing={handleAddTopic}
            returnKeyType="done"
          />
          <Pressable
            style={[
              styles.quickAddBtn,
              !newTopicTitle.trim() && styles.quickAddBtnDisabled,
            ]}
            onPress={handleAddTopic}
            disabled={!newTopicTitle.trim() || isAdding}
            accessibilityRole="button"
            accessibilityLabel="Agregar tema"
          >
            <Plus size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        {/* Lista de temas */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionHeader}>
            Temas ({topics.length})
          </Text>

          {topics.length === 0 ? (
            <View style={styles.emptyTopics}>
              <Text style={styles.emptyTopicsText}>
                No hay temas cargados todavía. Agregá el primero arriba o importá el
                programa completo con el botón superior.
              </Text>
            </View>
          ) : (
            topics.map((topic) => (
              <Pressable
                key={topic.id}
                onLongPress={() => handleTopicLongPress(topic)}
              >
                <TopicItem
                  topic={topic}
                  onPress={() => router.push(`/topic/${topic.id}` as any)}
                  onCycleStatus={async () => {
                    await cycleTopicStatus(db, topic.id, subject.id);
                  }}
                  onCycleDifficulty={async () => {
                    await cycleTopicDifficulty(db, topic.id, subject.id);
                  }}
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* US-2.3: Snackbar de 8 segundos para deshacer eliminación */}
      <Snackbar
        visible={snackbarVisible}
        message={`Se eliminó "${deletedTopicBackup?.title ?? 'el tema'}"`}
        onUndo={handleUndoTopicDelete}
        onDismiss={() => setSnackbarVisible(false)}
        durationMs={8000}
      />
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
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionIconBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
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
  subjectHeader: {
    marginBottom: theme.spacing.lg,
  },
  colorBar: {
    width: 32,
    height: 4,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
  },
  subjectTitle: {
    fontSize: theme.typography.sizes.title,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  progressBox: {
    marginTop: theme.spacing.md,
  },
  quickAddCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing.md,
    paddingRight: 4,
    minHeight: theme.accessibility.minTouchTarget,
    marginBottom: theme.spacing.xl,
  },
  quickInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    paddingVertical: theme.spacing.sm,
  },
  quickAddBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddBtnDisabled: {
    opacity: 0.4,
  },
  topicsSection: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyTopics: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTopicsText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
