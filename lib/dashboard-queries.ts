import { runSelect, getScalar } from "@/lib/db";
import {
  POSTED_SALES,
  POSTED_ANY_TYPE,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

export function getKpis(range: DateRange) {
  const df = dateFilter("ih.ActivityDate", range);
  const totalRevenue = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice) AS v FROM InvoiceHeader ih
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const invoiceCount = Number(
    getScalar(
      `SELECT COUNT(*) AS v FROM InvoiceHeader ih
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const avgInvoice =
    invoiceCount > 0 ? Math.round((totalRevenue / invoiceCount) * 100) / 100 : 0;
  const activeCustomers = Number(
    getScalar(`SELECT COUNT(*) AS v FROM Customer WHERE IsActive = 1`) ?? 0,
  );
  const unitsInStock = Number(
    getScalar(`SELECT COUNT(*) AS v FROM UnitBase WHERE IsActive = 1`) ?? 0,
  );
  return {
    totalRevenue,
    invoiceCount,
    avgInvoice,
    activeCustomers,
    unitsInStock,
  };
}

export type MonthlyRevenueRow = { month: string; revenue: number };

export function getMonthlyRevenue(range: DateRange): MonthlyRevenueRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<MonthlyRevenueRow>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES}
       AND length(ih.ActivityDate) >= 7
       AND ${df.sql}
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month`,
    df.params,
  ).map((r) => ({
    month: String(r.month),
    revenue: Number(r.revenue) || 0,
  }));
}

export type CustomerLeaderRow = {
  CustomerId: number;
  CustomerName: string;
  revenue: number;
  invoices: number;
};

export function getCustomerLeaders(
  range: DateRange,
  limit = 10,
): CustomerLeaderRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<CustomerLeaderRow>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(ih.TotalInvoice) AS revenue,
            COUNT(*) AS invoices
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY ih.CustomerId
     ORDER BY revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName),
    revenue: Number(r.revenue) || 0,
    invoices: Number(r.invoices) || 0,
  }));
}

export type UnitStatusRow = { StockStatus: string; units: number };

export function getUnitsByStockStatus(): UnitStatusRow[] {
  return runSelect<UnitStatusRow>(
    `SELECT StockStatus AS StockStatus, COUNT(*) AS units
     FROM UnitBase
     WHERE IsActive = 1
     GROUP BY StockStatus
     ORDER BY units DESC`,
  ).map((r) => ({
    StockStatus: String(r.StockStatus),
    units: Number(r.units) || 0,
  }));
}

export type PartPolicyRow = { policy: string; count: number };

export function getPartsPolicySummary(): PartPolicyRow[] {
  type Agg = { with_minmax: number; no_policy: number };
  const rows = runSelect<Agg>(
    `SELECT
       SUM(CASE WHEN pl.MinStock > 0 OR pl.MaxStock > 0 THEN 1 ELSE 0 END) AS with_minmax,
       SUM(CASE WHEN pl.MinStock = 0 AND pl.MaxStock = 0 THEN 1 ELSE 0 END) AS no_policy
     FROM PartLocation pl
     WHERE pl.IsActive = 1`,
  );
  const r = rows[0];
  if (!r) return [];
  return [
    { policy: "Has min/max configured", count: Number(r.with_minmax) || 0 },
    { policy: "No min/max (0/0)", count: Number(r.no_policy) || 0 },
  ];
}

export type TopPartRow = {
  PartNo: string;
  Description: string;
  line_revenue: number;
};

export function getTopPartsByRevenue(
  range: DateRange,
  limit = 8,
): TopPartRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<TopPartRow>(
    `SELECT sp.PartNo AS PartNo,
            sp.Description AS Description,
            SUM(sp.NetExt) AS line_revenue
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY sp.PartNo, sp.Description
     ORDER BY line_revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    PartNo: String(r.PartNo),
    Description: String(r.Description),
    line_revenue: Number(r.line_revenue) || 0,
  }));
}

/* ----- Management dashboard additions ------------------------------------ */

export type RevenueByTypeRow = { InvoiceType: string; revenue: number };

/** Revenue mix across `in` (sale), `wo` (work order), `rl` (rental). */
export function getRevenueByInvoiceType(range: DateRange): RevenueByTypeRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<RevenueByTypeRow>(
    `SELECT
        CASE lower(ih.InvoiceType)
          WHEN 'in' THEN 'Sale (in)'
          WHEN 'wo' THEN 'Work order (wo)'
          WHEN 'rl' THEN 'Rental (rl)'
          ELSE COALESCE(ih.InvoiceType, 'Unknown')
        END AS InvoiceType,
        SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
     GROUP BY lower(ih.InvoiceType)
     ORDER BY revenue DESC`,
    df.params,
  ).map((r) => ({
    InvoiceType: String(r.InvoiceType),
    revenue: Number(r.revenue) || 0,
  }));
}

export type RevenueByLocationRow = { Location: string; revenue: number };

/** Posted standard sale revenue grouped by branch/store location. */
export function getRevenueByLocation(range: DateRange): RevenueByLocationRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<RevenueByLocationRow>(
    `SELECT COALESCE(sl.DisplayText, 'Unknown') AS Location,
            SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     LEFT JOIN SettingsLocation sl ON sl.LocationId = ih.LocationId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY 1
     ORDER BY revenue DESC`,
    df.params,
  ).map((r) => ({
    Location: String(r.Location),
    revenue: Number(r.revenue) || 0,
  }));
}
