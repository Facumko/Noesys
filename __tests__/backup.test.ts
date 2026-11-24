jest.mock('expo-file-system', () => ({
  writeAsStringAsync: jest.fn(),
  cacheDirectory: 'file:///mock/cache/',
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

import { exportDatabaseToJson, importDatabaseFromJson } from '../src/db/backup';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('Database backup and restore tests (US-4.3)', () => {
  test('exportDatabaseToJson formats database into structured JSON', async () => {
    const mockDb = {
      getAllAsync: jest.fn(async (sql: string) => {
        if (sql.includes('subjects')) {
          return [
            {
              id: 's-1',
              name: 'Álgebra',
              exam_date: '2026-12-10',
              color_hex: '#3B82F6',
              is_archived: 0,
              created_at: '2026-11-20T00:00:00.000Z',
            },
          ];
        }
        if (sql.includes('topics')) {
          return [
            {
              id: 't-1',
              subject_id: 's-1',
              title: 'Matrices',
              status: 'NOT_STARTED',
              difficulty: 1,
              time_spent_seconds: 0,
              notes: null,
              order_index: 0,
              last_studied_at: null,
            },
          ];
        }
        return [];
      }),
    } as unknown as SQLiteDatabase;

    const jsonStr = await exportDatabaseToJson(mockDb);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.version).toBe(1);
    expect(parsed.exported_at).toBeDefined();
    expect(parsed.subjects.length).toBe(1);
    expect(parsed.topics.length).toBe(1);
  });

  test('importDatabaseFromJson returns false and error for invalid JSON string', async () => {
    const mockDb = {} as unknown as SQLiteDatabase;
    const result = await importDatabaseFromJson(mockDb, '{ invalid-json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('importDatabaseFromJson successfully restores rows in atomic transaction', async () => {
    const executedQueries: string[] = [];
    const mockDb = {
      withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => {
        await cb();
      }),
      runAsync: jest.fn(async (sql: string) => {
        executedQueries.push(sql.trim());
      }),
    } as unknown as SQLiteDatabase;

    const validBackup = JSON.stringify({
      version: 1,
      exported_at: '2026-11-24T00:00:00.000Z',
      subjects: [
        {
          id: 's-1',
          name: 'Física I',
          exam_date: '2026-12-18',
          color_hex: '#10B981',
          is_archived: 0,
          created_at: '2026-11-24T00:00:00.000Z',
        },
      ],
      topics: [],
      subtasks: [],
      study_sessions: [],
      settings: [],
    });

    const result = await importDatabaseFromJson(mockDb, validBackup);
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(mockDb.withTransactionAsync).toHaveBeenCalled();
  });
});
