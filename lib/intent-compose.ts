/**
 * Step 2 of the hybrid pipeline: take a structured `Intent` and produce
 * deterministic SQL by stitching together the metric, dimensions, and period
 * defined in `metrics-registry.ts`.
 *
 * Returning `null` triggers the freeform LLM fallback in `nl-query.ts`. We
 * bail out (instead of trying to be clever) whenever the intent references a
 * key the registry doesn't recognize, picks an incompatible dimension/metric
 * pair, or asks for something the registry doesn't model (custom metrics,
 * unknown filter columns, etc.).
 */

import {
  DIMENSIONS,
  METRICS,
  PERIODS,
  SCOPES,
  isDimensionKey,
  isMetricKey,
  isPeriodKey,
  type DimensionKey,
  type MetricKey,
  type ScopeKey,
} from "@/lib/metrics-registry";
import type { FilterOp, Intent } from "@/lib/intent";

export type ComposedSql = {
  sql: string;
  /**
   * Note: we currently inline params via the registry's `build(...)`
   * helpers, but `runSelect` accepts a params array, so we expose this for
   * future parameterization. For composed SQL today, all values either come
   * from the registry (literal) or from filters (LIKE/eq with the user's
   * value, sanitized).
   */
  params: unknown[];
  /** Human-friendly trace useful in the UI / debug. */
  trace: string[];
};

