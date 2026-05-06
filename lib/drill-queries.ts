/**
 * Server-only drill-down queries used by `app/api/drill/route.ts`. The shared
 * dashboards POST a discriminated `kind` plus safe params; we own SQL here so
 * nothing user-supplied ever reaches the database.
 *
 * All queries are parameterized via `runSelect`. We duplicate the WO status
 * fragments (instead of importing from `lib/service-queries.ts`) to keep that
 * module's helpers private.
 */

import { runSelect } from "@/lib/db";
import {
  POSTED_SALES,
  POSTED_ANY_TYPE,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";
import {
  getCustomersByContactBucket,
  getDecliningCustomers,
  getDormantCustomers,
  type ContactBucket,
} from "@/lib/customer-health-queries";
import type { DrillKpi } from "@/lib/drill-types";
import { getTopArCustomers } from "@/lib/finance-queries";

/** A WO is "open" when type=wo and not finalized/archived/voided. */
const OPEN_WO = `lower(ih.InvoiceType) = 'wo' AND lower(ih.Status) NOT IN ('finalized', 'archived', 'voided')`;
/** A WO is posted/closed when finalized or archived. */
const POSTED_WO = `lower(ih.InvoiceType) = 'wo' AND lower(ih.Status) IN ('finalized', 'archived')`;

const DEFAULT_LIMIT = 200;

export type InvoiceListRow = {
  InvoiceDocId: number;
  DocNo: string;
  InvoiceNo: string;
  ActivityDate: string;
  CustomerName: string;
  SalesPersonName: string;
  InvoiceType: string;
  Status: string;
  TotalInvoice: number;
};

function mapInvoiceListRow(r: Record<string, unknown>): InvoiceListRow {
  return {
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    InvoiceNo: String(r.InvoiceNo ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    SalesPersonName: String(r.SalesPersonName ?? ""),
    InvoiceType: String(r.InvoiceType ?? ""),
    Status: String(r.Status ?? ""),
    TotalInvoice: Number(r.TotalInvoice) || 0,
  };
}

/** Posted invoices that fall in `month` (YYYY-MM) within `range`. */
export function getInvoicesForMonth(
  range: DateRange,
  month: string,
  opts: { invoiceType?: "in" | "wo" | "rl" | "any" } = {},
): InvoiceListRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  const type = opts.invoiceType ?? "in";
  const typeClause =
    type === "any"
      ? POSTED_ANY_TYPE
      : `${POSTED_ANY_TYPE} AND lower(ih.InvoiceType) = ?`;
  const params: unknown[] = [month, ...df.params];
  if (type !== "any") params.push(type);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.SalesPersonName, ih.InvoiceType, ih.Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     WHERE strftime('%Y-%m', ih.ActivityDate) = ?
       AND ${df.sql}
       AND ${typeClause}
     ORDER BY ih.TotalInvoice DESC
     LIMIT ${DEFAULT_LIMIT}`,
    params,
  ).map(mapInvoiceListRow);
}

/** Posted standard sale invoices in the active date range (KPI drill). */
export function getPostedStandardInvoicesInRange(
  range: DateRange,
): InvoiceListRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.SalesPersonName, ih.InvoiceType, ih.Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES} AND ${df.sql}
     ORDER BY ih.ActivityDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    df.params,
  ).map(mapInvoiceListRow);
}

/** Posted invoices of a given type code (`in`, `wo`, `rl`, …). */
export function getInvoicesByType(
  range: DateRange,
  invoiceType: string,
): InvoiceListRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.SalesPersonName, ih.InvoiceType, ih.Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
       AND lower(ih.InvoiceType) = lower(?)
     ORDER BY ih.TotalInvoice DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [...df.params, invoiceType],
  ).map(mapInvoiceListRow);
}

/** Posted standard sales attributed to a branch/location DisplayText. */
export function getInvoicesForLocation(
  range: DateRange,
  locationName: string,
): InvoiceListRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  // Mirror the parent query in dashboard-queries.ts: COALESCE(sl.DisplayText, 'Unknown').
  // For 'Unknown' we match rows whose join didn't resolve (LocationId NULL or unmatched).
  const isUnknown = locationName === "Unknown";
  const filter = isUnknown
    ? `(sl.DisplayText IS NULL)`
    : `sl.DisplayText = ?`;
  const params: unknown[] = [...df.params];
  if (!isUnknown) params.push(locationName);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.SalesPersonName, ih.InvoiceType, ih.Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     LEFT JOIN SettingsLocation sl ON sl.LocationId = ih.LocationId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
       AND ${filter}
     ORDER BY ih.TotalInvoice DESC
     LIMIT ${DEFAULT_LIMIT}`,
    params,
  ).map(mapInvoiceListRow);
}

