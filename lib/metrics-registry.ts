/**
 * Semantic layer for the natural-language pipeline. Each metric, dimension,
 * and named period maps human vocabulary to deterministic SQL fragments. The
 * intent extractor sees a compact summary; the SQL composer in
 * `lib/intent-compose.ts` consumes the full definitions to build a single
 * `SELECT`.
 *
 * Source-of-truth definitions for revenue and posted-status filters live in
 * `lib/sql-constants.ts`. The registry re-uses those exact strings so the
 * dashboards and the NL pipeline can never drift.
 */

import {
  POSTED_SALES,
  POSTED_ANY_TYPE,
} from "@/lib/sql-constants";

/**
 * Logical query "shape" — defines the FROM/JOIN block + the date column used
 * for time filtering. Every metric belongs to exactly one scope; dimensions
 * declare which scopes they work with.
 */
export type ScopeKey =
  | "invoice"            // InvoiceHeader ih
  | "invoice_with_parts" // ih JOIN InvoiceDetail id JOIN SalePart sp
  | "payment"            // Payment p
  | "tax"                // SalesTax st JOIN InvoiceHeader ih
  | "wip"                // WorkInProgress wip (LEFT JOIN AppUser au)
  | "unit_static"        // UnitBase ub (no date)
  | "customer_static";   // Customer c (no date)

export type Scope = {
  description: string;
  /** raw FROM ... JOIN ... block, no leading FROM keyword */
  fromSql: string;
  /** column to apply period/date filters against, or null for static scopes */
  dateColumn: string | null;
};

export const SCOPES: Record<ScopeKey, Scope> = {
  invoice: {
    description: "InvoiceHeader rollups",
    fromSql: "InvoiceHeader ih",
    dateColumn: "ih.ActivityDate",
  },
  invoice_with_parts: {
    description: "Invoice line revenue at the part level",
    fromSql:
      "SalePart sp JOIN InvoiceDetail id ON id.ItemId = sp.ItemId JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId",
    dateColumn: "ih.ActivityDate",
  },
  payment: {
    description: "Payment activity",
    fromSql: "Payment p",
    dateColumn: "p.EntDate",
  },
  tax: {
    description: "Sales tax keyed off invoices",
    fromSql:
      "SalesTax st JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId",
    dateColumn: "ih.ActivityDate",
  },
  wip: {
    description: "Work-in-progress labor entries",
    fromSql:
      "WorkInProgress wip LEFT JOIN AppUser au ON au.AppUserId = wip.TechId",
    dateColumn: "wip.EntDate",
  },
  unit_static: {
    description: "Unit inventory snapshot (no date filter)",
    fromSql: "UnitBase ub",
    dateColumn: null,
  },
  customer_static: {
    description: "Customer master snapshot (no date filter)",
    fromSql: "Customer c",
    dateColumn: null,
  },
};

export type Metric = {
  description: string;
  aliases: readonly string[];
  /** The aggregate SELECT expression, e.g. SUM(ih.TotalInvoice). */
  expr: string;
  /** Default column alias when this metric appears in a SELECT list. */
  alias: string;
  /** Logical scope (controls FROM/JOIN and the date column). */
  scope: ScopeKey;
  /** Always-on WHERE clauses (e.g. POSTED_SALES). */
  filters: readonly string[];
  /** Suggested unit label for chart axes. */
  unit?: string;
};

