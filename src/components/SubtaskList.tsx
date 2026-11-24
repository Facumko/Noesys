import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '../theme/tokens';
import type { Subtask } from '../types/models';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string, current: number) => void | Promise<void>;
  onAdd: (title: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function SubtaskList({
  subtasks,
  onToggle,
  onAdd,
  onDelete,
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');

  const handleToggle = async (id: string, current: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // noop
    }
    await onToggle(id, current);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await onAdd(newTitle.trim());
    setNewTitle('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Micro-pasos para destrabar</Text>

      {/* Input para agregar subtarea */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Dividí el tema en un paso chico (ej: leer pág. 10)"
          placeholderTextColor={theme.colors.text.muted}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, !newTitle.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!newTitle.trim()}
          accessibilityRole="button"
          accessibilityLabel="Agregar micro-paso"
        >
          <Plus size={18} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {/* Lista de subtareas */}
      <View style={styles.list}>
        {subtasks.length === 0 ? (
          <Text style={styles.emptyText}>
            ¿Sentís bloqueo? Anotá acá una acción mínima de 2 minutos para arrancar.
          </Text>
        ) : (
          subtasks.map((subtask) => {
            const isDone = subtask.is_completed === 1;
            return (
              <View key={subtask.id} style={styles.itemRow}>
                <Pressable
                  style={[styles.checkbox, isDone && styles.checkboxDone]}
                  onPress={() => handleToggle(subtask.id, subtask.is_completed)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone }}
                >
                  {isDone && <Check size={14} color="#FFF" />}
                </Pressable>

                <Text
                  style={[styles.itemText, isDone && styles.itemTextDone]}
                  numberOfLines={2}
                >
                  {subtask.title}
                </Text>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => onDelete(subtask.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar micro-paso"
                >
                  <Trash2 size={16} color={theme.colors.text.muted} />
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },
  header: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingLeft: theme.spacing.md,
    paddingRight: 4,
    minHeight: theme.accessibility.minTouchTarget,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    paddingVertical: theme.spacing.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  list: {
    gap: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderColor: theme.colors.border.subtle,
    borderWidth: 1,
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: theme.accessibility.minTouchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.xs,
    borderColor: theme.colors.border.subtle,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxDone: {
    backgroundColor: theme.colors.status.reviewed,
    borderColor: theme.colors.status.reviewed,
  },
  itemText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
  itemTextDone: {
    color: theme.colors.text.muted,
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