const SAFE_LITERAL_RE = /^[\w\s.,%@&'+/:()\-#]{1,80}$/;

function quoteLiteral(v: string): string | null {
  if (!SAFE_LITERAL_RE.test(v)) return null;
  return `'${v.replace(/'/g, "''")}'`;
}

function operatorSql(op: FilterOp, valueRaw: string): string | null {
  switch (op) {
    case "eq": {
      const lit = quoteLiteral(valueRaw);
      if (!lit) return null;
      return `= ${lit}`;
    }
    case "neq": {
      const lit = quoteLiteral(valueRaw);
      if (!lit) return null;
      return `<> ${lit}`;
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const num = Number(valueRaw);
      if (!Number.isFinite(num)) {
        const lit = quoteLiteral(valueRaw);
        if (!lit) return null;
        return `${opMap[op]} ${lit}`;
      }
      return `${opMap[op]} ${num}`;
    }
    case "like": {
      const lit = quoteLiteral(`%${valueRaw}%`);
      if (!lit) return null;
      return `LIKE ${lit}`;
    }
    case "in": {
      const parts = valueRaw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const lits = parts.map((p) => quoteLiteral(p));
      if (lits.some((l) => l === null) || lits.length === 0) return null;
      return `IN (${lits.join(", ")})`;
    }
  }
}

const opMap: Record<"gt" | "gte" | "lt" | "lte", string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

/**
 * Resolve a filter `field` to a SQL expression, given the active scope and
 * the dimensions that have already been added (so we can reuse their joins).
 */
function resolveFilterField(
  field: string,
  scope: ScopeKey,
): { expr: string; extraJoins: string[] } | null {
  if (isDimensionKey(field)) {
    const dim = DIMENSIONS[field];
    if (!(dim.scopes as readonly ScopeKey[]).includes(scope)) return null;
    return {
      expr: dim.expr,
      extraJoins: getExtraJoins(dim),
    };
  }
  /**
   * Allow Table.column when it lives in the scope's FROM/JOIN block.
   * We only accept conservative patterns to keep guard surface small.
   */
  if (/^[A-Za-z_][\w]*\.[A-Za-z_][\w]*$/.test(field)) {
    const fromSql = SCOPES[scope].fromSql;
    const tableLike = field.split(".")[0];
    /**
     * Use a simple substring check on the FROM block; if the table doesn't
     * appear, refuse the filter so we don't generate broken SQL.
     */
    if (fromSql.includes(tableLike)) {
      return { expr: field, extraJoins: [] };
    }
  }
  return null;
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function getExtraJoins(dim: (typeof DIMENSIONS)[DimensionKey]): string[] {
  if ("extraJoins" in dim && dim.extraJoins) {
    return [...dim.extraJoins];
  }
  return [];
}

function isTopNAllowed(
  metricKey: MetricKey,
  dimKeys: DimensionKey[],
): boolean {
  if (dimKeys.length === 0) return false;
  // Pure time buckets shouldn't be truncated by a top-N limit.
  const onlyTimeBuckets = dimKeys.every((k) =>
    /(month|year)$/.test(k as string),
  );
  return !onlyTimeBuckets;
}

export function composeSql(intent: Intent): ComposedSql | null {
  const trace: string[] = [];

  if (!isMetricKey(intent.metric)) {
    trace.push(`metric "${intent.metric}" not in registry → freeform fallback`);
    return null;
  }
  const metric = METRICS[intent.metric];
  const scope = metric.scope;
  const scopeDef = SCOPES[scope];

  // ------------------------------------------------------------ dimensions
  const dimKeys: DimensionKey[] = [];
  for (const raw of intent.dimensions ?? []) {
    if (!isDimensionKey(raw)) {
      trace.push(`dimension "${raw}" not in registry → freeform fallback`);
      return null;
    }
    const dim = DIMENSIONS[raw];
    if (!(dim.scopes as readonly ScopeKey[]).includes(scope)) {
      trace.push(
        `dimension "${raw}" not compatible with metric scope "${scope}" → freeform fallback`,
      );
      return null;
    }
    dimKeys.push(raw);
  }
  trace.push(`metric=${intent.metric} scope=${scope} dims=[${dimKeys.join(", ")}]`);

  // -------------------------------------------------------------- filters
  const filterClauses: string[] = [];
  const filterJoins: string[] = [];
  for (const f of intent.filters ?? []) {
    const resolved = resolveFilterField(f.field, scope);
    if (!resolved) {
      trace.push(`filter field "${f.field}" not resolvable in scope "${scope}" → freeform fallback`);
      return null;
    }
    const opSql = operatorSql(f.op, f.value);
    if (!opSql) {
      trace.push(`filter value "${f.value}" rejected by safety regex → freeform fallback`);
      return null;
    }
    filterClauses.push(`${resolved.expr} ${opSql}`);
    filterJoins.push(...resolved.extraJoins);
  }

  // ---------------------------------------------------------------- period
  let periodClause: string | null = null;
  if (intent.period && intent.period !== "all_time") {
    if (!isPeriodKey(intent.period)) {
      trace.push(`period "${intent.period}" not in registry → freeform fallback`);
      return null;
    }
    if (!scopeDef.dateColumn) {
      trace.push(`metric scope "${scope}" has no date column → ignoring period`);
    } else {
      const built = PERIODS[intent.period].build(scopeDef.dateColumn);
      /**
       * The composer inlines period params for now (rather than threading
       * them through better-sqlite3 prepared statements) so its output is a
       * single self-contained SQL string. We coerce values to ISO date
       * strings or numerics so this is safe.
       */
      let inlined = built.sql;
      for (const v of built.params) {
        const lit =
          typeof v === "number"
            ? String(v)
            : typeof v === "string"
              ? quoteLiteral(v)
              : null;
        if (!lit) {
          trace.push("period param failed safe quoting → freeform fallback");
          return null;
        }
        inlined = inlined.replace("?", lit);
      }
      periodClause = inlined;
    }
  }

  // ----------------------------------------------------------------- joins
  const joins: string[] = uniq([
    ...dimKeys.flatMap((k) => getExtraJoins(DIMENSIONS[k])),
    ...filterJoins,
  ]);

  // --------------------------------------------------------------- SELECT
  const selectParts: string[] = [];
  const groupByPositions: number[] = [];
  for (let i = 0; i < dimKeys.length; i += 1) {
    const dim = DIMENSIONS[dimKeys[i]];
    selectParts.push(`${dim.expr} AS ${dim.alias}`);
    groupByPositions.push(i + 1);
  }
  selectParts.push(`${metric.expr} AS ${metric.alias}`);

  const where = [
    ...metric.filters,
    ...filterClauses,
    periodClause,
  ].filter((x): x is string => Boolean(x));

  const lines: string[] = [];
  lines.push(`SELECT ${selectParts.join(",\n       ")}`);
  lines.push(`FROM ${scopeDef.fromSql}`);
  for (const j of joins) lines.push(j);
  if (where.length > 0) {
    lines.push(`WHERE ${where.join("\n  AND ")}`);
  }
  if (groupByPositions.length > 0) {
    lines.push(`GROUP BY ${groupByPositions.join(", ")}`);
    /**
     * Drop NULL bucket rows for time dimensions so charts aren't anchored
     * by a leading "no date" bar. For non-time dims the COALESCE-style
     * expressions in the registry already produce 'Unknown' instead of
     * NULL, so we only need this guard for month/year.
     */
    const timeBuckets = dimKeys.filter((k) => /(month|year)$/.test(k));
    if (timeBuckets.length > 0) {
      lines.push(
        `HAVING ${timeBuckets
          .map((k) => `${DIMENSIONS[k].alias} IS NOT NULL`)
          .join(" AND ")}`,
      );
    }
  }

  // ------------------------------------------------------------- ORDER/LIMIT
  if (groupByPositions.length > 0) {
    const onlyTime = dimKeys.every((k) => /(month|year)$/.test(k));
    if (onlyTime) {
      lines.push(`ORDER BY ${dimKeys.map((k) => DIMENSIONS[k].alias).join(", ")}`);
    } else {
      lines.push(`ORDER BY ${metric.alias} DESC`);
    }
  }

  if (intent.limit && isTopNAllowed(intent.metric, dimKeys)) {
    lines.push(`LIMIT ${Math.min(Math.max(intent.limit, 1), 500)}`);
  }

  const sql = lines.join("\n");
  trace.push("composed deterministically from registry");
  return { sql, params: [], trace };
}
