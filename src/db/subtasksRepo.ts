import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { Subtask } from '../types/models';

export async function getSubtasksByTopicId(
  db: SQLiteDatabase,
  topicId: string
): Promise<Subtask[]> {
  return await db.getAllAsync<Subtask>(
    'SELECT * FROM subtasks WHERE topic_id = ? ORDER BY rowid ASC;',
    [topicId]
  );
}

export async function createSubtask(
  db: SQLiteDatabase,
  input: { topic_id: string; title: string }
): Promise<Subtask> {
  const id = Crypto.randomUUID();
  const is_completed = 0;

  await db.runAsync(
    'INSERT INTO subtasks (id, topic_id, title, is_completed) VALUES (?, ?, ?, ?);',
    [id, input.topic_id, input.title.trim(), is_completed]
  );

  return {
    id,
    topic_id: input.topic_id,
    title: input.title.trim(),
    is_completed,
  };
}

export async function toggleSubtask(
  db: SQLiteDatabase,
  id: string,
  isCompleted: number
): Promise<number> {
  const nextValue = isCompleted ? 0 : 1;
  await db.runAsync(
    'UPDATE subtasks SET is_completed = ? WHERE id = ?;',
    [nextValue, id]
  );
  return nextValue;
}

export async function deleteSubtask(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM subtasks WHERE id = ?;', [id]);
}
