/**
 * Step 1 of the hybrid NL pipeline: ask the LLM to convert the user's
 * question into a structured intent object that names a metric, optional
 * dimensions, an optional period, and free-form value filters.
 *
 * The LLM never sees raw SQL here — only the catalog summary from
 * `metrics-registry.ts`. The downstream composer (`intent-compose.ts`) takes
 * the result and either builds SQL deterministically or returns `null` to
 * trigger the freeform fallback in `nl-query.ts`.
 */

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getRegistrySummary } from "@/lib/metrics-registry";
import { chartSpecSchema } from "@/lib/chart-spec";

/** Comparison operator the LLM can pick when extracting a value filter. */
export const filterOpSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "in",
]);

export type FilterOp = z.infer<typeof filterOpSchema>;

export const intentSchema = z.object({
  metric: z
    .string()
    .describe(
      "Metric KEY from the registry, or 'custom' when nothing fits. Lowercase snake_case.",
    ),
  dimensions: z
    .array(z.string())
    .max(2)
    .default([])
    .describe(
      "0-2 dimension keys to GROUP BY. Empty array = single aggregate row.",
    ),
  period: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "Period KEY from the registry, or null if no time bound was implied.",
    ),
  filters: z
    .array(
      z.object({
        field: z
          .string()
          .describe(
            "Dimension key, metric key, or fully-qualified column (Table.column).",
          ),
        op: filterOpSchema,
        value: z
          .string()
          .describe(
            "Literal value as a string. Numbers parsed downstream. Use commas for `in`.",
          ),
      }),
    )
    .default([])
    .describe(
      "Equality / range filters extracted from the question (e.g., manufacturer=Caterpillar, status=finalized).",
    ),
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .nullable()
    .default(null)
    .describe(
      "Top-N limit when the user asked for ranking. Null when listing everything.",
    ),
  comparison: z
    .enum(["none", "mom", "yoy", "prev_period"])
    .default("none")
    .describe("Period-over-period comparison hint, or 'none'."),
  chart: chartSpecSchema.describe(
    "Visualization hint, may be overridden by row-shape heuristics.",
  ),
  rationale: z
    .string()
    .describe(
      "One short sentence in the user's vocabulary describing what we're answering.",
    ),
  drillDownPrompts: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("Short follow-up questions a manager might tap next."),
});

export type Intent = z.infer<typeof intentSchema>;

export type ExploreMessage = { role: "user" | "assistant"; content: string };

const modelName = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildIntentPrompt(
  messages: ExploreMessage[],
  drillContext?: string,
): string {
  const history = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
  const drill = drillContext
    ? `\n\nDrill-down context from the UI (use to narrow the intent):\n${drillContext}\n`
    : "";
  return `You are an analytics interpreter for a heavy-equipment dealership BI tool.

Your job: turn the user's latest message into a structured intent that picks
from the registry below. Do NOT write SQL.

If a registered metric matches (after considering aliases), use that key.
Only return \`metric: 'custom'\` when no registered metric is plausible.

For dimensions: pick 0-2 keys that make sense with the chosen metric's scope
(see "scopes:" in each dimension entry). For pure totals, return [].

For the period: pick a single key when the user implies a window
("last quarter", "this year"). Return null when the user asks an all-time
question.

For filters: extract literal value-level conditions ("for Caterpillar",
"finalized only"). Use a registered dimension key as field when possible
(e.g., manufacturer, status); fall back to a fully-qualified column.

For chart: pick the type that best matches (line for trend, bar for
ranking, pie only for ≤6 share-of-whole categories, table when shape is
wide). Provide a short title.

Drill-down prompts: 2-4 short follow-ups the user might want next.

${getRegistrySummary()}

---

Conversation so far:
${history}
${drill}

Return JSON matching the schema.`;
}

export type IntentResult =
  | { ok: true; intent: Intent }
  | { ok: false; error: string };

export async function extractIntent(
  messages: ExploreMessage[],
  drillContext?: string,
): Promise<IntentResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY is not configured on the server." };
  }
  try {
    const { object } = await generateObject({
      model: openai(modelName),
      schema: intentSchema,
      prompt: buildIntentPrompt(messages, drillContext),
      temperature: 0.1,
    });
    return { ok: true, intent: object };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Intent extraction failed: ${msg}` };
  }
}

/**
 * One-line human summary of an intent, used by the UI confirmation chip.
 *
 *   intent { metric: 'revenue', dimensions: ['customer'], period: 'last_quarter', limit: 10 }
 *   -> "Top 10 customers by revenue (last quarter)"
 */
export function describeIntent(intent: Intent): string {
  const parts: string[] = [];
  if (intent.limit) {
    parts.push(`Top ${intent.limit}`);
  }
  if (intent.dimensions.length > 0) {
    parts.push(intent.dimensions.join(", "));
    parts.push("by");
  }
  parts.push(intent.metric === "custom" ? "custom metric" : intent.metric);
  if (intent.filters.length > 0) {
    const f = intent.filters
      .map((x) => `${x.field} ${x.op} "${x.value}"`)
      .join(", ");
    parts.push(`where ${f}`);
  }
  if (intent.period) {
    parts.push(`(${intent.period.replace(/_/g, " ")})`);
  }
  if (intent.comparison && intent.comparison !== "none") {
    parts.push(`vs ${intent.comparison.replace(/_/g, " ")}`);
  }
  return parts.join(" ");
}
