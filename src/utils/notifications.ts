import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'finales-study-reminders';

/**
 * Configura el comportamiento de notificaciones y crea el canal de Android.
 * Regla técnica crítica: canal obligatorio en Android 8+.
 */
export async function setupNotificationChannel(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de estudio',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }
}

/**
 * Pide permiso POST_NOTIFICATIONS (Android 13+) de forma contextual.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Reprograma el recordatorio diario con un paso concreto ("Hoy: Unidad 3, 25 min").
 */
export async function scheduleDailyStudyReminder(
  timeHHMM: string,
  concreteStepTitle: string
): Promise<void> {
  const parts = timeHHMM.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  // Cancelar recordatorios previos para evitar duplicados
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Momento de foco',
      body: `Hoy toca: ${concreteStepTitle} (25 min)`,
      data: { screen: 'home' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Programa una notificación local para avisar el fin del temporizador
 * (garantiza que suene incluso si la app pasa a segundo plano).
 */
export async function scheduleTimerEndNotification(
  durationSeconds: number,
  topicTitle: string
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '¡Sesión de estudio terminada!',
      body: `Completaste tu bloque de ${topicTitle}. ¿Seguimos 5 min más?`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, durationSeconds),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelNotificationById(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // noop
  }
}