export type JurisdictionInvoiceRow = {
  InvoiceDocId: number;
  DocNo: string;
  InvoiceNo: string;
  ActivityDate: string;
  CustomerName: string;
  TaxableAmount: number;
  TotalTax: number;
  TotalInvoice: number;
};

/** Invoices contributing tax to a specific jurisdiction. */
export function getInvoicesForJurisdiction(
  range: DateRange,
  jurisdiction: string,
): JurisdictionInvoiceRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, st.TaxableAmount, st.TotalTax, ih.TotalInvoice
     FROM SalesTax st
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
       AND COALESCE(NULLIF(trim(st.JurisdictionDisplayText), ''), 'Unknown') = ?
     ORDER BY st.TotalTax DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [...df.params, jurisdiction],
  ).map((r) => ({
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    InvoiceNo: String(r.InvoiceNo ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    TaxableAmount: Number(r.TaxableAmount) || 0,
    TotalTax: Number(r.TotalTax) || 0,
    TotalInvoice: Number(r.TotalInvoice) || 0,
  }));
}

export type UnitDrillRow = {
  UnitId: number;
  StockNo: string;
  Make: string;
  Model: string;
  Year: number;
  BaseRetail: number;
  BaseCost: number;
  DateReceived: string | null;
  Condition: string;
  Category: string;
};

function mapUnitDrillRow(r: Record<string, unknown>): UnitDrillRow {
  return {
    UnitId: Number(r.UnitId),
    StockNo: String(r.StockNo ?? ""),
    Make: String(r.Make ?? ""),
    Model: String(r.Model ?? ""),
    Year: Number(r.Year) || 0,
    BaseRetail: Number(r.BaseRetail) || 0,
    BaseCost: Number(r.BaseCost) || 0,
    DateReceived: r.DateReceived ? String(r.DateReceived) : null,
    Condition: String(r.Condition ?? "Unknown"),
    Category: String(r.Category ?? "Unknown"),
  };
}

/**
 * Same in-stock predicate that powers the Equipment dashboard KPIs and
 * charts. We keep a copy here (rather than importing from
 * `lib/equipment-queries.ts`) so this module stays self-contained — same
 * pattern as the WO status fragments.
 */
const IS_IN_STOCK =
  "ub.IsActive = 1 AND lower(trim(ub.StockStatus)) NOT IN ('sold', 'voided', 'deleted', 'transferred')";

const UNIT_LIST_PROJECTION = `
  SELECT ub.UnitId, ub.StockNo, ub.Make, ub.Model, ub.Year,
         ub.BaseRetail, ub.BaseCost, ub.DateReceived,
         COALESCE(ucon.DisplayText, 'Unknown')      AS Condition,
         COALESCE(uc.DisplayText, 'Uncategorized')  AS Category
  FROM UnitBase ub
  LEFT JOIN UnitCategory  uc   ON uc.UnitCategoryId  = ub.UnitCategoryId
  LEFT JOIN UnitCondition ucon ON ucon.UnitConditionId = ub.UnitConditionId`;

/** All in-stock active units (same predicate as Equipment KPIs). */
export function getAllInStockUnits(): UnitDrillRow[] {
  return runSelect<Record<string, unknown>>(
    `${UNIT_LIST_PROJECTION}
     WHERE ${IS_IN_STOCK}
     ORDER BY ub.BaseRetail DESC
     LIMIT ${DEFAULT_LIMIT}`,
  ).map(mapUnitDrillRow);
}