export const METRICS = {
  revenue: {
    description:
      "Posted standard-invoice revenue (Status finalized/archived, type 'in').",
    aliases: ["sales", "billings", "top line", "gross sales", "income"],
    expr: "SUM(ih.TotalInvoice)",
    alias: "revenue",
    scope: "invoice",
    filters: [POSTED_SALES],
    unit: "USD",
  },
  revenue_any_type: {
    description:
      "Posted revenue across all invoice types (sales, work orders, rentals).",
    aliases: ["all revenue", "total revenue", "gross revenue any type"],
    expr: "SUM(ih.TotalInvoice)",
    alias: "revenue",
    scope: "invoice",
    filters: [POSTED_ANY_TYPE],
    unit: "USD",
  },
  invoice_count: {
    description: "Count of posted standard invoices.",
    aliases: ["invoices", "number of invoices", "deals", "transactions"],
    expr: "COUNT(*)",
    alias: "invoices",
    scope: "invoice",
    filters: [POSTED_SALES],
  },
  avg_invoice: {
    description: "Average posted standard-invoice amount.",
    aliases: ["average invoice", "average ticket", "average sale"],
    expr: "ROUND(AVG(ih.TotalInvoice), 2)",
    alias: "avg_invoice",
    scope: "invoice",
    filters: [POSTED_SALES],
    unit: "USD",
  },
  total_discounts: {
    description: "Total discount amount on posted standard invoices.",
    aliases: ["discounts", "promo amount", "discounts given"],
    expr: "SUM(ih.DiscountAmt)",
    alias: "discounts",
    scope: "invoice",
    filters: [POSTED_SALES],
    unit: "USD",
  },
  wo_revenue: {
    description: "Posted work-order revenue (type 'wo').",
    aliases: ["service revenue", "work order revenue", "shop revenue"],
    expr: "SUM(ih.TotalInvoice)",
    alias: "revenue",
    scope: "invoice",
    filters: [
      "lower(ih.InvoiceType) = 'wo' AND lower(ih.Status) IN ('finalized', 'archived')",
    ],
    unit: "USD",
  },
  parts_revenue: {
    description: "Parts line-item revenue on posted standard invoices.",
    aliases: ["parts sales", "parts billings", "parts net"],
    expr: "SUM(sp.NetExt)",
    alias: "parts_revenue",
    scope: "invoice_with_parts",
    filters: [POSTED_SALES],
    unit: "USD",
  },
  parts_qty: {
    description: "Total quantity of parts sold on posted standard invoices.",
    aliases: ["parts quantity", "units sold", "parts count"],
    expr: "SUM(sp.Qty)",
    alias: "parts_qty",
    scope: "invoice_with_parts",
    filters: [POSTED_SALES],
  },
  total_payments: {
    description: "Total payment amount collected (active payments).",
    aliases: ["payments", "cash collected", "receipts"],
    expr: "SUM(p.Amount)",
    alias: "amount",
    scope: "payment",
    filters: ["p.IsActive = 1"],
    unit: "USD",
  },
  total_tax: {
    description: "Total sales tax on posted invoices (any type).",
    aliases: ["tax", "sales tax", "tax collected"],
    expr: "SUM(st.TotalTax)",
    alias: "tax",
    scope: "tax",
    filters: [POSTED_ANY_TYPE],
    unit: "USD",
  },
  labor_hours: {
    description: "Logged labor hours from active WIP entries.",
    aliases: ["hours", "labor", "tech hours", "billable hours"],
    expr: "SUM(wip.ElapsedHours)",
    alias: "hours",
    scope: "wip",
    filters: ["wip.IsActive = 1"],
    unit: "hours",
  },
  units_in_stock: {
    description: "Active units currently on the lot.",
    aliases: ["units", "inventory units", "stock", "fleet size"],
    expr: "COUNT(*)",
    alias: "units",
    scope: "unit_static",
    filters: ["ub.IsActive = 1"],
  },
  active_customers: {
    description: "Customers flagged active in the master file.",
    aliases: ["customers", "active accounts", "account count"],
    expr: "COUNT(*)",
    alias: "customers",
    scope: "customer_static",
    filters: ["c.IsActive = 1"],
  },
} as const satisfies Record<string, Metric>;

export type MetricKey = keyof typeof METRICS;

export type Dimension = {
  description: string;
  aliases: readonly string[];
  /** SELECT expression for the dimension column. */
  expr: string;
  /** alias used in SELECT and GROUP BY */
  alias: string;
  /** Extra joins this dimension contributes (added once on top of scope). */
  extraJoins?: readonly string[];
  /** Scopes this dimension is compatible with. */
  scopes: readonly ScopeKey[];
};

