import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { Subject } from '../types/models';
import { formatLocalDate } from '../utils/dateHelpers';

export async function getSubjects(
  db: SQLiteDatabase,
  includeArchived = false
): Promise<Subject[]> {
  if (includeArchived) {
    return await db.getAllAsync<Subject>(
      'SELECT * FROM subjects ORDER BY exam_date ASC, created_at DESC;'
    );
  }
  return await db.getAllAsync<Subject>(
    'SELECT * FROM subjects WHERE is_archived = 0 ORDER BY exam_date ASC, created_at DESC;'
  );
}

export async function getSubjectById(
  db: SQLiteDatabase,
  id: string
): Promise<Subject | null> {
  return await db.getFirstAsync<Subject>(
    'SELECT * FROM subjects WHERE id = ?;',
    [id]
  );
}

export async function createSubject(
  db: SQLiteDatabase,
  input: { name: string; exam_date: string; color_hex?: string }
): Promise<Subject> {
  const id = Crypto.randomUUID();
  const color_hex = input.color_hex ?? '#3B82F6';
  const created_at = new Date().toISOString();
  const is_archived = 0;

  await db.runAsync(
    `INSERT INTO subjects (id, name, exam_date, color_hex, is_archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.name.trim(), input.exam_date, color_hex, is_archived, created_at]
  );

  return {
    id,
    name: input.name.trim(),
    exam_date: input.exam_date,
    color_hex,
    is_archived,
    created_at,
  };
}

export async function updateSubject(
  db: SQLiteDatabase,
  id: string,
  input: Partial<Pick<Subject, 'name' | 'exam_date' | 'color_hex' | 'is_archived'>>
): Promise<void> {
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    params.push(input.name.trim());
  }
  if (input.exam_date !== undefined) {
    fields.push('exam_date = ?');
    params.push(input.exam_date);
  }
  if (input.color_hex !== undefined) {
    fields.push('color_hex = ?');
    params.push(input.color_hex);
  }
  if (input.is_archived !== undefined) {
    fields.push('is_archived = ?');
    params.push(input.is_archived);
  }

  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(
    `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?;`,
    params
  );
}

export async function deleteSubject(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM subjects WHERE id = ?;', [id]);
}

/**
 * P-001: Siembra una materia de demostración con 3 temas listos para probar en un toque.
 */
export async function seedDemoSubject(db: SQLiteDatabase): Promise<Subject> {
  // Fecha en 14 días en tiempo local
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 14);
  const examDateStr = formatLocalDate(targetDate);

  const subjectId = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // 1. Crear materia
    await db.runAsync(
      `INSERT INTO subjects (id, name, exam_date, color_hex, is_archived, created_at)
       VALUES (?, ?, ?, ?, 0, ?);`,
      [subjectId, 'Álgebra y Geometría Analítica', examDateStr, '#3B82F6', createdAt]
    );

    // 2. Crear 3 temas con distinta dificultad y estado
    const topic1Id = Crypto.randomUUID();
    const topic2Id = Crypto.randomUUID();
    const topic3Id = Crypto.randomUUID();

    await db.runAsync(
      `INSERT INTO topics (id, subject_id, title, status, difficulty, order_index)
       VALUES (?, ?, ?, 'NOT_STARTED', 1, 0);`,
      [topic1Id, subjectId, 'Unidad 1: Matrices y Determinantes']
    );

    await db.runAsync(
      `INSERT INTO topics (id, subject_id, title, status, difficulty, order_index)
       VALUES (?, ?, ?, 'STUDIED', 2, 1);`,
      [topic2Id, subjectId, 'Unidad 2: Sistemas de Ecuaciones Lineales']
    );

    await db.runAsync(
      `INSERT INTO topics (id, subject_id, title, status, difficulty, order_index)
       VALUES (?, ?, ?, 'NOT_STARTED', 3, 2);`,
      [topic3Id, subjectId, 'Unidad 3: Espacios Vectoriales']
    );
  });

  return {
    id: subjectId,
    name: 'Álgebra y Geometría Analítica',
    exam_date: examDateStr,
    color_hex: '#3B82F6',
    is_archived: 0,
    created_at: createdAt,
  };
}
