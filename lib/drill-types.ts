/**
 * Shared drill-down request schema (client + server).
 *
 * Lives separately from `lib/drill-queries.ts` so client components can import
 * the types without dragging in `better-sqlite3`. The zod schema is the
 * source of truth — derive the TS type from it.
 */

import { z } from "zod";
import type { DateRange } from "@/lib/sql-constants";

const dateRangeSchema = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
}) satisfies z.ZodType<DateRange>;

export const drillRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("invoicesForMonth"),
    range: dateRangeSchema,
    month: z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM"),
    invoiceType: z.enum(["in", "wo", "rl", "any"]).optional(),
  }),
  z.object({
    kind: z.literal("invoicesByType"),
    range: dateRangeSchema,
    invoiceType: z.string().min(1).max(8),
  }),
  z.object({
    kind: z.literal("invoicesForLocation"),
    range: dateRangeSchema,
    location: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("invoicesForJurisdiction"),
    range: dateRangeSchema,
    jurisdiction: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("unitsByStatus"),
    stockStatus: z.string().min(1).max(64),
  }),
  z.object({
    kind: z.literal("partDetail"),
    partNo: z.string().min(1).max(64),
    range: dateRangeSchema,
  }),
  z.object({
    kind: z.literal("partsByManufacturer"),
    manufacturer: z.string().min(1).max(200),
    range: dateRangeSchema,
  }),
  z.object({
    kind: z.literal("openWosByStatus"),
    status: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("openWosForAging"),
    bucket: z.enum(["0-7 days", "8-30 days", "31-90 days", "90+ days"]),
  }),
  z.object({
    kind: z.literal("wosForAdherence"),
    range: dateRangeSchema,
    bucket: z.enum(["On time", "Late", "Missing data"]),
  }),
  z.object({
    kind: z.literal("invoiceDetail"),
    invoiceDocId: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("segmentsForWo"),
    invoiceDocId: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("paymentsByMethod"),
    range: dateRangeSchema,
    method: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("paymentsForMonth"),
    range: dateRangeSchema,
    month: z.string().regex(/^\d{4}-\d{2}$/),
  }),
  z.object({
    kind: z.literal("invoicesForSalesperson"),
    range: dateRangeSchema,
    salesPersonName: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("invoicesForQuoteStatus"),
    range: dateRangeSchema,
    quoteStatus: z.string().min(1).max(64),
  }),
  z.object({
    kind: z.literal("unitsByCategory"),
    category: z.string().min(1).max(200),
  }),
  z.object({
    kind: z.literal("unitsByCondition"),
    condition: z.enum(["New", "Used"]),
  }),
  z.object({
    kind: z.literal("unitsByAgingBucket"),
    bucket: z.enum(["0-30", "31-90", "91-180", "180+"]),
  }),
  z.object({
    kind: z.literal("tradeInsForMonth"),
    range: dateRangeSchema,
    month: z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM"),
  }),
  z.object({
    kind: z.literal("decliningCustomers"),
  }),
  z.object({
    kind: z.literal("dormantCustomers"),
    sinceDays: z.number().int().min(1).max(3650).optional(),
  }),
  z.object({
    kind: z.literal("contactCompleteness"),
    bucket: z.enum([
      "no_contacts",
      "missing_email",
      "missing_phone",
      "complete",
    ]),
  }),
  z.object({
    kind: z.literal("receivablesByCoverage"),
    range: dateRangeSchema,
    bucket: z.enum(["with_ar", "paid_in_full"]),
  }),
  z.object({
    kind: z.literal("postedStandardInvoicesInRange"),
    range: dateRangeSchema,
  }),
  z.object({
    kind: z.literal("allOpenWos"),
  }),
  z.object({
    kind: z.literal("allInStockUnits"),
  }),
  z.object({
    kind: z.literal("topArCustomersDrill"),
    range: dateRangeSchema,
  }),
]);

export type DrillRequest = z.infer<typeof drillRequestSchema>;
export type DrillKind = DrillRequest["kind"];

export type DrillKpi = { label: string; value: string; hint?: string };

export type DrillResponse =
  | { ok: true; rows: Record<string, unknown>[]; kpis?: DrillKpi[] }
  | { ok: false; error: string };
