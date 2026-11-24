import { MIGRATIONS, migrateDb } from '../src/db/migrations';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('Database migrations (US-1.2)', () => {
  test('Migrations have sequential strictly positive versions', () => {
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < MIGRATIONS.length; i++) {
      expect(MIGRATIONS[i].version).toBe(i + 1);
      expect(MIGRATIONS[i].description.length).toBeGreaterThan(0);
    }
  });

  test('migrateDb always enables PRAGMA foreign_keys = ON; first', async () => {
    const executedSql: string[] = [];
    const mockDb = {
      execAsync: jest.fn(async (sql: string) => {
        executedSql.push(sql.trim());
      }),
      getFirstAsync: jest.fn(async () => {
        return { user_version: 0 };
      }),
      withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => {
        await callback();
      }),
    } as unknown as SQLiteDatabase;

    await migrateDb(mockDb);

    expect(executedSql[0]).toBe('PRAGMA foreign_keys = ON;');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith('PRAGMA user_version;');
  });

  test('Migration 1 creates all required tables with correct cascade and check constraints', async () => {
    const executedSql: string[] = [];
    const mockDb = {
      execAsync: jest.fn(async (sql: string) => {
        executedSql.push(sql.trim());
      }),
      getFirstAsync: jest.fn(async () => ({ user_version: 0 })),
      withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => {
        await cb();
      }),
    } as unknown as SQLiteDatabase;

    await migrateDb(mockDb);

    const fullSql = executedSql.join('\n');

    // subjects
    expect(fullSql).toContain('CREATE TABLE IF NOT EXISTS subjects');
    expect(fullSql).toContain('exam_date TEXT NOT NULL');

    // topics
    expect(fullSql).toContain('CREATE TABLE IF NOT EXISTS topics');
    expect(fullSql).toContain('REFERENCES subjects(id) ON DELETE CASCADE');
    expect(fullSql).toContain('CREATE INDEX IF NOT EXISTS idx_topics_subject');

    // subtasks
    expect(fullSql).toContain('CREATE TABLE IF NOT EXISTS subtasks');
    expect(fullSql).toContain('REFERENCES topics(id) ON DELETE CASCADE');

    // study_sessions (P-004: SET NULL en topic_id, CASCADE en subject_id)
    expect(fullSql).toContain('CREATE TABLE IF NOT EXISTS study_sessions');
    expect(fullSql).toContain('REFERENCES subjects(id) ON DELETE CASCADE');
    expect(fullSql).toContain('REFERENCES topics(id) ON DELETE SET NULL');

    // settings (H-001 y H-005)
    expect(fullSql).toContain('CREATE TABLE IF NOT EXISTS settings');
    expect(fullSql).toContain('CHECK (id = 1)');
    expect(fullSql).toContain('CHECK (daily_capacity_units > 0)');
    expect(fullSql).toContain('INSERT OR IGNORE INTO settings');

    // version update
    expect(fullSql).toContain('PRAGMA user_version = 1;');
  });

  test('Idempotency: does not run migration 1 if user_version is already 1', async () => {
    const executedSql: string[] = [];
    const mockDb = {
      execAsync: jest.fn(async (sql: string) => {
        executedSql.push(sql.trim());
      }),
      getFirstAsync: jest.fn(async () => ({ user_version: 1 })), // ya en versión 1
      withTransactionAsync: jest.fn(),
    } as unknown as SQLiteDatabase;

    await migrateDb(mockDb);

    // Solo debe haber ejecutado PRAGMA foreign_keys = ON;
    expect(executedSql).toEqual(['PRAGMA foreign_keys = ON;']);
    expect(mockDb.withTransactionAsync).not.toHaveBeenCalled();
  });
});
