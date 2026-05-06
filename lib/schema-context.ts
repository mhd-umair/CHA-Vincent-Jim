import { GENERATED_SCHEMA_TEXT } from "@/lib/generated-schema";
import { renderFewShotsForPrompt } from "@/lib/few-shots";
import { getRegistrySummary } from "@/lib/metrics-registry";

const BUSINESS_RULES = `
## Perseus Equipment — analytics rules (authoritative)

- Dates are mostly stored as TEXT in timestamp-like formats; use SQLite date functions carefully (e.g. substr, strftime) and prefer InvoiceHeader.ActivityDate for sales timing when available.
- **Revenue / sales totals:** use InvoiceHeader and restrict to posted statuses: Status IN ('finalized', 'archived') (case-insensitive match is safer: lower(Status) IN ('finalized','archived')).
- **Exclude non-posted** quotes/drafts where appropriate: Status may include finalized, archived, voided, quote, committed, draft — do not sum voided or draft for revenue unless the user explicitly asks.
- **Invoice types:** InvoiceType values include 'in' (standard invoice), 'wo' (work order), 'rl' (rental). Default revenue questions usually mean standard sales ('in') unless the user asks for all types.
- **Joins:** InvoiceDetail links to InvoiceHeader via InvoiceDocId (verify column names in schema). SalePart links sold parts to invoice lines.
- **Customer names** are anonymized but still treat results as sensitive.
- Always include a reasonable LIMIT on large listings; the server will cap LIMIT if missing.
- Prefer clear column aliases (AS revenue, AS month) for charting.
`.trim();

export function getSchemaContextForLlm(): string {
  return `${BUSINESS_RULES}

---

${getRegistrySummary()}

---

${GENERATED_SCHEMA_TEXT}`;
}

export function buildFreeformPrompt(input: {
  history: string;
  intentContext?: string;
  drillContext?: string;
}): string {
  const intent = input.intentContext
    ? `\n\nStructured intent from the first pass (use as guidance, but correct it if it conflicts with the user's words):\n${input.intentContext}\n`
    : "";
  const drill = input.drillContext
    ? `\n\nAdditional drill-down context from UI (use to narrow the query):\n${input.drillContext}\n`
    : "";
  return `You are an analytics copilot for a dealership SQLite warehouse.

${getSchemaContextForLlm()}

---

${renderFewShotsForPrompt()}

---

Conversation so far:
${input.history}
${intent}
${drill}

Return ONE SELECT query for SQLite that answers the latest user intent.
Use only tables and columns that exist in the schema excerpt.
Follow the business rules for revenue and statuses unless the user clearly overrides.
If the user's words map to a registered metric/dimension, copy the metric's meaning.
Prefer the reference SQL examples for joins, statuses, aliases, and date bucketing.

For chart hints:
- time series → type line or area, set xField to the time bucket column, yFields to measures.
- one category + one measure (≤6 categories, share of whole) → pie is allowed; otherwise bar.
- two numeric measures → scatter with yFields holding both column names.
- wide / many columns → type table.

Respond with JSON matching the schema (sql, chart, summary, drillDownPrompts).`;
}
