import type { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Schema inicial: subjects, topics, subtasks, study_sessions y settings',
    up: async (db: SQLiteDatabase) => {
      // 1. Materias (subjects)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          exam_date TEXT NOT NULL,
          color_hex TEXT DEFAULT '#3B82F6',
          is_archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
      `);

      // 2. Temas (topics)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY NOT NULL,
          subject_id TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'NOT_STARTED',
          difficulty INTEGER NOT NULL DEFAULT 1,
          time_spent_seconds INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          order_index INTEGER NOT NULL,
          last_studied_at TEXT,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
      `);

      // 3. Subtareas (subtasks)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id TEXT PRIMARY KEY NOT NULL,
          topic_id TEXT NOT NULL,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
        );
      `);

      // 4. Historial de sesiones (study_sessions): P-004 preserva historial
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS study_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          subject_id TEXT NOT NULL,
          topic_id TEXT,
          started_at TEXT NOT NULL,
          duration_seconds INTEGER NOT NULL,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
        );
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);
      `);

      // 5. Configuración (settings): H-001 y H-005
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          daily_reminder_enabled INTEGER DEFAULT 1,
          daily_reminder_time TEXT DEFAULT '18:00',
          default_timer_minutes INTEGER DEFAULT 25,
          daily_capacity_units REAL DEFAULT 2.0 CHECK (daily_capacity_units > 0),
          haptics_enabled INTEGER DEFAULT 1
        );
      `);

      // Inserción garantizada de la única fila de configuración
      await db.execAsync(`
        INSERT OR IGNORE INTO settings (
          id,
          daily_reminder_enabled,
          daily_reminder_time,
          default_timer_minutes,
          daily_capacity_units,
          haptics_enabled
        ) VALUES (1, 1, '18:00', 25, 2.0, 1);
      `);
    },
  },
];

/**
 * Aplica todas las migraciones pendientes en orden versionado atómico.
 */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  // Asegura siempre claves foráneas activas antes de cualquier migración
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Obtiene versión actual de la base
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  const pendingMigrations = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pendingMigrations) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
