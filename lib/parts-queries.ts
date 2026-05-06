import { runSelect, getScalar } from "@/lib/db";
import {
  POSTED_SALES,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

export type PartsKpis = {
  partsRevenue: number;
  partsQty: number;
  distinctParts: number;
  estMarginPct: number;
  policyCoveragePct: number;
};

export function getPartsKpis(range: DateRange): PartsKpis {
  const df = dateFilter("ih.ActivityDate", range);
  const partsRevenue = Number(
    getScalar(
      `SELECT SUM(sp.NetExt)
       FROM SalePart sp
       JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
       JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const partsQty = Number(
    getScalar(
      `SELECT SUM(sp.Qty)
       FROM SalePart sp
       JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
       JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const distinctParts = Number(
    getScalar(
      `SELECT COUNT(DISTINCT sp.PartId)
       FROM SalePart sp
       JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
       JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );

  /** Margin uses only rows with AvgCost present and NetExt > 0. */
  const marginRow = runSelect<{ rev: number; cogs: number }>(
    `SELECT SUM(sp.NetExt) AS rev,
            SUM(sp.Qty * sp.AvgCost) AS cogs
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_SALES} AND ${df.sql}
       AND sp.AvgCost IS NOT NULL
       AND sp.NetExt > 0`,
    df.params,
  )[0];
  const rev = Number(marginRow?.rev ?? 0);
  const cogs = Number(marginRow?.cogs ?? 0);
  const estMarginPct = rev > 0 ? Math.round(((rev - cogs) / rev) * 1000) / 10 : 0;

  const policyRow = runSelect<{ total: number; with_policy: number }>(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN pl.MinStock > 0 OR pl.MaxStock > 0 THEN 1 ELSE 0 END) AS with_policy
     FROM PartLocation pl
     WHERE pl.IsActive = 1`,
  )[0];
  const total = Number(policyRow?.total ?? 0);
  const withPolicy = Number(policyRow?.with_policy ?? 0);
  const policyCoveragePct =
    total > 0 ? Math.round((withPolicy / total) * 1000) / 10 : 0;

  return {
    partsRevenue,
    partsQty,
    distinctParts,
    estMarginPct,
    policyCoveragePct,
  };
}

export type TopPartRevenueRow = {
  PartNo: string;
  Description: string;
  line_revenue: number;
};

export function getTopPartsByRevenue(
  range: DateRange,
  limit = 10,
): TopPartRevenueRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<TopPartRevenueRow>(
    `SELECT sp.PartNo AS PartNo,
            MAX(sp.Description) AS Description,
            SUM(sp.NetExt) AS line_revenue
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY sp.PartNo
     ORDER BY line_revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    PartNo: String(r.PartNo),
    Description: String(r.Description ?? ""),
    line_revenue: Number(r.line_revenue) || 0,
  }));
}

export type TopPartQtyRow = {
  PartNo: string;
  Description: string;
  qty: number;
};

export function getTopPartsByQuantity(
  range: DateRange,
  limit = 10,
): TopPartQtyRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<TopPartQtyRow>(
    `SELECT sp.PartNo AS PartNo,
            MAX(sp.Description) AS Description,
            SUM(sp.Qty) AS qty
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY sp.PartNo
     ORDER BY qty DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    PartNo: String(r.PartNo),
    Description: String(r.Description ?? ""),
    qty: Number(r.qty) || 0,
  }));
}

export type ManufacturerRevenueRow = { Manufacturer: string; revenue: number };

export function getRevenueByManufacturer(
  range: DateRange,
  limit = 6,
): ManufacturerRevenueRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<ManufacturerRevenueRow>(
    `SELECT COALESCE(pm.DisplayText, sp.MfgCode, 'Unknown') AS Manufacturer,
            SUM(sp.NetExt) AS revenue
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY 1
     ORDER BY revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    Manufacturer: String(r.Manufacturer),
    revenue: Number(r.revenue) || 0,
  }));
}

export type PartsVelocityRow = { month: string; line_revenue: number };

export function getPartsVelocity(range: DateRange): PartsVelocityRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<PartsVelocityRow>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            SUM(sp.NetExt) AS line_revenue
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     WHERE ${POSTED_SALES}
       AND length(ih.ActivityDate) >= 7
       AND ${df.sql}
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month`,
    df.params,
  ).map((r) => ({
    month: String(r.month),
    line_revenue: Number(r.line_revenue) || 0,
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

export type ProductLineRow = { ProductLine: string; revenue: number };

export function getRevenueByProductLine(
  range: DateRange,
  limit = 10,
): ProductLineRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<ProductLineRow>(
    `SELECT COALESCE(ppl.DisplayText, 'Unknown') AS ProductLine,
            SUM(sp.NetExt) AS revenue
     FROM SalePart sp
     JOIN InvoiceDetail id ON id.ItemId = sp.ItemId
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = id.InvoiceDocId
     LEFT JOIN PartManufacturer pm ON pm.MfgId = sp.MfgId
     LEFT JOIN PartProductLine ppl ON ppl.ProductLineId = pm.ProductLineId
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY 1
     ORDER BY revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    ProductLine: String(r.ProductLine),
    revenue: Number(r.revenue) || 0,
  }));
}
