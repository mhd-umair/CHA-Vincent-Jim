import { Parser } from "node-sql-parser";
import { ALLOWED_TABLES } from "@/lib/allowed-tables";

const FORBIDDEN = /\b(insert|update|delete|drop|attach|pragma|vacuum|replace|create|alter|truncate|detach|reindex|analyze)\b/i;

const parser = new Parser();

function stripTrailingSemicolon(s: string): string {
  const t = s.trim();
  if (t.endsWith(";")) return t.slice(0, -1).trim();
  return t;
}

/** Normalize parser tableList entries like "select::null::InvoiceHeader" → InvoiceHeader */
function parseTableListEntry(entry: string): string | null {
  const parts = entry.split("::");
  const last = parts[parts.length - 1];
  if (!last) return null;
  const name = last.replace(/^["`]|["`]$/g, "");
  return name || null;
}

export type SqlGuardResult =
  | { ok: true; sql: string }
  | { ok: false; error: string };

const MAX_LIMIT = 2000;

function hasOuterLimit(sql: string): boolean {
  return /\blimit\s+\d+(\s+offset\s+\d+)?\s*$/i.test(sql.trim());
}

function capLimitClause(sql: string): string {
  const m = sql.trim().match(/\blimit\s+(\d+)(\s+offset\s+\d+)?\s*$/i);
  if (!m || !m[1]) return sql;
  const n = parseInt(m[1], 10);
  if (n <= MAX_LIMIT) return sql;
  return sql.trim().replace(/\blimit\s+\d+/i, `LIMIT ${MAX_LIMIT}`);
}

/**
 * Ensures a single read-only SELECT against allowlisted tables.
 * Appends LIMIT if missing.
 */
export function guardAndNormalizeSql(raw: string): SqlGuardResult {
  const trimmed = stripTrailingSemicolon(raw);
  if (!trimmed) return { ok: false, error: "Empty SQL." };
  if (trimmed.includes(";")) {
    return { ok: false, error: "Multiple statements are not allowed." };
  }
  if (FORBIDDEN.test(trimmed)) {
    return { ok: false, error: "Only read-only SELECT queries are allowed." };
  }
  if (!/^\s*select\b/i.test(trimmed)) {
    return { ok: false, error: "Query must be a single SELECT statement." };
  }

  try {
    parser.parse(trimmed, { database: "sqlite" });
  } catch (e) {
    return {
      ok: false,
      error: `SQL parse error: ${e instanceof Error ? e.message : "invalid SQL"}`,
    };
  }

  let list: string[];
  try {
    list = parser.tableList(trimmed, { database: "sqlite" });
  } catch (e) {
    return {
      ok: false,
      error: `Could not validate tables: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  const tables = new Set<string>();
  for (const entry of list) {
    const t = parseTableListEntry(entry);
    if (t) tables.add(t);
  }

  for (const t of tables) {
    if (!ALLOWED_TABLES.has(t)) {
      return { ok: false, error: `Table not allowed: ${t}` };
    }
  }

  let sql = trimmed;
  if (!hasOuterLimit(sql)) {
    sql = `${sql} LIMIT ${MAX_LIMIT}`;
  } else {
    sql = capLimitClause(sql);
  }

  return { ok: true, sql };
}
