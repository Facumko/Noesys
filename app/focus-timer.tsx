import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import {
  X,
  Play,
  Pause,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
} from 'lucide-react-native';
import { theme } from '../src/theme/tokens';
import { useTimerStore } from '../src/store/useTimerStore';
import * as topicsRepo from '../src/db/topicsRepo';
import * as subjectsRepo from '../src/db/subjectsRepo';
import * as sessionsRepo from '../src/db/sessionsRepo';
import {
  scheduleTimerEndNotification,
  cancelNotificationById,
} from '../src/utils/notifications';
import { Button } from '../src/components/ui/Button';

export default function FocusTimerScreen() {
  const { topicId, subjectId, durationMinutes } = useLocalSearchParams<{
    topicId?: string;
    subjectId?: string;
    durationMinutes?: string;
  }>();

  const router = useRouter();
  const db = useSQLiteContext();
  const timer = useTimerStore();

  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [topicTitle, setTopicTitle] = useState('Sesión de estudio');
  const [subjectName, setSubjectName] = useState('Finales');
  const [isCompleted, setIsCompleted] = useState(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : 25;
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar metadatos e iniciar temporizador
  useEffect(() => {
    const initTimer = async () => {
      let tName = 'Sesión general';
      let sName = 'Materia';

      if (subjectId) {
        const sub = await subjectsRepo.getSubjectById(db, subjectId);
        if (sub) sName = sub.name;
      }

      if (topicId) {
        const top = await topicsRepo.getTopicById(db, topicId);
        if (top) tName = top.title;
      }

      setTopicTitle(tName);
      setSubjectName(sName);

      timer.startTimer({
        subjectId: subjectId ?? '',
        topicId: topicId ?? null,
        subjectName: sName,
        topicTitle: tName,
        durationMinutes: parsedDuration,
      });

      // Programar notificación de fin de bloque (garantiza que suene en segundo plano)
      try {
        const notifId = await scheduleTimerEndNotification(
          parsedDuration * 60,
          tName
        );
        setNotificationId(notifId);
      } catch {
        // noop en web o si no hay permisos
      }
    };

    initTimer();

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  // Tick interval para actualizar la interfaz a partir de la diferencia de timestamp
  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      if (timer.isRunning && !timer.isPaused && !isCompleted) {
        const elapsed = timer.getElapsedSeconds();
        const remaining = Math.max(0, timer.targetSeconds - elapsed);
        setDisplaySeconds(remaining);

        if (remaining <= 0) {
          handleCompletion();
        }
      }
    }, 500);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [timer.isRunning, timer.isPaused, timer.targetSeconds, isCompleted]);

  // Al completar la sesión
  const handleCompletion = async () => {
    setIsCompleted(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }

    const { elapsedSeconds, startedAtIso } = timer.stopTimer();

    if (subjectId) {
      await sessionsRepo.recordStudySession(db, {
        subject_id: subjectId,
        topic_id: topicId ?? null,
        duration_seconds: elapsedSeconds,
        started_at: startedAtIso,
      });
    }
  };

  // P-002: Salida con guardado de tiempo parcial si estudió >= 120s
  const handleExit = () => {
    const elapsed = timer.getElapsedSeconds();

    if (notificationId) {
      cancelNotificationById(notificationId);
    }

    if (elapsed >= 120 && !isCompleted) {
      Alert.alert(
        'Guardar tiempo de foco',
        `Llevás ${Math.round(elapsed / 60)} min estudiados. ¿Deseás guardar esta sesión parcial?`,
        [
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              timer.stopTimer();
              router.back();
            },
          },
          {
            text: 'Guardar minutos',
            onPress: async () => {
              const { elapsedSeconds, startedAtIso } = timer.stopTimer();
              if (subjectId) {
                await sessionsRepo.recordStudySession(db, {
                  subject_id: subjectId,
                  topic_id: topicId ?? null,
                  duration_seconds: elapsedSeconds,
                  started_at: startedAtIso,
                });
              }
              router.back();
            },
          },
        ]
      );
    } else {
      timer.stopTimer();
      router.back();
    }
  };

  const handlePauseResume = () => {
    if (timer.isPaused) {
      timer.resumeTimer();
    } else {
      timer.pauseTimer();
    }
  };

  const handleAddFiveMinutes = () => {
    setIsCompleted(false);
    timer.extendTimer(5);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressRatio =
    timer.targetSeconds > 0
      ? Math.min(1, (timer.targetSeconds - displaySeconds) / timer.targetSeconds)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.closeBtn}
          onPress={handleExit}
          accessibilityRole="button"
          accessibilityLabel="Cerrar temporizador"
        >
          <X size={24} color={theme.colors.text.primary} />
        </Pressable>

        <Pressable
          style={styles.toggleNumbersBtn}
          onPress={timer.toggleShowNumbers}
          accessibilityRole="button"
          accessibilityLabel={timer.showNumbers ? 'Ocultar reloj' : 'Mostrar reloj'}
        >
          {timer.showNumbers ? (
            <EyeOff size={20} color={theme.colors.text.secondary} />
          ) : (
            <Eye size={20} color={theme.colors.text.secondary} />
          )}
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Materia y tema */}
        <Text style={styles.subjectText}>{subjectName}</Text>
        <Text style={styles.topicText} numberOfLines={2}>
          {topicTitle}
        </Text>

        {/* Anillo de progreso central */}
        <View style={styles.timerCircleWrapper}>
          <View
            style={[
              styles.timerRing,
              {
                borderColor: isCompleted
                  ? theme.colors.status.reviewed
                  : theme.colors.brand.primary,
              },
            ]}
          >
            {isCompleted ? (
              <View style={styles.completedBox}>
                <Sparkles size={40} color={theme.colors.status.reviewed} />
                <Text style={styles.completedTitle}>¡Bloque cumplido!</Text>
                <Text style={styles.completedSubtitle}>
                  Excelente momento de foco.
                </Text>
              </View>
            ) : timer.showNumbers ? (
              <View style={styles.numbersBox}>
                <Text style={styles.timeNumbers}>{formatTime(displaySeconds)}</Text>
                <Text style={styles.statusHelperText}>
                  {timer.isPaused ? 'En pausa' : 'Tiempo de foco'}
                </Text>
              </View>
            ) : (
              <View style={styles.minimalBox}>
                <View
                  style={[
                    styles.minimalDot,
                    {
                      opacity: timer.isPaused ? 0.3 : 1,
                      transform: [{ scale: 1 + progressRatio * 0.5 }],
                    },
                  ]}
                />
                <Text style={styles.minimalText}>Foco activo</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controles de temporizador */}
        {isCompleted ? (
          <View style={styles.completedActions}>
            <Button
              title="¿Seguimos 5 min más?"
              onPress={handleAddFiveMinutes}
              icon={<Plus size={20} color={theme.colors.text.primary} />}
              style={styles.extendBtn}
            />
            <Button
              title="Cerrar y descansar"
              variant="outline"
              onPress={() => router.back()}
            />
          </View>
        ) : (
          <View style={styles.runningActions}>
            <Button
              title={timer.isPaused ? 'Reanudar' : 'Pausar'}
              variant={timer.isPaused ? 'primary' : 'secondary'}
              onPress={handlePauseResume}
              icon={
                timer.isPaused ? (
                  <Play size={20} color={theme.colors.text.primary} fill={theme.colors.text.primary} />
                ) : (
                  <Pause size={20} color={theme.colors.text.primary} />
                )
              }
              style={styles.pauseBtn}
            />
          </View>
        )}
      </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleNumbersBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  subjectText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  topicText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  timerCircleWrapper: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  timerRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    backgroundColor: theme.colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  numbersBox: {
    alignItems: 'center',
  },
  timeNumbers: {
    fontSize: 48,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  statusHelperText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  minimalBox: {
    alignItems: 'center',
  },
  minimalDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.brand.primary,
    marginBottom: theme.spacing.sm,
  },
  minimalText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  completedBox: {
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  completedSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  runningActions: {
    width: '100%',
    maxWidth: 280,
  },
  pauseBtn: {
    width: '100%',
  },
  completedActions: {
    width: '100%',
    maxWidth: 280,
    gap: theme.spacing.md,
  },
  extendBtn: {
    width: '100%',
  },
});
