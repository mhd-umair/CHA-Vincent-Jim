import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_FILENAME = "perseus_equipment_database.db";

let dbInstance: Database.Database | null = null;

function resolveDbPath(): string {
  const root = process.cwd();
  const dbPath = path.join(root, DB_FILENAME);
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }
  return dbPath;
}

/** Read-only SQLite connection (server-only). */
export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = resolveDbPath();
  dbInstance = new Database(dbPath, {
    readonly: true,
    fileMustExist: true,
  });
  return dbInstance;
}

export function runSelect<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function getScalar(sql: string, params: unknown[] = []): unknown {
  const db = getDb();
  const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const key = Object.keys(row)[0];
  return key !== undefined ? row[key] : undefined;
}
