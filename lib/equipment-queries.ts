/**
 * Server-only equipment / unit-inventory queries used by the Equipment
 * dashboard (`app/equipment/page.tsx`) and the unit-detail page
 * (`app/units/[id]/page.tsx`). Style mirrors `lib/parts-queries.ts`.
 *
 * All numeric outputs are coerced via `Number(...)` so the wire shape is
 * stable. Every dynamic value is parameterized via `runSelect` / `getScalar`.
 */

import { getScalar, runSelect } from "@/lib/db";
import {
  POSTED_ANY_TYPE,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

/**
 * Predicate that selects "currently in stock" units. We deliberately use a
 * *deny list* of terminal statuses (sold / voided / deleted / transferred)
 * rather than an allow list of in-stock statuses because StockStatus is free
 * text in the source system and unknown values should still surface in
 * inventory KPIs. `trim` + `lower` so trailing whitespace and case variants
 * (the live data has values like `"instock   "`) don't accidentally slip
 * past the filter when a real `"sold "` row eventually appears.
 *
 * Apply on `UnitBase` aliased as `ub`.
 */
export const IS_IN_STOCK_PREDICATE =
  "ub.IsActive = 1 AND lower(trim(ub.StockStatus)) NOT IN ('sold', 'voided', 'deleted', 'transferred')";

export type EquipmentKpis = {
  activeUnits: number;
  inStockUnits: number;
  inStockRetailValue: number;
  inStockCost: number;
  marginPct: number;
  avgAgingDays: number;
};

export function getEquipmentKpis(): EquipmentKpis {
  const activeUnits = Number(
    getScalar(`SELECT COUNT(*) FROM UnitBase ub WHERE ub.IsActive = 1`) ?? 0,
  );
  const inStockUnits = Number(
    getScalar(
      `SELECT COUNT(*) FROM UnitBase ub WHERE ${IS_IN_STOCK_PREDICATE}`,
    ) ?? 0,
  );
  const inStockRetailValue = Number(
    getScalar(
      `SELECT SUM(ub.BaseRetail) FROM UnitBase ub WHERE ${IS_IN_STOCK_PREDICATE}`,
    ) ?? 0,
  );
  const inStockCost = Number(
    getScalar(
      `SELECT SUM(ub.BaseCost) FROM UnitBase ub WHERE ${IS_IN_STOCK_PREDICATE}`,
    ) ?? 0,
  );
  const marginPct =
    inStockRetailValue > 0
      ? Math.round(
          ((inStockRetailValue - inStockCost) / inStockRetailValue) * 1000,
        ) / 10
      : 0;
  const avgAgingDays = Number(
    getScalar(
      `SELECT ROUND(AVG(julianday('now') - julianday(ub.DateReceived)))
       FROM UnitBase ub
       WHERE ${IS_IN_STOCK_PREDICATE}
         AND length(ub.DateReceived) >= 7`,
    ) ?? 0,
  );
  return {
    activeUnits,
    inStockUnits,
    inStockRetailValue,
    inStockCost,
    marginPct,
    avgAgingDays,
  };
}

export type UnitsByCategoryRow = {
  Category: string;
  units: number;
  retail: number;
};

/**
 * In-stock unit count + retail value per `UnitCategory.DisplayText`. Both
 * the "Inventory by category" and "Retail value by category" charts read
 * from this same shape, so we keep one query instead of two near-duplicates.
 */
export function getUnitsByCategory(): UnitsByCategoryRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT COALESCE(uc.DisplayText, 'Uncategorized') AS Category,
            COUNT(*) AS units,
            SUM(ub.BaseRetail) AS retail
     FROM UnitBase ub
     LEFT JOIN UnitCategory uc ON uc.UnitCategoryId = ub.UnitCategoryId
     WHERE ${IS_IN_STOCK_PREDICATE}
     GROUP BY 1
     ORDER BY retail DESC`,
  ).map((r) => ({
    Category: String(r.Category ?? "Uncategorized"),
    units: Number(r.units) || 0,
    retail: Number(r.retail) || 0,
  }));
}

export type NewVsUsedRow = {
  condition: "New" | "Used";
  units: number;
  retail: number;
};

export function getNewVsUsed(): NewVsUsedRow[] {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT
        CASE WHEN COALESCE(ucon.IsNew, 0) = 1 THEN 'New' ELSE 'Used' END AS condition,
        COUNT(*) AS units,
        SUM(ub.BaseRetail) AS retail
     FROM UnitBase ub
     LEFT JOIN UnitCondition ucon ON ucon.UnitConditionId = ub.UnitConditionId
     WHERE ${IS_IN_STOCK_PREDICATE}
     GROUP BY 1
     ORDER BY condition DESC`, // ensures "New" before "Used"
  ).map((r) => ({
    condition: (r.condition === "New" ? "New" : "Used") as "New" | "Used",
    units: Number(r.units) || 0,
    retail: Number(r.retail) || 0,
  }));
  // Guarantee both rows exist so the pie always has both slices.
  const byKey = new Map(rows.map((r) => [r.condition, r]));
  return [
    byKey.get("New") ?? { condition: "New", units: 0, retail: 0 },
    byKey.get("Used") ?? { condition: "Used", units: 0, retail: 0 },
  ];
}

