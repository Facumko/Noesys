import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Plus, Sparkles, BookOpen } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAppStore } from '../../src/store/useAppStore';
import { SubjectCard } from '../../src/components/SubjectCard';
import { SuggestionCard } from '../../src/components/SuggestionCard';
import { Button } from '../../src/components/ui/Button';
import { getRecommendation } from '../../src/utils/urgencyEngine';

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const {
    subjects,
    topicsBySubject,
    isLoading,
    loadSubjects,
    loadTopics,
    seedDemo,
    updateSubject,
  } = useAppStore();

  const [excludedTopicIds, setExcludedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    loadSubjects(db);
  }, [db]);

  // Asegura que los temas de cada materia estén en cache para la sugerencia
  useEffect(() => {
    for (const sub of subjects) {
      if (!topicsBySubject[sub.id]) {
        loadTopics(db, sub.id);
      }
    }
  }, [subjects, db]);

  const handleCreateNew = () => {
    router.push('/subject/create');
  };

  const handleSeedDemo = async () => {
    await seedDemo(db);
  };

  const handleArchive = async (id: string) => {
    await updateSubject(db, id, { is_archived: 1 });
  };

  // US-3.2: Motor de sugerencia única
  const recommendation = getRecommendation(
    subjects,
    topicsBySubject,
    2.0,
    excludedTopicIds
  );

  const handleStartSession = (durationMinutes: number) => {
    if (!recommendation) return;
    router.push(
      `/focus-timer?topicId=${recommendation.topic.id}&subjectId=${recommendation.subject.id}&durationMinutes=${durationMinutes}` as any
    );
  };

  const handleNextSuggestion = () => {
    if (recommendation) {
      setExcludedTopicIds((prev) => [...prev, recommendation.topic.id]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hoy</Text>
          <Text style={styles.subtitle}>
            {subjects.length === 0
              ? 'Organizador de estudio sin culpa'
              : `${subjects.length} ${
                  subjects.length === 1 ? 'final en carrera' : 'finales en carrera'
                }`}
          </Text>
        </View>

        {subjects.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={handleCreateNew}
            accessibilityRole="button"
            accessibilityLabel="Agregar nueva materia"
          >
            <Plus size={24} color={theme.colors.text.primary} />
          </Pressable>
        )}
      </View>

      {/* Contenido principal */}
      {isLoading && subjects.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        </View>
      ) : subjects.length === 0 ? (
        /* P-001: Estado vacío con onboarding interactivo en 1 toque */
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.sparkleIcon}>
              <Sparkles size={32} color={theme.colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>Empezá sin fricción</Text>
            <Text style={styles.emptyDescription}>
              No te preocupes por cargar todo ahora. Podés probar cómo funciona la
              app con una materia de prueba en un toque.
            </Text>

            <Button
              title="Cargar materia de prueba (Álgebra)"
              onPress={handleSeedDemo}
              icon={<BookOpen size={20} color={theme.colors.text.primary} />}
              style={styles.demoBtn}
            />

            <Button
              title="Crear materia propia"
              variant="outline"
              onPress={handleCreateNew}
              icon={<Plus size={18} color={theme.colors.text.primary} />}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* US-3.1 y US-3.2: Tarjeta Hoy con sugerencia única y micro-bloque de 5 min */}
          {recommendation && (
            <SuggestionCard
              candidate={recommendation}
              onStart={handleStartSession}
              onNext={handleNextSuggestion}
            />
          )}

          <Text style={styles.sectionTitle}>Tus finales</Text>

          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              topics={topicsBySubject[subject.id]}
              onPress={() => router.push(`/subject/${subject.id}` as any)}
              onArchive={() => handleArchive(subject.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  iconBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.card,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPressed: {
    backgroundColor: theme.colors.background.cardHighlight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: `${theme.colors.brand.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  demoBtn: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
});
