import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { Topic, TopicStatus, TopicDifficulty } from '../types/models';

export async function getTopicsBySubjectId(
  db: SQLiteDatabase,
  subjectId: string
): Promise<Topic[]> {
  return await db.getAllAsync<Topic>(
    'SELECT * FROM topics WHERE subject_id = ? ORDER BY order_index ASC;',
    [subjectId]
  );
}

export async function getTopicById(
  db: SQLiteDatabase,
  id: string
): Promise<Topic | null> {
  return await db.getFirstAsync<Topic>(
    'SELECT * FROM topics WHERE id = ?;',
    [id]
  );
}

export async function createTopic(
  db: SQLiteDatabase,
  input: {
    subject_id: string;
    title: string;
    difficulty?: TopicDifficulty;
    notes?: string | null;
    order_index?: number;
  }
): Promise<Topic> {
  const id = Crypto.randomUUID();
  const difficulty = input.difficulty ?? 1;
  const status: TopicStatus = 'NOT_STARTED';
  const notes = input.notes ?? null;
  const time_spent_seconds = 0;
  const last_studied_at = null;

  let orderIndex = input.order_index;
  if (orderIndex === undefined) {
    const lastTopic = await db.getFirstAsync<{ max_index: number | null }>(
      'SELECT MAX(order_index) as max_index FROM topics WHERE subject_id = ?;',
      [input.subject_id]
    );
    orderIndex = (lastTopic?.max_index ?? -1) + 1;
  }

  await db.runAsync(
    `INSERT INTO topics (
      id, subject_id, title, status, difficulty,
      time_spent_seconds, notes, order_index, last_studied_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.subject_id,
      input.title.trim(),
      status,
      difficulty,
      time_spent_seconds,
      notes,
      orderIndex,
      last_studied_at,
    ]
  );

  return {
    id,
    subject_id: input.subject_id,
    title: input.title.trim(),
    status,
    difficulty,
    time_spent_seconds,
    notes,
    order_index: orderIndex,
    last_studied_at,
  };
}

export async function updateTopic(
  db: SQLiteDatabase,
  id: string,
  input: Partial<Pick<Topic, 'title' | 'status' | 'difficulty' | 'notes' | 'time_spent_seconds' | 'last_studied_at'>>
): Promise<void> {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    params.push(input.title.trim());
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    params.push(input.status);
  }
  if (input.difficulty !== undefined) {
    fields.push('difficulty = ?');
    params.push(input.difficulty);
  }
  if (input.notes !== undefined) {
    fields.push('notes = ?');
    params.push(input.notes);
  }
  if (input.time_spent_seconds !== undefined) {
    fields.push('time_spent_seconds = ?');
    params.push(input.time_spent_seconds);
  }
  if (input.last_studied_at !== undefined) {
    fields.push('last_studied_at = ?');
    params.push(input.last_studied_at);
  }

  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(
    `UPDATE topics SET ${fields.join(', ')} WHERE id = ?;`,
    params
  );
}

/**
 * US-1.5: Cambio de estado en un toque: NOT_STARTED -> STUDIED -> REVIEWED -> NOT_STARTED
 */
export async function cycleTopicStatus(
  db: SQLiteDatabase,
  id: string,
  currentStatus: TopicStatus
): Promise<TopicStatus> {
  let nextStatus: TopicStatus;
  let lastStudiedAt: string | null = null;

  if (currentStatus === 'NOT_STARTED') {
    nextStatus = 'STUDIED';
    lastStudiedAt = new Date().toISOString();
  } else if (currentStatus === 'STUDIED') {
    nextStatus = 'REVIEWED';
    lastStudiedAt = new Date().toISOString();
  } else {
    nextStatus = 'NOT_STARTED';
  }

  if (lastStudiedAt) {
    await db.runAsync(
      'UPDATE topics SET status = ?, last_studied_at = ? WHERE id = ?;',
      [nextStatus, lastStudiedAt, id]
    );
  } else {
    await db.runAsync(
      'UPDATE topics SET status = ? WHERE id = ?;',
      [nextStatus, id]
    );
  }

  return nextStatus;
}

/**
 * US-1.5: Cambio de dificultad (1 -> 2 -> 3 -> 1)
 */
export async function cycleTopicDifficulty(
  db: SQLiteDatabase,
  id: string,
  currentDifficulty: TopicDifficulty
): Promise<TopicDifficulty> {
  const nextDifficulty: TopicDifficulty = currentDifficulty === 1 ? 2 : currentDifficulty === 2 ? 3 : 1;
  await db.runAsync(
    'UPDATE topics SET difficulty = ? WHERE id = ?;',
    [nextDifficulty, id]
  );
  return nextDifficulty;
}

export async function deleteTopic(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM topics WHERE id = ?;', [id]);
}

/**
 * Inserción masiva de temas en una única transacción SQLite (Sprint 2 / US-2.2).
 */
export async function createTopicsBatch(
  db: SQLiteDatabase,
  subjectId: string,
  titles: string[]
): Promise<Topic[]> {
  const created: Topic[] = [];

  await db.withTransactionAsync(async () => {
    const lastTopic = await db.getFirstAsync<{ max_index: number | null }>(
      'SELECT MAX(order_index) as max_index FROM topics WHERE subject_id = ?;',
      [subjectId]
    );
    let startIndex = (lastTopic?.max_index ?? -1) + 1;

    for (const title of titles) {
      const id = Crypto.randomUUID();
      const orderIndex = startIndex++;
      await db.runAsync(
        `INSERT INTO topics (
          id, subject_id, title, status, difficulty,
          time_spent_seconds, notes, order_index, last_studied_at
        ) VALUES (?, ?, ?, 'NOT_STARTED', 1, 0, NULL, ?, NULL);`,
        [id, subjectId, title.trim(), orderIndex]
      );
      created.push({
        id,
        subject_id: subjectId,
        title: title.trim(),
        status: 'NOT_STARTED',
        difficulty: 1,
        time_spent_seconds: 0,
        notes: null,
        order_index: orderIndex,
        last_studied_at: null,
      });
    }
  });

  return created;
}
