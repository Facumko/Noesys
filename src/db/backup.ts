import type { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Subject, Topic, Subtask, StudySession, Settings } from '../types/models';

export interface BackupData {
  version: number;
  exported_at: string;
  subjects: Subject[];
  topics: Topic[];
  subtasks: Subtask[];
  study_sessions: StudySession[];
  settings: Settings[];
}

/**
 * US-4.3: Exporta toda la base de datos a un formato JSON estructurado.
 */
export async function exportDatabaseToJson(db: SQLiteDatabase): Promise<string> {
  const subjects = await db.getAllAsync<Subject>('SELECT * FROM subjects;');
  const topics = await db.getAllAsync<Topic>('SELECT * FROM topics;');
  const subtasks = await db.getAllAsync<Subtask>('SELECT * FROM subtasks;');
  const study_sessions = await db.getAllAsync<StudySession>('SELECT * FROM study_sessions;');
  const settings = await db.getAllAsync<Settings>('SELECT * FROM settings;');

  const backup: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    subjects,
    topics,
    subtasks,
    study_sessions,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Comparte el archivo de backup JSON a través del diálogo nativo del sistema.
 */
export async function shareBackup(jsonContent: string): Promise<void> {
  const fileName = `finales_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar copia de seguridad de Finales',
      UTI: 'public.json',
    });
  }
}

/**
 * Restaura toda la base de datos a partir de un JSON válido en una única transacción atómica.
 */
export async function importDatabaseFromJson(
  db: SQLiteDatabase,
  jsonString: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString) as BackupData;

    if (!data.version || !Array.isArray(data.subjects)) {
      return { success: false, count: 0, error: 'El archivo JSON no tiene un formato válido de Finales.' };
    }

    await db.withTransactionAsync(async () => {
      // 1. Limpiar tablas existentes respetando el orden
      await db.runAsync('DELETE FROM subtasks;');
      await db.runAsync('DELETE FROM study_sessions;');
      await db.runAsync('DELETE FROM topics;');
      await db.runAsync('DELETE FROM subjects;');

      // 2. Restaurar materias
      for (const s of data.subjects) {
        await db.runAsync(
          `INSERT INTO subjects (id, name, exam_date, color_hex, is_archived, created_at)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [s.id, s.name, s.exam_date, s.color_hex, s.is_archived, s.created_at]
        );
      }

      // 3. Restaurar temas
      if (Array.isArray(data.topics)) {
        for (const t of data.topics) {
          await db.runAsync(
            `INSERT INTO topics (
              id, subject_id, title, status, difficulty,
              time_spent_seconds, notes, order_index, last_studied_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              t.id,
              t.subject_id,
              t.title,
              t.status,
              t.difficulty,
              t.time_spent_seconds,
              t.notes,
              t.order_index,
              t.last_studied_at,
            ]
          );
        }
      }

      // 4. Restaurar subtareas
      if (Array.isArray(data.subtasks)) {
        for (const st of data.subtasks) {
          await db.runAsync(
            'INSERT INTO subtasks (id, topic_id, title, is_completed) VALUES (?, ?, ?, ?);',
            [st.id, st.topic_id, st.title, st.is_completed]
          );
        }
      }

      // 5. Restaurar sesiones
      if (Array.isArray(data.study_sessions)) {
        for (const ss of data.study_sessions) {
          await db.runAsync(
            `INSERT INTO study_sessions (id, subject_id, topic_id, started_at, duration_seconds)
             VALUES (?, ?, ?, ?, ?);`,
            [ss.id, ss.subject_id, ss.topic_id, ss.started_at, ss.duration_seconds]
          );
        }
      }
    });

    return { success: true, count: data.subjects.length };
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Error al procesar el archivo JSON.',
    };
  }
}