export const DIMENSIONS = {
  customer: {
    description: "Customer name as recorded on the invoice.",
    aliases: ["account", "client", "buyer"],
    expr: "ih.CustomerName",
    alias: "customer",
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  month: {
    description: "Calendar month bucket (YYYY-MM).",
    aliases: ["monthly", "by month"],
    expr: "strftime('%Y-%m', ih.ActivityDate)",
    alias: "month",
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  year: {
    description: "Calendar year bucket (YYYY).",
    aliases: ["annual", "yearly", "by year"],
    expr: "strftime('%Y', ih.ActivityDate)",
    alias: "year",
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  payment_month: {
    description: "Month bucket for payment activity.",
    aliases: ["monthly payments", "by month payments"],
    expr: "strftime('%Y-%m', p.EntDate)",
    alias: "month",
    scopes: ["payment"],
  },
  wip_month: {
    description: "Month bucket for WIP labor entries.",
    aliases: ["monthly labor", "by month labor"],
    expr: "strftime('%Y-%m', wip.EntDate)",
    alias: "month",
    scopes: ["wip"],
  },
  salesperson: {
    description: "Sales rep name on the invoice (Unassigned if blank).",
    aliases: ["sales rep", "rep", "seller", "ae"],
    expr:
      "CASE WHEN ih.SalesPersonName IS NULL OR trim(ih.SalesPersonName) = '' THEN 'Unassigned' ELSE ih.SalesPersonName END",
    alias: "salesperson",
    scopes: ["invoice", "invoice_with_parts"],
  },
  invoice_type: {
    description: "Invoice type code (in / wo / rl).",
    aliases: ["type", "invoice kind"],
    expr: "ih.InvoiceType",
    alias: "invoice_type",
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  status: {
    description: "Invoice status (finalized, archived, voided, quote, ...).",
    aliases: ["state", "invoice status"],
    expr:
      "CASE WHEN ih.Status IS NULL OR trim(ih.Status) = '' THEN 'Unknown' ELSE lower(ih.Status) END",
    alias: "status",
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  location: {
    description: "Branch/location display name.",
    aliases: ["branch", "store", "site"],
    expr: "COALESCE(sl.DisplayText, 'Unknown')",
    alias: "location",
    extraJoins: [
      "LEFT JOIN SettingsLocation sl ON sl.LocationId = ih.LocationId",
    ],
    scopes: ["invoice", "invoice_with_parts", "tax"],
  },
  manufacturer: {
    description: "Part manufacturer (display text or MfgCode).",
    aliases: ["brand", "make", "vendor", "oem"],
    expr: "COALESCE(pm.DisplayText, sp.MfgCode, 'Unknown')",
    alias: "manufacturer",
    extraJoins: [
      "LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId",
    ],
    scopes: ["invoice_with_parts"],
  },
  product_line: {
    description: "Product line label, joined via the part manufacturer.",
    aliases: ["category", "line"],
    expr: "COALESCE(ppl.DisplayText, 'Unknown')",
    alias: "product_line",
    extraJoins: [
      "LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId",
      "LEFT JOIN PartProductLine ppl ON ppl.ProductLineId = pm.ProductLineId",
    ],
    scopes: ["invoice_with_parts"],
  },
  part: {
    description: "Part number (sp.PartNo).",
    aliases: ["sku", "part number"],
    expr: "sp.PartNo",
    alias: "part",
    scopes: ["invoice_with_parts"],
  },
  payment_method: {
    description: "Payment method display text.",
    aliases: ["pay method", "method", "tender"],
    expr: "COALESCE(pmth.DisplayText, p.PmtType, 'Unknown')",
    alias: "method",
    extraJoins: [
      "LEFT JOIN PaymentMethod pmth ON pmth.PaymentMethodId = p.PaymentMethodId",
    ],
    scopes: ["payment"],
  },
  tax_jurisdiction: {
    description: "Sales tax jurisdiction.",
    aliases: ["jurisdiction", "tax region"],
    expr:
      "COALESCE(NULLIF(trim(st.JurisdictionDisplayText), ''), 'Unknown')",
    alias: "jurisdiction",
    scopes: ["tax"],
  },
  technician: {
    description: "Technician name (UserName, full name, or Tech <id>).",
    aliases: ["tech", "mechanic", "service tech"],
    expr:
      "COALESCE(NULLIF(trim(au.UserName), ''), (au.FirstName || ' ' || au.LastName), 'Tech ' || wip.TechId)",
    alias: "technician",
    scopes: ["wip"],
  },
} as const satisfies Record<string, Dimension>;

export type DimensionKey = keyof typeof DIMENSIONS;

export type Period = {
  description: string;
  aliases: string[];
  /**
   * Build a SQL fragment + params that filters `dateCol` for this period.
   * Receives the metric/scope's date column so the same period can attach to
   * `ih.ActivityDate`, `p.EntDate`, or `wip.EntDate`.
   */
  build(dateCol: string): { sql: string; params: unknown[] };
};

function nowIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x.toISOString().slice(0, 10);
}

function endOfMonth(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return x.toISOString().slice(0, 10);
}

function quarterBounds(d: Date): { from: string; to: string } {
  const q = Math.floor(d.getMonth() / 3);
  const from = new Date(d.getFullYear(), q * 3, 1);
  const to = new Date(d.getFullYear(), q * 3 + 3, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export const PERIODS = {
  last_7_days: {
    description: "Trailing 7 days through today.",
    aliases: ["past week", "last week"],
    build: (col) => ({
      sql: `${col} >= ?`,
      params: [isoDaysAgo(7)],
    }),
  },
  last_30_days: {
    description: "Trailing 30 days through today.",
    aliases: ["past month", "last month rolling", "past 30 days"],
    build: (col) => ({
      sql: `${col} >= ?`,
      params: [isoDaysAgo(30)],
    }),
  },
  last_90_days: {
    description: "Trailing 90 days through today.",
    aliases: ["last quarter rolling", "past 90 days"],
    build: (col) => ({
      sql: `${col} >= ?`,
      params: [isoDaysAgo(90)],
    }),
  },
  this_month: {
    description: "First of the current month through today.",
    aliases: ["mtd", "month to date"],
    build: (col) => {
      const now = new Date();
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [startOfMonth(now), `${nowIso()} 23:59:59`],
      };
    },
  },
  last_month: {
    description: "Previous calendar month.",
    aliases: ["prior month"],
    build: (col) => {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [startOfMonth(prev), `${endOfMonth(prev)} 23:59:59`],
      };
    },
  },
  this_quarter: {
    description: "Current calendar quarter so far.",
    aliases: ["qtd", "quarter to date"],
    build: (col) => {
      const { from } = quarterBounds(new Date());
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [from, `${nowIso()} 23:59:59`],
      };
    },
  },
  last_quarter: {
    description: "Previous calendar quarter.",
    aliases: ["prior quarter"],
    build: (col) => {
      const now = new Date();
      const refMonth = now.getMonth() - 3;
      const ref = new Date(now.getFullYear(), refMonth, 15);
      const { from, to } = quarterBounds(ref);
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [from, `${to} 23:59:59`],
      };
    },
  },
  ytd: {
    description: "January 1 of the current year through today.",
    aliases: ["year to date", "this year"],
    build: (col) => {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [from, `${nowIso()} 23:59:59`],
      };
    },
  },
  last_year: {
    description: "Previous calendar year (Jan 1 - Dec 31).",
    aliases: ["prior year", "last calendar year"],
    build: (col) => {
      const y = new Date().getFullYear() - 1;
      return {
        sql: `${col} >= ? AND ${col} <= ?`,
        params: [`${y}-01-01`, `${y}-12-31 23:59:59`],
      };
    },
  },
  trailing_12_months: {
    description: "Trailing 365 days through today.",
    aliases: ["ttm", "last 12 months", "trailing year"],
    build: (col) => ({
      sql: `${col} >= ?`,
      params: [isoDaysAgo(365)],
    }),
  },
  all_time: {
    description: "No date filter.",
    aliases: ["lifetime", "ever", "since the beginning"],
    build: () => ({ sql: "1=1", params: [] }),
  },
} as const satisfies Record<string, Period>;

export type PeriodKey = keyof typeof PERIODS;

/**
 * Compact catalog summary for prompts. We give the LLM keys + aliases +
 * one-line descriptions only — never the SQL — so it can pick a name without
 * leaking dialect concerns into the user-facing flow.
 */
export function getRegistrySummary(): string {
  const lines: string[] = [];
  lines.push("## Metrics (pick one as `metric`)");
  for (const [key, m] of Object.entries(METRICS)) {
    const aliases = m.aliases.length ? ` _aliases: ${m.aliases.join(", ")}_` : "";
    lines.push(`- \`${key}\` — ${m.description}${aliases}`);
  }
  lines.push("");
  lines.push("## Dimensions (pick 0-2 as `dimensions`)");
  for (const [key, d] of Object.entries(DIMENSIONS)) {
    const aliases = d.aliases.length ? ` _aliases: ${d.aliases.join(", ")}_` : "";
    lines.push(
      `- \`${key}\` — ${d.description}${aliases} _scopes: ${d.scopes.join(", ")}_`,
    );
  }
  lines.push("");
  lines.push("## Periods (pick at most one as `period`, or null)");
  for (const [key, p] of Object.entries(PERIODS)) {
    const aliases = p.aliases.length ? ` _aliases: ${p.aliases.join(", ")}_` : "";
    lines.push(`- \`${key}\` — ${p.description}${aliases}`);
  }
  return lines.join("\n");
}

export function isMetricKey(k: string): k is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRICS, k);
}

export function isDimensionKey(k: string): k is DimensionKey {
  return Object.prototype.hasOwnProperty.call(DIMENSIONS, k);
}

export function isPeriodKey(k: string): k is PeriodKey {
  return Object.prototype.hasOwnProperty.call(PERIODS, k);
}
