import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { buildFreeformPrompt } from "@/lib/schema-context";
import { guardAndNormalizeSql } from "@/lib/sql-guard";
import { runSelect } from "@/lib/db";
import { chartSpecSchema, resolveChartSpec, type ChartSpecResolved } from "@/lib/chart-spec";
import { composeSql } from "@/lib/intent-compose";
import {
  describeIntent,
  extractIntent,
  type ExploreMessage,
  type Intent,
} from "@/lib/intent";

export type { ExploreMessage } from "@/lib/intent";

const nlObjectSchema = z.object({
  sql: z.string().describe("Single SQLite SELECT only, no comments-only blocks."),
  chart: chartSpecSchema.describe("Visualization hint; server may adjust based on row shape."),
  summary: z
    .string()
    .describe("2-4 sentences for a dealership manager; plain English; no raw SQL."),
  drillDownPrompts: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("Short follow-up questions the user might tap next."),
});

export type ExploreSuccess = {
  ok: true;
  sql: string;
  rows: Record<string, unknown>[];
  chart: ChartSpecResolved;
  summary: string;
  drillDownPrompts: string[];
  interpretation: Intent;
  interpretationLabel: string;
  source: "composed" | "freeform";
  trace: string[];
};

export type ExploreError = {
  ok: false;
  error: string;
};

export type ExploreResult = ExploreSuccess | ExploreError;

const modelName = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildHistory(messages: ExploreMessage[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
}

async function runFreeformSqlGeneration(input: {
  messages: ExploreMessage[];
  intent: Intent;
  drillContext?: string;
}) {
  const { object } = await generateObject({
    model: openai(modelName),
    schema: nlObjectSchema,
    prompt: buildFreeformPrompt({
      history: buildHistory(input.messages),
      intentContext: JSON.stringify(input.intent, null, 2),
      drillContext: input.drillContext,
    }),
    temperature: 0.1,
  });
  return object;
}

function buildComposedSummary(
  intent: Intent,
  rows: Record<string, unknown>[],
): string {
  const label = describeIntent(intent);
  if (rows.length === 0) {
    return `I interpreted this as ${label}. The query returned no rows.`;
  }
  const sample = rows[0];
  const keys = Object.keys(sample).slice(0, 4);
  const preview = keys
    .map((k) => `${k}: ${String(sample[k])}`)
    .join(", ");
  return `I interpreted this as ${label}. Returned ${rows.length} row${rows.length === 1 ? "" : "s"}; top result: ${preview}.`;
}

export async function runNlExplore(
  messages: ExploreMessage[],
  drillContext?: string,
): Promise<ExploreResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY is not configured on the server." };
  }

  try {
    const intentResult = await extractIntent(messages, drillContext);
    if (!intentResult.ok) {
      return { ok: false, error: intentResult.error };
    }
    const intent = intentResult.intent;
    const interpretationLabel = describeIntent(intent);
    const trace: string[] = [`intent=${JSON.stringify(intent)}`];

    const composed = composeSql(intent);
    let sql: string;
    let chartHint = intent.chart;
    let summary: string | null = null;
    let drillDownPrompts = intent.drillDownPrompts;
    let source: ExploreSuccess["source"];

    if (composed) {
      sql = composed.sql;
      source = "composed";
      trace.push(...composed.trace);
    } else {
      trace.push("composer returned null; falling back to freeform SQL");
      const object = await runFreeformSqlGeneration({
        messages,
        intent,
        drillContext,
      });
      sql = object.sql;
      chartHint = object.chart;
      summary = object.summary;
      drillDownPrompts = object.drillDownPrompts;
      source = "freeform";
    }

    const guarded = guardAndNormalizeSql(sql);
    if (!guarded.ok) {
      return { ok: false, error: guarded.error };
    }

    const rows = runSelect<Record<string, unknown>>(guarded.sql);
    const chart = resolveChartSpec(chartHint, rows);
    const finalSummary = summary ?? buildComposedSummary(intent, rows);

    return {
      ok: true,
      sql: guarded.sql,
      rows,
      chart,
      summary: finalSummary,
      drillDownPrompts,
      interpretation: intent,
      interpretationLabel,
      source,
      trace,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
