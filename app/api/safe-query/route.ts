import { NextResponse } from "next/server";
import { guardAndNormalizeSql } from "@/lib/sql-guard";
import { runSelect } from "@/lib/db";

export const runtime = "nodejs";

/** Re-run a previously validated SELECT (e.g. saved insight). Same guard as NL path. */
export async function POST(req: Request) {
  let body: { sql?: string };
  try {
    body = (await req.json()) as { sql?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.sql !== "string" || !body.sql.trim()) {
    return NextResponse.json({ ok: false, error: "sql is required." }, { status: 400 });
  }

  const guarded = guardAndNormalizeSql(body.sql);
  if (!guarded.ok) {
    return NextResponse.json({ ok: false, error: guarded.error }, { status: 422 });
  }

  try {
    const rows = runSelect<Record<string, unknown>>(guarded.sql);
    return NextResponse.json({ ok: true, sql: guarded.sql, rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 422 });
  }
}
