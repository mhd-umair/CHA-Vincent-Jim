import { runSelect, getScalar } from "@/lib/db";
import {
  POSTED_SALES,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

/**
 * `getTaxableMix` lives in `lib/finance-queries.ts` because the underlying
 * data is a Finance concept (`SalesTax` joined to posted-any-type invoices).
 * The Sales dashboard re-exports it here so Sales pages don't need to import
 * from the Finance module directly. Keep the canonical implementation in
 * `finance-queries.ts` and update both consumers via this single import path.
 */
export { getTaxableMix, type TaxableRow } from "@/lib/finance-queries";

export type SalesKpis = {
  totalRevenue: number;
  avgInvoice: number;
  pipelineValue: number;
  conversionRate: number;
  totalDiscounts: number;
};

export function getSalesKpis(range: DateRange): SalesKpis {
  const df = dateFilter("ih.ActivityDate", range);
  const totalRevenue = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice) FROM InvoiceHeader ih
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const invoiceCount = Number(
    getScalar(
      `SELECT COUNT(*) FROM InvoiceHeader ih
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const avgInvoice =
    invoiceCount > 0 ? Math.round((totalRevenue / invoiceCount) * 100) / 100 : 0;
  const pipelineValue = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice) FROM InvoiceHeader ih
       WHERE lower(ih.Status) IN ('quote', 'committed', 'draft') AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const totalDiscounts = Number(
    getScalar(
      `SELECT SUM(ih.DiscountAmt) FROM InvoiceHeader ih
       WHERE ${POSTED_SALES} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );

  /** Quote conversion: closed-won quotes / quotes closed-or-still-open. */
  const dfQuote = dateFilter("ih.ActivityDate", range);
  const quoteRows = runSelect<{ status: string; n: number }>(
    `SELECT lower(qd.QuoteStatus) AS status, COUNT(*) AS n
     FROM QuoteDetails qd
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = qd.InvoiceDocId
     WHERE ${dfQuote.sql}
     GROUP BY 1`,
    dfQuote.params,
  );
  const counts = new Map(quoteRows.map((r) => [String(r.status), Number(r.n)]));
  const won = counts.get("converted") ?? counts.get("won") ?? counts.get("closed-won") ?? 0;
  const lost = counts.get("lost") ?? counts.get("closed-lost") ?? 0;
  const expired = counts.get("expired") ?? 0;
  const pending = counts.get("pending") ?? counts.get("open") ?? counts.get("active") ?? 0;
  const total = won + lost + expired + pending;
  const conversionRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;

  return {
    totalRevenue,
    avgInvoice,
    pipelineValue,
    conversionRate,
    totalDiscounts,
  };
}

export type SalesMonthlyRow = { month: string; revenue: number };

export function getSalesMonthlyRevenue(range: DateRange): SalesMonthlyRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<SalesMonthlyRow>(
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

export type SalesPersonRow = { SalesPersonName: string; revenue: number; invoices: number };

export function getRevenueBySalesPerson(
  range: DateRange,
  limit = 10,
): SalesPersonRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<SalesPersonRow>(
    `SELECT
        CASE
          WHEN ih.SalesPersonName IS NULL OR trim(ih.SalesPersonName) = '' THEN 'Unassigned'
          ELSE ih.SalesPersonName
        END AS SalesPersonName,
        SUM(ih.TotalInvoice) AS revenue,
        COUNT(*) AS invoices
     FROM InvoiceHeader ih
     WHERE ${POSTED_SALES} AND ${df.sql}
     GROUP BY 1
     ORDER BY revenue DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    SalesPersonName: String(r.SalesPersonName),
    revenue: Number(r.revenue) || 0,
    invoices: Number(r.invoices) || 0,
  }));
}

export type StatusCountRow = { Status: string; count: number };

export function getInvoiceCountByStatus(range: DateRange): StatusCountRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<StatusCountRow>(
    `SELECT
        CASE
          WHEN ih.Status IS NULL OR trim(ih.Status) = '' THEN 'Unknown'
          ELSE lower(ih.Status)
        END AS Status,
        COUNT(*) AS count
     FROM InvoiceHeader ih
     WHERE lower(ih.InvoiceType) = 'in' AND ${df.sql}
     GROUP BY 1
     ORDER BY count DESC`,
    df.params,
  ).map((r) => ({
    Status: String(r.Status),
    count: Number(r.count) || 0,
  }));
}

export type TopCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  revenue: number;
};

export function getTopCustomers(
  range: DateRange,
  limit = 10,
): TopCustomerRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<TopCustomerRow>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(ih.TotalInvoice) AS revenue
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
  }));
}

export type QuoteStatusRow = { QuoteStatus: string; count: number };

export function getQuotePipelineByStatus(range: DateRange): QuoteStatusRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<QuoteStatusRow>(
    `SELECT
        CASE
          WHEN qd.QuoteStatus IS NULL OR trim(qd.QuoteStatus) = '' THEN 'Unknown'
          ELSE qd.QuoteStatus
        END AS QuoteStatus,
        COUNT(*) AS count
     FROM QuoteDetails qd
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = qd.InvoiceDocId
     WHERE ${df.sql}
     GROUP BY 1
     ORDER BY count DESC`,
    df.params,
  ).map((r) => ({
    QuoteStatus: String(r.QuoteStatus),
    count: Number(r.count) || 0,
  }));
}

export type AvgInvoiceRow = { month: string; avg_invoice: number };

export function getAvgInvoiceTrend(range: DateRange): AvgInvoiceRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<AvgInvoiceRow>(
    `SELECT strftime('%Y-%m', ih.ActivityDate) AS month,
            ROUND(AVG(ih.TotalInvoice), 2) AS avg_invoice
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
    avg_invoice: Number(r.avg_invoice) || 0,
  }));
}