/** Active units in a given StockStatus, joined to category/condition lookups. */
export function getUnitsByStatus(stockStatus: string): UnitDrillRow[] {
  return runSelect<Record<string, unknown>>(
    `${UNIT_LIST_PROJECTION}
     WHERE ub.IsActive = 1 AND ub.StockStatus = ?
     ORDER BY ub.DateReceived DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [stockStatus],
  ).map(mapUnitDrillRow);
}

/** In-stock units in a specific UnitCategory (matches the bar's label). */
export function getUnitsByCategoryDrill(category: string): UnitDrillRow[] {
  const isUncategorized = category === "Uncategorized";
  const filter = isUncategorized
    ? `(uc.DisplayText IS NULL)`
    : `uc.DisplayText = ?`;
  const params: unknown[] = [];
  if (!isUncategorized) params.push(category);
  return runSelect<Record<string, unknown>>(
    `${UNIT_LIST_PROJECTION}
     WHERE ${IS_IN_STOCK}
       AND ${filter}
     ORDER BY ub.BaseRetail DESC
     LIMIT ${DEFAULT_LIMIT}`,
    params,
  ).map(mapUnitDrillRow);
}

/** In-stock units split by `UnitCondition.IsNew` (`New` or `Used`). */
export function getUnitsByCondition(
  condition: "New" | "Used",
): UnitDrillRow[] {
  const isNew = condition === "New" ? 1 : 0;
  return runSelect<Record<string, unknown>>(
    `${UNIT_LIST_PROJECTION}
     WHERE ${IS_IN_STOCK}
       AND COALESCE(ucon.IsNew, 0) = ?
     ORDER BY ub.BaseRetail DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [isNew],
  ).map(mapUnitDrillRow);
}

/** In-stock units in an aging bucket measured from `DateReceived`. */
export function getUnitsByAgingBucket(
  bucket: "0-30" | "31-90" | "91-180" | "180+",
): UnitDrillRow[] {
  let bucketSql: string;
  switch (bucket) {
    case "0-30":
      bucketSql = `(julianday('now') - julianday(ub.DateReceived)) <= 30`;
      break;
    case "31-90":
      bucketSql = `(julianday('now') - julianday(ub.DateReceived)) > 30 AND (julianday('now') - julianday(ub.DateReceived)) <= 90`;
      break;
    case "91-180":
      bucketSql = `(julianday('now') - julianday(ub.DateReceived)) > 90 AND (julianday('now') - julianday(ub.DateReceived)) <= 180`;
      break;
    case "180+":
      bucketSql = `(julianday('now') - julianday(ub.DateReceived)) > 180`;
      break;
  }
  return runSelect<Record<string, unknown>>(
    `${UNIT_LIST_PROJECTION}
     WHERE ${IS_IN_STOCK}
       AND length(ub.DateReceived) >= 7
       AND ${bucketSql}
     ORDER BY ub.DateReceived ASC
     LIMIT ${DEFAULT_LIMIT}`,
  ).map(mapUnitDrillRow);
}

export type TradeInLineRow = {
  TradeDetailId: number;
  DocNo: string;
  ActivityDate: string;
  Description: string;
  Model: string;
  Retail: number;
  TradeValue: number;
};

/** Trade-in detail rows for a YYYY-MM month within `range`. */
export function getTradeInsForMonth(
  range: DateRange,
  month: string,
): TradeInLineRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT sut.TradeDetailId, ih.DocNo, ih.ActivityDate,
            sut.Description, sut.Model, sut.Retail, sut.TradeValue
     FROM SaleUnitTradeIn sut
     JOIN InvoiceDetail id ON id.ItemId = sut.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE}
       AND ${df.sql}
       AND strftime('%Y-%m', ih.ActivityDate) = ?
     ORDER BY ih.ActivityDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [...df.params, month],
  ).map((r) => ({
    TradeDetailId: Number(r.TradeDetailId),
    DocNo: String(r.DocNo ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    Description: String(r.Description ?? ""),
    Model: String(r.Model ?? ""),
    Retail: Number(r.Retail) || 0,
    TradeValue: Number(r.TradeValue) || 0,
  }));
}

export type PartHeaderRow = {
  PartId: number;
  PartNo: string;
  Description: string;
  PartStatus: string;
  PartType: string;
  MfgCode: string;
  Manufacturer: string;
  IsActive: number;
};

