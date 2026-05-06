/**
 * Shared SQL fragments + helpers used by every department dashboard so the
 * "what counts as posted revenue" rule and date filtering live in one place.
 */

/** Posted standard invoice revenue (finalized + archived, type `in`). */
export const POSTED_SALES = `lower(ih.Status) IN ('finalized', 'archived') AND lower(ih.InvoiceType) = 'in'`;

/** Posted invoices of any type (`in`, `wo`, `rl`). Used for cross-type rollups. */
export const POSTED_ANY_TYPE = `lower(ih.Status) IN ('finalized', 'archived')`;

export type DateRange = {
  /** Inclusive start, ISO `YYYY-MM-DD`. `null` means no lower bound. */
  from: string | null;
  /** Inclusive end, ISO `YYYY-MM-DD`. `null` means no upper bound. */
  to: string | null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function safeIso(v: string | null | undefined): string | null {
  if (!v) return null;
  return ISO_DATE.test(v) ? v : null;
}

/**
 * Parse `from` / `to` from `URLSearchParams`-shaped input.
 * Defaults to the trailing 12 months when both are missing so trends never
 * render an empty chart.
 */
export function parseDateRange(input: {
  from?: string | string[];
  to?: string | string[];
}): DateRange {
  const fromRaw = Array.isArray(input.from) ? input.from[0] : input.from;
  const toRaw = Array.isArray(input.to) ? input.to[0] : input.to;
  const from = safeIso(fromRaw);
  const to = safeIso(toRaw);
  if (from || to) return { from, to };
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
  )
    .toISOString()
    .slice(0, 10);
  return { from: start, to: end };
}

/**
 * Build a SQL fragment + params that filters `col` to `[from, to]` (inclusive).
 * Uses lexical comparison because dates are stored as ISO-ish TEXT.
 *
 * Returns an empty fragment (no clause) if both bounds are null so callers can
 * always interpolate it after `WHERE ... AND `.
 */
export function dateFilter(
  col: string,
  range: DateRange,
): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const parts: string[] = [];
  if (range.from) {
    parts.push(`${col} >= ?`);
    params.push(range.from);
  }
  if (range.to) {
    parts.push(`${col} <= ?`);
    params.push(`${range.to} 23:59:59`);
  }
  if (parts.length === 0) return { sql: "1=1", params: [] };
  return { sql: parts.join(" AND "), params };
}

/** Human label for the active range, used in KPI hint text. */
export function rangeLabel(range: DateRange): string {
  if (!range.from && !range.to) return "All time";
  if (range.from && range.to) return `${range.from} → ${range.to}`;
  if (range.from) return `From ${range.from}`;
  return `Through ${range.to}`;
}
