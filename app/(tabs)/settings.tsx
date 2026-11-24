import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Bell,
  Clock,
  BatteryCharging,
  Download,
  Upload,
  Smartphone,
} from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import type { Settings } from '../../src/types/models';
import { exportDatabaseToJson, shareBackup, importDatabaseFromJson } from '../../src/db/backup';
import {
  requestNotificationPermission,
  scheduleDailyStudyReminder,
} from '../../src/utils/notifications';
import { useAppStore } from '../../src/store/useAppStore';
import { Button } from '../../src/components/ui/Button';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { loadSubjects } = useAppStore();

  const [settings, setSettings] = useState<Settings>({
    id: 1,
    daily_reminder_enabled: 1,
    daily_reminder_time: '18:00',
    default_timer_minutes: 25,
    daily_capacity_units: 2.0,
    haptics_enabled: 1,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [db]);

  const loadSettings = async () => {
    const row = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1;');
    if (row) {
      setSettings(row);
    }
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await db.runAsync(`UPDATE settings SET ${key} = ? WHERE id = 1;`, [value]);
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permiso necesario',
          'Para recibir el recordatorio diario, habilitá las notificaciones de la app en la configuración de tu celular.'
        );
        return;
      }
      await updateSetting('daily_reminder_enabled', 1);
      await scheduleDailyStudyReminder(settings.daily_reminder_time, 'Unidad de Álgebra');
    } else {
      await updateSetting('daily_reminder_enabled', 0);
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const json = await exportDatabaseToJson(db);
      await shareBackup(json);
    } catch (err) {
      Alert.alert(
        'Error al exportar',
        err instanceof Error ? err.message : 'No se pudo generar el archivo de backup.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    if (!restoreJsonText.trim()) return;
    try {
      setIsRestoring(true);
      const result = await importDatabaseFromJson(db, restoreJsonText);
      if (result.success) {
        await loadSubjects(db);
        setShowRestoreModal(false);
        setRestoreJsonText('');
        Alert.alert('Éxito', `Copia restaurada correctamente (${result.count} materias).`);
      } else {
        Alert.alert('Error', result.error ?? 'El formato JSON no es válido.');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Sección Recordatorios */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recordatorio diario</Text>
          <View style={styles.settingCard}>
            <View style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <Bell size={20} color={theme.colors.brand.primary} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardLabel}>Notificación diaria</Text>
                <Text style={styles.cardSub}>
                  Un paso concreto sin culpa ("Hoy: Unidad 3, 25 min")
                </Text>
              </View>
              <Switch
                value={settings.daily_reminder_enabled === 1}
                onValueChange={handleReminderToggle}
                trackColor={{ false: theme.colors.border.subtle, true: theme.colors.brand.primary }}
              />
            </View>

            {settings.daily_reminder_enabled === 1 && (
              <View style={styles.timeSelectorRow}>
                <Text style={styles.timeLabel}>Horario del aviso:</Text>
                <View style={styles.timeOptions}>
                  {['09:00', '14:00', '18:00', '21:00'].map((time) => (
                    <Pressable
                      key={time}
                      style={[
                        styles.timeChip,
                        settings.daily_reminder_time === time && styles.timeChipActive,
                      ]}
                      onPress={() => updateSetting('daily_reminder_time', time)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          settings.daily_reminder_time === time && styles.timeChipTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Sección Temporizador */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Temporizador de estudio</Text>
          <View style={styles.settingCard}>
            <View style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <Clock size={20} color={theme.colors.status.studied} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardLabel}>Duración por defecto</Text>
                <Text style={styles.cardSub}>Largo de la sesión principal</Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              {[15, 25, 45, 60].map((mins) => (
                <Pressable
                  key={mins}
                  style={[
                    styles.chip,
                    settings.default_timer_minutes === mins && styles.chipActive,
                  ]}
                  onPress={() => updateSetting('default_timer_minutes', mins)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.default_timer_minutes === mins && styles.chipTextActive,
                    ]}
                  >
                    {mins} min
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Sección Capacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Ritmo y capacidad diaria</Text>
          <View style={styles.settingCard}>
            <View style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <BatteryCharging size={20} color={theme.colors.status.reviewed} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardLabel}>Capacidad diaria de estudio</Text>
                <Text style={styles.cardSub}>
                  Ajusta la exigencia del semáforo de urgencia
                </Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              {[
                { val: 1.0, label: 'Suave (1 u/día)' },
                { val: 2.0, label: 'Estable (2 u/día)' },
                { val: 3.0, label: 'Intenso (3 u/día)' },
              ].map((opt) => (
                <Pressable
                  key={opt.val}
                  style={[
                    styles.chip,
                    settings.daily_capacity_units === opt.val && styles.chipActive,
                  ]}
                  onPress={() => updateSetting('daily_capacity_units', opt.val)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.daily_capacity_units === opt.val && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Sección Respuestas hápticas */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Accesibilidad y feedback</Text>
          <View style={styles.settingCard}>
            <View style={styles.cardRow}>
              <View style={styles.iconWrapper}>
                <Smartphone size={20} color={theme.colors.text.secondary} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardLabel}>Vibraciones hápticas</Text>
                <Text style={styles.cardSub}>Confirmación táctil de acciones</Text>
              </View>
              <Switch
                value={settings.haptics_enabled === 1}
                onValueChange={(val) => updateSetting('haptics_enabled', val ? 1 : 0)}
                trackColor={{ false: theme.colors.border.subtle, true: theme.colors.brand.primary }}
              />
            </View>
          </View>
        </View>

        {/* US-4.3: Copia de seguridad y restauración */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Copias de seguridad (JSON)</Text>
          <View style={styles.settingCard}>
            <Text style={styles.backupDescription}>
              Tus datos se guardan 100% offline en tu dispositivo. Podés exportar un
              archivo JSON para respaldar tus finales o transferirlos a otro celular.
            </Text>

            <Button
              title="Exportar copia de seguridad"
              variant="outline"
              loading={isExporting}
              onPress={handleExportBackup}
              icon={<Download size={18} color={theme.colors.text.primary} />}
              style={styles.backupBtn}
            />

            <Button
              title="Restaurar desde JSON"
              variant="secondary"
              onPress={() => setShowRestoreModal(true)}
              icon={<Upload size={18} color={theme.colors.text.primary} />}
            />
          </View>
        </View>

        {/* Modal de restauración */}
        {showRestoreModal && (
          <View style={styles.restoreModalCard}>
            <Text style={styles.modalTitle}>Restaurar copia de seguridad</Text>
            <Text style={styles.modalSub}>
              Pegá el texto completo de tu archivo de backup JSON abajo.
            </Text>
            <TextInput
              style={styles.restoreInput}
              value={restoreJsonText}
              onChangeText={setRestoreJsonText}
              placeholder="Pegá el JSON acá..."
              placeholderTextColor={theme.colors.text.muted}
              multiline
              numberOfLines={6}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setShowRestoreModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirmar"
                loading={isRestoring}
                disabled={!restoreJsonText.trim()}
                onPress={handleImportBackup}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Finales v1.0 • Offline-first</Text>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.background.cardHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  cardSub: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.cardHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: `${theme.colors.brand.primary}26`,
    borderColor: theme.colors.brand.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  chipTextActive: {
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  timeSelectorRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: 1,
  },
  timeLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.background.cardHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  timeChipActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  timeChipText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  timeChipTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.bold,
  },
  backupDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  backupBtn: {
    marginBottom: theme.spacing.sm,
  },
  restoreModalCard: {
    backgroundColor: theme.colors.background.cardHighlight,
    borderColor: theme.colors.brand.primary,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  restoreInput: {
    minHeight: 100,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.xs,
    marginBottom: theme.spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
});