export function getPartByNo(partNo: string): PartHeaderRow | undefined {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT pm.PartId, pm.PartNo, pm.Description, pm.PartStatus, pm.PartType,
            pmfg.MfgCode AS MfgCode,
            COALESCE(pmfg.DisplayText, pmfg.MfgCode, 'Unknown') AS Manufacturer,
            pm.IsActive
     FROM PartMaster pm
     LEFT JOIN PartManufacturer pmfg ON pmfg.MfgId = pm.MfgId
     WHERE pm.PartNo = ?
     LIMIT 1`,
    [partNo],
  );
  const r = rows[0];
  if (!r) return undefined;
  return {
    PartId: Number(r.PartId),
    PartNo: String(r.PartNo ?? ""),
    Description: String(r.Description ?? ""),
    PartStatus: String(r.PartStatus ?? ""),
    PartType: String(r.PartType ?? ""),
    MfgCode: String(r.MfgCode ?? ""),
    Manufacturer: String(r.Manufacturer ?? "Unknown"),
    IsActive: Number(r.IsActive) || 0,
  };
}

export type PartInvoiceRow = {
  InvoiceDocId: number;
  DocNo: string;
  InvoiceNo: string;
  ActivityDate: string;
  CustomerName: string;
  Qty: number;
  UnitPrice: number;
  NetExt: number;
};

export function getInvoicesForPart(
  partNo: string,
  range: DateRange,
  limit = DEFAULT_LIMIT,
): PartInvoiceRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, sp.Qty, sp.UnitPrice, sp.NetExt
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE sp.PartNo = ? AND ${POSTED_SALES} AND ${df.sql}
     ORDER BY ih.ActivityDate DESC
     LIMIT ?`,
    [partNo, ...df.params, limit],
  ).map((r) => ({
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    InvoiceNo: String(r.InvoiceNo ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    Qty: Number(r.Qty) || 0,
    UnitPrice: Number(r.UnitPrice) || 0,
    NetExt: Number(r.NetExt) || 0,
  }));
}

export type ManufacturerPartRow = {
  PartNo: string;
  Description: string;
  revenue: number;
  qty: number;
};