export type UnitAgingRow = {
  bucket: "0-30" | "31-90" | "91-180" | "180+";
  units: number;
};

const AGING_BUCKETS: UnitAgingRow["bucket"][] = ["0-30", "31-90", "91-180", "180+"];

export function getUnitAgingBuckets(): UnitAgingRow[] {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT
        CASE
          WHEN (julianday('now') - julianday(ub.DateReceived)) <= 30 THEN '0-30'
          WHEN (julianday('now') - julianday(ub.DateReceived)) <= 90 THEN '31-90'
          WHEN (julianday('now') - julianday(ub.DateReceived)) <= 180 THEN '91-180'
          ELSE '180+'
        END AS bucket,
        COUNT(*) AS units
     FROM UnitBase ub
     WHERE ${IS_IN_STOCK_PREDICATE}
       AND length(ub.DateReceived) >= 7
     GROUP BY 1`,
  );
  const byKey = new Map<string, number>(
    rows.map((r) => [String(r.bucket), Number(r.units) || 0]),
  );
  return AGING_BUCKETS.map((bucket) => ({
    bucket,
    units: byKey.get(bucket) ?? 0,
  }));
}

export type TradeInActivityRow = {
  month: string;
  trades: number;
  value: number;
};

/**
 * Monthly count + total `TradeValue` of trade-in lines on posted invoices
 * within `range`. Joins through `InvoiceDetail` to reach `InvoiceHeader`
 * (which is where ActivityDate / Status / InvoiceType live).
 */
export function getTradeInActivity(range: DateRange): TradeInActivityRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<Record<string, unknown>>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            COUNT(*) AS trades,
            SUM(sut.TradeValue) AS value
     FROM SaleUnitTradeIn sut
     JOIN InvoiceDetail id ON id.ItemId = sut.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE}
       AND length(ih.ActivityDate) >= 7
       AND ${df.sql}
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month ASC`,
    df.params,
  ).map((r) => ({
    month: String(r.month),
    trades: Number(r.trades) || 0,
    value: Number(r.value) || 0,
  }));
}

export type UnitDetailRow = {
  UnitId: number;
  StockNo: string;
  Make: string;
  Model: string;
  Year: number;
  StockStatus: string;
  BaseRetail: number;
  BaseCost: number;
  MarginPct: number;
  DateReceived: string | null;
  DateOrdered: string | null;
  DatePurchased: string | null;
  Category: string;
  Condition: string;
  IsNew: number;
  Location: string;
  IsActive: number;
};

