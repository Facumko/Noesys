import React, { useState } from 'react';
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
import { ArrowLeft, Trash2, Check, AlertTriangle, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { parseSyllabusText } from '../../src/utils/syllabusParser';
import { createTopicsBatch } from '../../src/db/topicsRepo';
import { useAppStore } from '../../src/store/useAppStore';
import { Button } from '../../src/components/ui/Button';

export default function ImportSyllabusScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { loadTopics } = useAppStore();

  const [rawText, setRawText] = useState('');
  const [parsedLines, setParsedLines] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isParsed, setIsParsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseSyllabusText(rawText);
    setParsedLines(result.topics);
    setWarning(result.warning ?? null);
    setIsParsed(true);
  };

  const handleUpdateLine = (index: number, newText: string) => {
    setParsedLines((prev) => {
      const copy = [...prev];
      copy[index] = newText;
      return copy;
    });
  };

  const handleDeleteLine = (index: number) => {
    setParsedLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (!subjectId || parsedLines.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const cleanTitles = parsedLines.map((l) => l.trim()).filter((l) => l.length > 0);
      await createTopicsBatch(db, subjectId, cleanTitles);
      await loadTopics(db, subjectId);
      router.back();
    } catch (err) {
      Alert.alert(
        'Error al importar',
        err instanceof Error ? err.message : 'No se pudieron guardar los temas.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Pegado inteligente</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {!isParsed ? (
          <View>
            <Text style={styles.instructionTitle}>
              Pegá el temario o programa de la materia
            </Text>
            <Text style={styles.instructionBody}>
              Copiá el texto tal cual de tu PDF, apunte o campus (con viñetas,
              guiones o números). El parser inteligente limpia el formato y
              separa cada tema por vos.
            </Text>

            <TextInput
              style={styles.textArea}
              value={rawText}
              onChangeText={setRawText}
              placeholder={`Ejemplo:\n- Unidad 1: Matrices y operaciones\n- Unidad 2: Sistemas de ecuaciones\n- Unidad 3: Espacios vectoriales`}
              placeholderTextColor={theme.colors.text.muted}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              autoFocus
            />

            <Button
              title="Analizar texto"
              onPress={handleParse}
              disabled={!rawText.trim()}
              icon={<Sparkles size={18} color={theme.colors.text.primary} />}
              style={styles.parseBtn}
            />
          </View>
        ) : (
          <View>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>Vista previa editable</Text>
                <Text style={styles.previewSubtitle}>
                  {parsedLines.length} temas detectados. Podés corregir o eliminar
                  líneas antes de guardar.
                </Text>
              </View>
              <Pressable onPress={() => setIsParsed(false)}>
                <Text style={styles.rePasteText}>Re-pegar</Text>
              </Pressable>
            </View>

            {warning && (
              <View style={styles.warningCard}>
                <AlertTriangle size={20} color={theme.colors.status.studied} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            )}

            <View style={styles.linesList}>
              {parsedLines.map((line, index) => (
                <View key={index} style={styles.lineContainer}>
                  <Text style={styles.lineIndex}>{index + 1}.</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={line}
                    onChangeText={(t) => handleUpdateLine(index, t)}
                  />
                  <Pressable
                    style={styles.deleteLineBtn}
                    onPress={() => handleDeleteLine(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar línea ${index + 1}`}
                  >
                    <Trash2 size={18} color={theme.colors.text.muted} />
                  </Pressable>
                </View>
              ))}
            </View>

            <Button
              title={`Importar ${parsedLines.length} temas`}
              onPress={handleConfirmImport}
              loading={isSubmitting}
              disabled={parsedLines.length === 0}
              icon={<Check size={20} color={theme.colors.text.primary} />}
              style={styles.confirmBtn}
            />
          </View>
        )}
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
  instructionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  instructionBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    minHeight: 220,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
    marginBottom: theme.spacing.lg,
  },
  parseBtn: {
    width: '100%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  previewTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  previewSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  rePasteText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.brand.primary,
    fontWeight: theme.typography.weights.medium,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.status.studied}1A`,
    borderColor: `${theme.colors.status.studied}4D`,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.status.studied,
    lineHeight: 18,
  },
  linesList: {
    marginBottom: theme.spacing.xl,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.sm,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    minHeight: 48,
  },
  lineIndex: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    width: 28,
    textAlign: 'center',
  },
  lineInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.xs,
  },
  deleteLineBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    width: '100%',
    marginBottom: theme.spacing.xxl,
  },
});
