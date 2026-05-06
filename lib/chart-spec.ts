import { z } from "zod";

export const chartSpecSchema = z.object({
  type: z.enum(["bar", "line", "area", "pie", "scatter", "table"]),
  title: z.string(),
  xField: z.string().optional(),
  yFields: z.array(z.string()).min(1).optional(),
  /** Optional third numeric field for scatter bubble size */
  sizeField: z.string().optional(),
  /** Human-readable label rendered on the X axis (e.g. "Month"). */
  xLabel: z.string().optional(),
  /** Human-readable label rendered on the Y axis (e.g. "Revenue (USD)"). */
  yLabel: z.string().optional(),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;

export type ChartSpecResolved = ChartSpec & { type: ChartSpec["type"] };

function pickNumericColumns(
  row: Record<string, unknown>,
  exclude: Set<string>,
): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (exclude.has(k)) continue;
    if (typeof v === "number") out.push(k);
  }
  return out;
}

function pickCategoryOrDate(
  row: Record<string, unknown>,
  exclude: Set<string>,
): string | undefined {
  for (const [k, v] of Object.entries(row)) {
    if (exclude.has(k)) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string" || typeof v === "number") {
      if (typeof v === "string" && /^\d{4}-\d{2}/.test(v)) return k;
      if (typeof v === "string") return k;
    }
  }
  return undefined;
}

function isLikelyTimeField(name: string, sample: unknown): boolean {
  const n = name.toLowerCase();
  if (/date|time|month|year|period/i.test(n)) return true;
  if (typeof sample === "string" && /^\d{4}-\d{2}/.test(sample)) return true;
  return false;
}

/**
 * Merge model chart hint with row shape heuristics (pie rules, wide → table).
 */
export function resolveChartSpec(
  hint: ChartSpec,
  rows: Record<string, unknown>[],
): ChartSpecResolved {
  if (rows.length === 0) {
    return { ...hint, type: "table" };
  }

  const first = rows[0];
  const keys = Object.keys(first);

  if (keys.length > 12) {
    return { ...hint, type: "table", title: hint.title || "Results" };
  }

  let xField = hint.xField && keys.includes(hint.xField) ? hint.xField : undefined;
  let yFields =
    hint.yFields?.filter((y) => keys.includes(y) && typeof first[y] === "number") ??
    [];

  if (!xField) {
    const timeKey = keys.find((k) => isLikelyTimeField(k, first[k]));
    xField = timeKey ?? pickCategoryOrDate(first, new Set(yFields));
  }

  if (yFields.length === 0) {
    yFields = pickNumericColumns(first, new Set(xField ? [xField] : [])).slice(0, 3);
  }

  const xLooksLikeTime = xField ? isLikelyTimeField(xField, first[xField]) : false;
  let type = hint.type;

  if (type === "pie" && rows.length > 6) {
    type = "bar";
  }

  if (type === "pie" && yFields.length !== 1) {
    type = "bar";
  }

  if (type === "scatter") {
    if (yFields.length < 2) type = "bar";
  }

  if (xLooksLikeTime && type === "pie") {
    type = "line";
  }

  if (xLooksLikeTime && type === "bar" && yFields.length >= 1) {
    type = "line";
  }

  if (!xField || yFields.length === 0) {
    type = "table";
  }

  return {
    ...hint,
    type,
    xField,
    yFields: yFields.length ? yFields : undefined,
  };
}
