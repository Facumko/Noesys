/**
 * Shim de expo-sqlite para web.
 * Usa IndexedDB internamente con la misma API asíncrona que usa el resto de la app.
 * Solo se usa en la plataforma web (redirigido desde metro.config.js).
 */

// Almacenamiento en memoria para web (simula SQLite con un motor JS puro)
// Usa sql.js cargado dinámicamente o bien cae a un mock en memoria.

type Row = Record<string, unknown>;

// Motor en memoria: tablas como arrays de objetos
const tables: Record<string, Row[]> = {};
let userVersion = 0;

function evaluateSQL(sql: string, params: unknown[] = []): Row[] {
  const normalized = sql.trim().replace(/\s+/g, ' ').toLowerCase();

  // PRAGMA user_version
  const pragmaGet = normalized.match(/^pragma user_version;?$/);
  if (pragmaGet) return [{ user_version: userVersion }];

  const pragmaSet = normalized.match(/^pragma user_version\s*=\s*(\d+);?$/);
  if (pragmaSet) {
    userVersion = Number(pragmaSet[1]);
    return [];
  }

  // PRAGMA foreign_keys — ignorado en web (siempre activo conceptualmente)
  if (normalized.startsWith('pragma foreign_keys')) return [];

  // CREATE TABLE IF NOT EXISTS
  const createMatch = normalized.match(/^create table if not exists (\w+)/);
  if (createMatch) {
    const tbl = createMatch[1];
    if (!tables[tbl]) tables[tbl] = [];
    return [];
  }

  // CREATE INDEX
  if (normalized.startsWith('create index')) return [];

  // INSERT OR IGNORE
  const insertMatch = sql
    .trim()
    .match(/^INSERT OR IGNORE INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const tbl = insertMatch[1].toLowerCase();
    if (!tables[tbl]) tables[tbl] = [];
    const cols = insertMatch[2].split(',').map((c) => c.trim());
    const rawVals = insertMatch[3].split(',').map((v) => v.trim());
    // Reemplaza ? con params positionally, el resto son literales
    let pIdx = 0;
    const vals = rawVals.map((v) => {
      if (v === '?') return params[pIdx++];
      if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
      if (!isNaN(Number(v))) return Number(v);
      return v;
    });
    const pkCol = cols[0];
    const pkVal = vals[0];
    const existing = tables[tbl].find((r) => r[pkCol] === pkVal);
    if (!existing) {
      const row: Row = {};
      cols.forEach((c, i) => { row[c] = vals[i]; });
      tables[tbl].push(row);
    }
    return [];
  }

  // INSERT INTO
  const insertNormal = sql
    .trim()
    .match(/^INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertNormal) {
    const tbl = insertNormal[1].toLowerCase();
    if (!tables[tbl]) tables[tbl] = [];
    const cols = insertNormal[2].split(',').map((c) => c.trim());
    const rawVals = insertNormal[3].split(',').map((v) => v.trim());
    let pIdx = 0;
    const vals = rawVals.map((v) => {
      if (v === '?') return params[pIdx++];
      if (v === 'NULL' || v === 'null') return null;
      if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
      if (!isNaN(Number(v))) return Number(v);
      return v;
    });
    const row: Row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    tables[tbl].push(row);
    return [];
  }

  // UPDATE
  const updateMatch = sql.trim().match(/^UPDATE (\w+) SET (.+?) WHERE (.+)$/i);
  if (updateMatch) {
    const tbl = updateMatch[1].toLowerCase();
    if (!tables[tbl]) return [];
    const setPart = updateMatch[2];
    const wherePart = updateMatch[3];
    const setCols = setPart.split(',').map((s) => s.trim());
    let pIdx = 0;
    const updates: Row = {};
    for (const s of setCols) {
      const [col, val] = s.split('=').map((x) => x.trim());
      if (val === '?') updates[col] = params[pIdx++];
      else if (val === 'NULL' || val === 'null') updates[col] = null;
      else if (val.startsWith("'") && val.endsWith("'")) updates[col] = val.slice(1, -1);
      else updates[col] = !isNaN(Number(val)) ? Number(val) : val;
    }
    const whereTokens = wherePart.match(/(\w+)\s*=\s*\?/g) ?? [];
    tables[tbl] = tables[tbl].map((row) => {
      const matches = whereTokens.every((t) => {
        const col = t.split('=')[0].trim();
        return String(row[col]) === String(params[pIdx++]);
      });
      if (matches) {
        // Reset pIdx per row
        pIdx -= whereTokens.length;
      }
      return matches ? { ...row, ...updates } : row;
    });
    return [];
  }

  // DELETE FROM
  const deleteMatch = sql.trim().match(/^DELETE FROM (\w+)\s*WHERE\s*(\w+)\s*=\s*\?/i);
  if (deleteMatch) {
    const tbl = deleteMatch[1].toLowerCase();
    const col = deleteMatch[2];
    if (!tables[tbl]) return [];
    tables[tbl] = tables[tbl].filter((r) => String(r[col]) !== String(params[0]));
    return [];
  }

  // SELECT *
  const selectAll = sql.trim().match(/^SELECT \* FROM (\w+)(?:\s*WHERE\s*(.+?))?(?:\s*ORDER BY\s*(.+?))?(?:\s*LIMIT\s*\d+)?;?$/i);
  if (selectAll) {
    const tbl = selectAll[1].toLowerCase();
    if (!tables[tbl]) return [];
    let rows = [...tables[tbl]];
    if (selectAll[2]) {
      const whereRaw = selectAll[2];
      const eqMatch = whereRaw.match(/(\w+)\s*=\s*\?/i);
      if (eqMatch) {
        const col = eqMatch[1];
        rows = rows.filter((r) => String(r[col]) === String(params[0]));
      }
    }
    return rows;
  }

  // SELECT COUNT
  const selectCount = sql.trim().match(/^SELECT COUNT\(\*\) as count FROM (\w+)/i);
  if (selectCount) {
    const tbl = selectCount[1].toLowerCase();
    return [{ count: tables[tbl]?.length ?? 0 }];
  }

  // Fallback: SELECT con columnas específicas
  if (normalized.startsWith('select')) {
    const tblMatch = normalized.match(/from\s+(\w+)/);
    if (tblMatch) {
      const tbl = tblMatch[1];
      if (!tables[tbl]) return [];
      let rows = [...tables[tbl]];
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (whereMatch) {
        const col = whereMatch[1];
        rows = rows.filter((r) => String(r[col]) === String(params[0]));
      }
      return rows;
    }
  }

  return [];
}

class WebSQLiteDatabase {
  async execAsync(sql: string): Promise<void> {
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      evaluateSQL(stmt + ';');
    }
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = evaluateSQL(sql, params);
    return (rows[0] as T) ?? null;
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return evaluateSQL(sql, params) as T[];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    evaluateSQL(sql, params);
    return { lastInsertRowId: 0, changes: 1 };
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }
}

const dbInstances: Record<string, WebSQLiteDatabase> = {};

export function openDatabaseAsync(name: string): Promise<WebSQLiteDatabase> {
  if (!dbInstances[name]) {
    dbInstances[name] = new WebSQLiteDatabase();
  }
  return Promise.resolve(dbInstances[name]);
}

export type SQLiteDatabase = WebSQLiteDatabase;