export function getPartsByManufacturer(
  mfgName: string,
  range: DateRange,
  limit = 50,
): ManufacturerPartRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT sp.PartNo AS PartNo,
            MAX(sp.Description) AS Description,
            SUM(sp.NetExt) AS revenue,
            SUM(sp.Qty) AS qty
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId
     WHERE ${POSTED_SALES} AND ${df.sql}
       AND COALESCE(pm.DisplayText, sp.MfgCode, 'Unknown') = ?
     GROUP BY sp.PartNo
     ORDER BY revenue DESC
     LIMIT ?`,
    [...df.params, mfgName, limit],
  ).map((r) => ({
    PartNo: String(r.PartNo ?? ""),
    Description: String(r.Description ?? ""),
    revenue: Number(r.revenue) || 0,
    qty: Number(r.qty) || 0,
  }));
}

export type OpenWoRow = {
  InvoiceDocId: number;
  DocNo: string;
  CustomerName: string;
  WOTechId: number | null;
  Technician: string;
  EntDate: string;
  Status: string;
  TotalInvoice: number;
};

function mapOpenWoRow(r: Record<string, unknown>): OpenWoRow {
  return {
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    WOTechId: r.WOTechId == null ? null : Number(r.WOTechId),
    Technician: String(r.Technician ?? "Unassigned"),
    EntDate: String(r.EntDate ?? ""),
    Status: String(r.Status ?? "Unassigned"),
    TotalInvoice: Number(r.TotalInvoice) || 0,
  };
}

/** All open work orders (any status), newest first. */
export function getAllOpenWos(): OpenWoRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.CustomerName, ih.WOTechId,
            COALESCE(NULLIF(trim(au.UserName), ''),
                     trim(au.FirstName || ' ' || au.LastName),
                     'Unassigned') AS Technician,
            ih.EntDate,
            COALESCE(swos.DisplayText, 'Unassigned') AS Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     LEFT JOIN SettingsWorkOrderStatus swos ON swos.WorkOrderStatusId = ih.WOStatusId
     LEFT JOIN AppUser au ON au.AppUserId = ih.WOTechId
     WHERE ${OPEN_WO}
     ORDER BY ih.EntDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
  ).map(mapOpenWoRow);
}

export function getOpenWosByStatus(statusName: string): OpenWoRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.CustomerName, ih.WOTechId,
            COALESCE(NULLIF(trim(au.UserName), ''),
                     trim(au.FirstName || ' ' || au.LastName),
                     'Unassigned') AS Technician,
            ih.EntDate,
            COALESCE(swos.DisplayText, 'Unassigned') AS Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     LEFT JOIN SettingsWorkOrderStatus swos ON swos.WorkOrderStatusId = ih.WOStatusId
     LEFT JOIN AppUser au ON au.AppUserId = ih.WOTechId
     WHERE ${OPEN_WO}
       AND COALESCE(swos.DisplayText, 'Unassigned') = ?
     ORDER BY ih.EntDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [statusName],
  ).map(mapOpenWoRow);
}

export type AgingBucket = "0-7 days" | "8-30 days" | "31-90 days" | "90+ days";

function agingBucketFilter(bucket: string): { sql: string } {
  switch (bucket) {
    case "0-7 days":
      return { sql: `(julianday('now') - julianday(ih.EntDate)) <= 7` };
    case "8-30 days":
      return {
        sql: `(julianday('now') - julianday(ih.EntDate)) > 7 AND (julianday('now') - julianday(ih.EntDate)) <= 30`,
      };
    case "31-90 days":
      return {
        sql: `(julianday('now') - julianday(ih.EntDate)) > 30 AND (julianday('now') - julianday(ih.EntDate)) <= 90`,
      };
    case "90+ days":
      return { sql: `(julianday('now') - julianday(ih.EntDate)) > 90` };
    default:
      return { sql: "1=0" };
  }
}

export function getOpenWosForAging(bucket: string): OpenWoRow[] {
  const ab = agingBucketFilter(bucket);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.CustomerName, ih.WOTechId,
            COALESCE(NULLIF(trim(au.UserName), ''),
                     trim(au.FirstName || ' ' || au.LastName),
                     'Unassigned') AS Technician,
            ih.EntDate,
            COALESCE(swos.DisplayText, 'Unassigned') AS Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     LEFT JOIN SettingsWorkOrderStatus swos ON swos.WorkOrderStatusId = ih.WOStatusId
     LEFT JOIN AppUser au ON au.AppUserId = ih.WOTechId
     WHERE ${OPEN_WO}
       AND length(ih.EntDate) >= 7
       AND ${ab.sql}
     ORDER BY ih.EntDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
  ).map(mapOpenWoRow);
}

export type AdherenceWoRow = {
  InvoiceDocId: number;
  DocNo: string;
  CustomerName: string;
  ActivityDate: string;
  ScheduledEndTime: string | null;
  ActualEndTime: string | null;
  TotalInvoice: number;
};

export function getWosForAdherence(
  range: DateRange,
  bucket: string,
): AdherenceWoRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  let bucketSql = "1=0";
  switch (bucket) {
    case "On time":
      bucketSql = `wos.ActualEndTime IS NOT NULL AND wos.ScheduledEndTime IS NOT NULL AND wos.ActualEndTime <= wos.ScheduledEndTime`;
      break;
    case "Late":
      bucketSql = `wos.ActualEndTime IS NOT NULL AND wos.ScheduledEndTime IS NOT NULL AND wos.ActualEndTime > wos.ScheduledEndTime`;
      break;
    case "Missing data":
      bucketSql = `wos.ActualEndTime IS NULL OR wos.ScheduledEndTime IS NULL`;
      break;
  }
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.CustomerName, ih.ActivityDate,
            wos.ScheduledEndTime, wos.ActualEndTime, ih.TotalInvoice
     FROM WorkOrderSchedule wos
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = wos.InvoiceDocId
     WHERE ${POSTED_WO} AND ${df.sql} AND (${bucketSql})
     ORDER BY ih.ActivityDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    df.params,
  ).map((r) => ({
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    ScheduledEndTime: r.ScheduledEndTime ? String(r.ScheduledEndTime) : null,
    ActualEndTime: r.ActualEndTime ? String(r.ActualEndTime) : null,
    TotalInvoice: Number(r.TotalInvoice) || 0,
  }));
}

export type InvoiceDetailRow = {
  InvoiceDocId: number;
  DocNo: string;
  InvoiceNo: string;
  Status: string;
  InvoiceType: string;
  ActivityDate: string;
  CustomerId: number;
  CustomerName: string;
  SalesPersonName: string;
  TotalInvoice: number;
  WOEstimate: number;
  FinalizedDate: string | null;
  EntDate: string;
};

export function getInvoiceById(invoiceDocId: number): InvoiceDetailRow | undefined {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT InvoiceDocId, DocNo, InvoiceNo, Status, InvoiceType, ActivityDate,
            CustomerId, CustomerName, SalesPersonName, TotalInvoice, WOEstimate,
            FinalizedDate, EntDate
     FROM InvoiceHeader
     WHERE InvoiceDocId = ?
     LIMIT 1`,
    [invoiceDocId],
  );
  const r = rows[0];
  if (!r) return undefined;
  return {
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    InvoiceNo: String(r.InvoiceNo ?? ""),
    Status: String(r.Status ?? ""),
    InvoiceType: String(r.InvoiceType ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    CustomerId: Number(r.CustomerId) || 0,
    CustomerName: String(r.CustomerName ?? ""),
    SalesPersonName: String(r.SalesPersonName ?? ""),
    TotalInvoice: Number(r.TotalInvoice) || 0,
    WOEstimate: Number(r.WOEstimate) || 0,
    FinalizedDate: r.FinalizedDate ? String(r.FinalizedDate) : null,
    EntDate: String(r.EntDate ?? ""),
  };
}

