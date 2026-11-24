import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { StudySession } from '../types/models';

export async function recordStudySession(
  db: SQLiteDatabase,
  input: {
    subject_id: string;
    topic_id?: string | null;
    duration_seconds: number;
    started_at: string;
  }
): Promise<StudySession> {
  const id = Crypto.randomUUID();
  const topicId = input.topic_id ?? null;

  await db.withTransactionAsync(async () => {
    // 1. Insertar sesión de estudio
    await db.runAsync(
      `INSERT INTO study_sessions (id, subject_id, topic_id, started_at, duration_seconds)
       VALUES (?, ?, ?, ?, ?);`,
      [id, input.subject_id, topicId, input.started_at, input.duration_seconds]
    );

    // 2. Si hay tema asociado, acumular tiempo y registrar última hora de estudio
    if (topicId) {
      await db.runAsync(
        `UPDATE topics 
         SET time_spent_seconds = time_spent_seconds + ?,
             last_studied_at = ?
         WHERE id = ?;`,
        [input.duration_seconds, new Date().toISOString(), topicId]
      );
    }
  });

  return {
    id,
    subject_id: input.subject_id,
    topic_id: topicId,
    started_at: input.started_at,
    duration_seconds: input.duration_seconds,
  };
}

export async function getStudySessions(
  db: SQLiteDatabase,
  subjectId?: string
): Promise<StudySession[]> {
  if (subjectId) {
    return await db.getAllAsync<StudySession>(
      'SELECT * FROM study_sessions WHERE subject_id = ? ORDER BY started_at DESC;',
      [subjectId]
    );
  }
  return await db.getAllAsync<StudySession>(
    'SELECT * FROM study_sessions ORDER BY started_at DESC;'
  );
}

export async function getTotalStudiedSeconds(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(duration_seconds) as total FROM study_sessions;'
  );
  return result?.total ?? 0;
}
