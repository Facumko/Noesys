import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAppStore } from '../../src/store/useAppStore';
import { formatLocalDate } from '../../src/utils/dateHelpers';
import { Button } from '../../src/components/ui/Button';

const COLOR_PALETTE = [
  '#3B82F6', // Azul
  '#10B981', // Esmeralda
  '#F59E0B', // Ámbar
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
  '#06B6D4', // Cian
];

export default function CreateSubjectScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { createSubject } = useAppStore();

  // Fecha por defecto: hoy + 14 días
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);

  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState(formatLocalDate(defaultDate));
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Por favor ingresá el nombre de la materia.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      setErrorMsg('El formato de fecha debe ser YYYY-MM-DD (ej: 2026-12-15).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await createSubject(db, {
        name: name.trim(),
        exam_date: examDate,
        color_hex: selectedColor,
      });
      router.back();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Nueva materia</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre de la materia */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre de la materia</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Ej: Análisis Matemático II"
            placeholderTextColor={theme.colors.text.muted}
            autoFocus
          />
        </View>

        {/* Fecha de examen */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha del examen final (YYYY-MM-DD)</Text>
          <View style={styles.dateInputWrapper}>
            <Calendar size={20} color={theme.colors.text.muted} />
            <TextInput
              style={styles.dateInput}
              value={examDate}
              onChangeText={setExamDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.muted}
              maxLength={10}
            />
          </View>
          <Text style={styles.helperText}>
            Calculamos la urgencia a partir de esta fecha.
          </Text>
        </View>

        {/* Color identificador */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Color identificador</Text>
          <View style={styles.colorRow}>
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c}`}
                />
              );
            })}
          </View>
        </View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Button
          title="Guardar materia"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.saveBtn}
        />
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
    paddingVertical: theme.spacing.md,
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: theme.accessibility.minTouchTarget,
    height: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  topBarTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: theme.accessibility.minTouchTarget,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  dateInputWrapper: {
    minHeight: theme.accessibility.minTouchTarget,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  helperText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: theme.colors.text.primary,
    transform: [{ scale: 1.1 }],
  },
  errorText: {
    color: theme.colors.difficulty.hard,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.md,
  },
  saveBtn: {
    marginTop: theme.spacing.md,
  },
});