export type SegmentRow = {
  SegmentId: number;
  LineNo: number;
  DisplayText: string;
  Memo: string;
  ActualHrs: number;
  FlatRateLaborHrs: number;
  LaborRate: number;
  NetExt: number;
  Status: string;
};

/** Service segments for a WO. Note: InvoiceSegment uses InvDocId (not InvoiceDocId). */
export function getSegmentsForWo(invoiceDocId: number): SegmentRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT SegmentId, LineNo, DisplayText, Memo, ActualHrs,
            FlatRateLaborHrs, LaborRate, NetExt, Status
     FROM InvoiceSegment
     WHERE InvDocId = ?
     ORDER BY LineNo
     LIMIT ${DEFAULT_LIMIT}`,
    [invoiceDocId],
  ).map((r) => ({
    SegmentId: Number(r.SegmentId),
    LineNo: Number(r.LineNo) || 0,
    DisplayText: String(r.DisplayText ?? ""),
    Memo: String(r.Memo ?? ""),
    ActualHrs: Number(r.ActualHrs) || 0,
    FlatRateLaborHrs: Number(r.FlatRateLaborHrs) || 0,
    LaborRate: Number(r.LaborRate) || 0,
    NetExt: Number(r.NetExt) || 0,
    Status: String(r.Status ?? ""),
  }));
}

export type PaymentDetailRow = {
  PaymentId: number;
  EntDate: string;
  DocNo: string;
  CustomerName: string;
  PmtType: string;
  Method: string;
  Amount: number;
};

export function getPaymentsByMethodDetail(
  range: DateRange,
  methodName: string,
  limit = DEFAULT_LIMIT,
): PaymentDetailRow[] {
  const df = dateFilter("p.EntDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT p.PaymentId, p.EntDate, ih.DocNo, ih.CustomerName,
            p.PmtType,
            COALESCE(pm.DisplayText, p.PmtType, 'Unknown') AS Method,
            p.Amount
     FROM Payment p
     LEFT JOIN PaymentMethod pm ON pm.PaymentMethodId = p.PaymentMethodId
     LEFT JOIN InvoiceHeader ih ON ih.InvoiceDocId = p.InvoiceDocId
     WHERE p.IsActive = 1 AND ${df.sql}
       AND COALESCE(pm.DisplayText, p.PmtType, 'Unknown') = ?
     ORDER BY p.EntDate DESC
     LIMIT ?`,
    [...df.params, methodName, limit],
  ).map((r) => ({
    PaymentId: Number(r.PaymentId),
    EntDate: String(r.EntDate ?? ""),
    DocNo: String(r.DocNo ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    PmtType: String(r.PmtType ?? ""),
    Method: String(r.Method ?? "Unknown"),
    Amount: Number(r.Amount) || 0,
  }));
}