export function getUnitById(unitId: number): UnitDetailRow | undefined {
  const rows = runSelect<Record<string, unknown>>(
    `SELECT ub.UnitId, ub.StockNo, ub.Make, ub.Model, ub.Year, ub.StockStatus,
            ub.BaseRetail, ub.BaseCost, ub.MarginPct,
            ub.DateReceived, ub.DateOrdered, ub.DatePurchased,
            COALESCE(uc.DisplayText, 'Uncategorized') AS Category,
            COALESCE(ucon.DisplayText, 'Unknown') AS Condition,
            COALESCE(ucon.IsNew, 0) AS IsNew,
            COALESCE(sl.DisplayText, 'Unknown') AS Location,
            ub.IsActive
     FROM UnitBase ub
     LEFT JOIN UnitCategory uc ON uc.UnitCategoryId = ub.UnitCategoryId
     LEFT JOIN UnitCondition ucon ON ucon.UnitConditionId = ub.UnitConditionId
     LEFT JOIN SettingsLocation sl ON sl.LocationId = ub.LocationId
     WHERE ub.UnitId = ?
     LIMIT 1`,
    [unitId],
  );
  const r = rows[0];
  if (!r) return undefined;
  return {
    UnitId: Number(r.UnitId),
    StockNo: String(r.StockNo ?? ""),
    Make: String(r.Make ?? ""),
    Model: String(r.Model ?? ""),
    Year: Number(r.Year) || 0,
    StockStatus: String(r.StockStatus ?? "").trim(),
    BaseRetail: Number(r.BaseRetail) || 0,
    BaseCost: Number(r.BaseCost) || 0,
    MarginPct: Number(r.MarginPct) || 0,
    DateReceived: r.DateReceived ? String(r.DateReceived) : null,
    DateOrdered: r.DateOrdered ? String(r.DateOrdered) : null,
    DatePurchased: r.DatePurchased ? String(r.DatePurchased) : null,
    Category: String(r.Category ?? "Uncategorized"),
    Condition: String(r.Condition ?? "Unknown"),
    IsNew: Number(r.IsNew) || 0,
    Location: String(r.Location ?? "Unknown"),
    IsActive: Number(r.IsActive) || 0,
  };
}

export type UnitSerialRow = {
  SerialNo: string;
  WarrantyDate: string | null;
};

export function getUnitSerials(unitId: number): UnitSerialRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT SerialNo, WarrantyDate
     FROM UnitSerial
     WHERE UnitId = ? AND IsActive = 1
     ORDER BY UnitSerialId ASC`,
    [unitId],
  ).map((r) => ({
    SerialNo: String(r.SerialNo ?? ""),
    WarrantyDate: r.WarrantyDate ? String(r.WarrantyDate) : null,
  }));
}

export type UnitCustomerEventRow = {
  CustomerUnitId: number;
  EventDate: string | null;
  Activity: string;
  CustomerId: number | null;
  CustomerName: string;
  InvoiceAmount: number;
  TradeAmount: number;
  ListAmount: number;
  Source: string;
  IsActive: number;
};

export function getUnitCustomerEvents(
  unitId: number,
  limit = 50,
): UnitCustomerEventRow[] {
  return runSelect<Record<string, unknown>>(
    `SELECT uc.CustomerUnitId, uc.EventDate, uc.Activity, uc.CustomerId,
            COALESCE(c.CustomerName, '—') AS CustomerName,
            uc.InvoiceAmount, uc.TradeAmount, uc.ListAmount, uc.Source,
            uc.IsActive
     FROM UnitCustomer uc
     LEFT JOIN Customer c ON c.CustomerId = uc.CustomerId
     WHERE uc.UnitId = ? AND uc.IsActive = 1
     ORDER BY uc.EventDate DESC
     LIMIT ?`,
    [unitId, limit],
  ).map((r) => ({
    CustomerUnitId: Number(r.CustomerUnitId),
    EventDate: r.EventDate ? String(r.EventDate) : null,
    Activity: String(r.Activity ?? ""),
    CustomerId: r.CustomerId == null ? null : Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? "—"),
    InvoiceAmount: Number(r.InvoiceAmount) || 0,
    TradeAmount: Number(r.TradeAmount) || 0,
    ListAmount: Number(r.ListAmount) || 0,
    Source: String(r.Source ?? ""),
    IsActive: Number(r.IsActive) || 0,
  }));
}
