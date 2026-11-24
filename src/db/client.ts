import * as SQLite from 'expo-sqlite';
import { migrateDb } from './migrations';

export const DB_NAME = 'finales.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Obtiene la instancia activa de la base de datos SQLite.
 * Garantiza la ejecución de PRAGMA foreign_keys = ON; en cada apertura.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      // Regla técnica crítica 1: PRAGMA foreign_keys = ON;
      await db.execAsync('PRAGMA foreign_keys = ON;');
      dbInstance = db;
      return db;
    })();
  }

  return dbPromise;
}

/**
 * Inicializa la base de datos y ejecuta las migraciones pendientes.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();
  await migrateDb(db);
  return db;
}