/** All payments for a YYYY-MM month (used by Finance "Payment activity" drill). */
export function getPaymentsForMonth(
  range: DateRange,
  month: string,
): PaymentDetailRow[] {
  const df = dateFilter("p.EntDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT p.PaymentId, p.EntDate, ih.DocNo, ih.CustomerName,
            p.PmtType,
            COALESCE(pm.DisplayText, p.PmtType, 'Unknown') AS Method,
            p.Amount
     FROM Payment p
     LEFT JOIN PaymentMethod pm ON pm.PaymentMethodId = p.PaymentMethodId
     LEFT JOIN InvoiceHeader ih ON ih.InvoiceDocId = p.InvoiceDocId
     WHERE p.IsActive = 1 AND ${df.sql}
       AND strftime('%Y-%m', p.EntDate) = ?
     ORDER BY p.EntDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    [...df.params, month],
  ).map((r) => ({
    PaymentId: Number(r.PaymentId),
    EntDate: String(r.EntDate ?? ""),
    DocNo: String(r.DocNo ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    PmtType: String(r.PmtType ?? ""),
    Method: String(r.Method ?? "Unknown"),
    Amount: Number(r.Amount) || 0,
  }));
}

/** Salesperson invoices in range. The chart's xField is the SalesPersonName text. */
export function getInvoicesForSalesperson(
  range: DateRange,
  salesPersonName: string,
): InvoiceListRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  // Mirror the parent's CASE expression: empty/NULL becomes 'Unassigned'.
  const isUnassigned = salesPersonName === "Unassigned";
  const filter = isUnassigned
    ? `(ih.SalesPersonName IS NULL OR trim(ih.SalesPersonName) = '')`
    : `ih.SalesPersonName = ?`;
  const params: unknown[] = [...df.params];
  if (!isUnassigned) params.push(salesPersonName);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.SalesPersonName, ih.InvoiceType, ih.Status,
            ih.TotalInvoice
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES} AND ${df.sql} AND ${filter}
     ORDER BY ih.TotalInvoice DESC
     LIMIT ${DEFAULT_LIMIT}`,
    params,
  ).map(mapInvoiceListRow);
}

export type QuoteInvoiceRow = {
  InvoiceDocId: number;
  DocNo: string;
  InvoiceNo: string;
  ActivityDate: string;
  CustomerName: string;
  Status: string;
  QuoteStatus: string;
  TotalInvoice: number;
};

/** Invoices whose QuoteDetails.QuoteStatus matches the chart label. */
export function getInvoicesForQuoteStatus(
  range: DateRange,
  quoteStatus: string,
): QuoteInvoiceRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  const isUnknown = quoteStatus === "Unknown";
  const filter = isUnknown
    ? `(qd.QuoteStatus IS NULL OR trim(qd.QuoteStatus) = '')`
    : `qd.QuoteStatus = ?`;
  const params: unknown[] = [...df.params];
  if (!isUnknown) params.push(quoteStatus);
  return runSelect<Record<string, unknown>>(
    `SELECT ih.InvoiceDocId, ih.DocNo, ih.InvoiceNo, ih.ActivityDate,
            ih.CustomerName, ih.Status,
            COALESCE(NULLIF(trim(qd.QuoteStatus), ''), 'Unknown') AS QuoteStatus,
            ih.TotalInvoice
     FROM QuoteDetails qd
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = qd.InvoiceDocId
     WHERE ${df.sql} AND ${filter}
     ORDER BY ih.ActivityDate DESC
     LIMIT ${DEFAULT_LIMIT}`,
    params,
  ).map((r) => ({
    InvoiceDocId: Number(r.InvoiceDocId),
    DocNo: String(r.DocNo ?? ""),
    InvoiceNo: String(r.InvoiceNo ?? ""),
    ActivityDate: String(r.ActivityDate ?? ""),
    CustomerName: String(r.CustomerName ?? ""),
    Status: String(r.Status ?? ""),
    QuoteStatus: String(r.QuoteStatus ?? "Unknown"),
    TotalInvoice: Number(r.TotalInvoice) || 0,
  }));
}

/* ----- Customer-health drill wrappers ------------------------------------ */

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/**
 * Drill payload for the "Declining customers — view all" frame. Returns the
 * top 25 declining accounts plus aggregate KPIs for the strip.
 */
export function getDecliningCustomersDrill(): {
  rows: Record<string, unknown>[];
  kpis: DrillKpi[];
} {
  const rows = getDecliningCustomers(25);
  const totalPrior = rows.reduce((s, r) => s + r.prior_revenue, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.current_revenue, 0);
  const kpis: DrillKpi[] = [
    { label: "Declining accounts", value: rows.length.toLocaleString() },
    { label: "Prior 90d revenue", value: money(totalPrior) },
    { label: "Current 90d revenue", value: money(totalCurrent) },
  ];
  return { rows: rows as unknown as Record<string, unknown>[], kpis };
}

/** Drill payload for the "Dormant customers — view all" frame. */
export function getDormantCustomersDrill(sinceDays?: number): {
  rows: Record<string, unknown>[];
  kpis: DrillKpi[];
} {
  const window = sinceDays ?? 180;
  const rows = getDormantCustomers(50, window);
  const totalLifetime = rows.reduce((s, r) => s + r.lifetime_revenue, 0);
  const kpis: DrillKpi[] = [
    { label: "Dormant accounts", value: rows.length.toLocaleString() },
    { label: "Lifetime revenue", value: money(totalLifetime) },
    {
      label: "Window",
      value: `${window}+ days`,
      hint: "No posted standard sale within this many days.",
    },
  ];
  return { rows: rows as unknown as Record<string, unknown>[], kpis };
}

/** Drill payload for the "Contact completeness" bucket frame. */
export function getContactCompletenessDrill(
  bucket: ContactBucket,
): Record<string, unknown>[] {
  return getCustomersByContactBucket(bucket) as unknown as Record<
    string,
    unknown
  >[];
}

export type ReceivablesCoverageDrillRow = {
  CustomerId: number;
  CustomerName: string;
  balance: number;
  invoices: number;
};

/**
 * Customers in a receivables-coverage bucket: either still owe money
 * (`with_ar`, balance > 0) or are paid in full / overpaid (`paid_in_full`,
 * balance <= 0). Mirrors the `paid` subquery + posted-any-type predicate that
 * `getTopArCustomers` and `getReceivablesCoverage` use, so the totals
 * reconcile.
 */
export function getReceivablesByCoverage(
  range: DateRange,
  bucket: "with_ar" | "paid_in_full",
): ReceivablesCoverageDrillRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  const having = bucket === "with_ar" ? "balance > 0" : "balance <= 0";
  const orderBy =
    bucket === "with_ar" ? "balance DESC" : "CustomerName ASC";
  return runSelect<Record<string, unknown>>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(ih.TotalInvoice - COALESCE(paid.amt, 0)) AS balance,
            COUNT(DISTINCT ih.InvoiceDocId) AS invoices
     FROM InvoiceHeader ih
     LEFT JOIN (
       SELECT InvoiceDocId, SUM(Amount) AS amt
       FROM Payment
       WHERE IsActive = 1
       GROUP BY InvoiceDocId
     ) AS paid ON paid.InvoiceDocId = ih.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
     GROUP BY ih.CustomerId
     HAVING ${having}
     ORDER BY ${orderBy}
     LIMIT ${DEFAULT_LIMIT}`,
    df.params,
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? "Unknown"),
    balance: Number(r.balance) || 0,
    invoices: Number(r.invoices) || 0,
  }));
}

/** Top customers by outstanding AR (up to 200) for KPI drill-down. */
export function getTopArCustomersDrill(
  range: DateRange,
): Record<string, unknown>[] {
  return getTopArCustomers(range, 200).map((r) => ({
    CustomerId: r.CustomerId,
    CustomerName: r.CustomerName,
    balance: r.balance,
  }));
}
