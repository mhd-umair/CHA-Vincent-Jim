import { runSelect, getScalar } from "@/lib/db";
import {
  POSTED_ANY_TYPE,
  dateFilter,
  type DateRange,
} from "@/lib/sql-constants";

export type FinanceKpis = {
  totalRevenue: number;
  totalTax: number;
  totalPayments: number;
  avgDaysToPay: number;
  outstandingAr: number;
};

export function getFinanceKpis(range: DateRange): FinanceKpis {
  const df = dateFilter("ih.ActivityDate", range);
  const dfPay = dateFilter("p.EntDate", range);

  const totalRevenue = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice) FROM InvoiceHeader ih
       WHERE ${POSTED_ANY_TYPE} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const totalTax = Number(
    getScalar(
      `SELECT SUM(st.TotalTax)
       FROM SalesTax st
       JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId
       WHERE ${POSTED_ANY_TYPE} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  const totalPayments = Number(
    getScalar(
      `SELECT SUM(p.Amount)
       FROM Payment p
       WHERE p.IsActive = 1 AND ${dfPay.sql}`,
      dfPay.params,
    ) ?? 0,
  );
  /**
   * Avg days from invoice finalization to payment entry. Uses the most recent
   * payment per invoice via min(EntDate). Lexical compare on TEXT works.
   */
  const avgDaysToPay = Number(
    getScalar(
      `SELECT AVG(julianday(p_first.first_pmt) - julianday(ih.FinalizedDate))
       FROM InvoiceHeader ih
       JOIN (
         SELECT InvoiceDocId, MIN(EntDate) AS first_pmt
         FROM Payment
         WHERE IsActive = 1
         GROUP BY InvoiceDocId
       ) AS p_first ON p_first.InvoiceDocId = ih.InvoiceDocId
       WHERE ${POSTED_ANY_TYPE}
         AND length(ih.FinalizedDate) >= 7
         AND length(p_first.first_pmt) >= 7
         AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );
  /**
   * Outstanding AR ≈ posted invoice total minus payments collected against
   * those invoices. Uses POSTED_ANY_TYPE so WO and rental balances are
   * included. Negative balances clamped to 0 in caller display if needed.
   */
  const outstandingAr = Number(
    getScalar(
      `SELECT SUM(ih.TotalInvoice - COALESCE(paid.amt, 0))
       FROM InvoiceHeader ih
       LEFT JOIN (
         SELECT InvoiceDocId, SUM(Amount) AS amt
         FROM Payment
         WHERE IsActive = 1
         GROUP BY InvoiceDocId
       ) AS paid ON paid.InvoiceDocId = ih.InvoiceDocId
       WHERE ${POSTED_ANY_TYPE} AND ${df.sql}`,
      df.params,
    ) ?? 0,
  );

  return {
    totalRevenue,
    totalTax,
    totalPayments,
    avgDaysToPay: Math.round(avgDaysToPay * 10) / 10,
    outstandingAr,
  };
}

export type PaymentMethodRow = { Method: string; amount: number };

export function getPaymentsByMethod(
  range: DateRange,
  limit = 10,
): PaymentMethodRow[] {
  const df = dateFilter("p.EntDate", range);
  return runSelect<PaymentMethodRow>(
    `SELECT COALESCE(pm.DisplayText, p.PmtType, 'Unknown') AS Method,
            SUM(p.Amount) AS amount
     FROM Payment p
     LEFT JOIN PaymentMethod pm ON pm.PaymentMethodId = p.PaymentMethodId
     WHERE p.IsActive = 1 AND ${df.sql}
     GROUP BY 1
     ORDER BY amount DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    Method: String(r.Method),
    amount: Number(r.amount) || 0,
  }));
}

export type PaymentMonthlyRow = { month: string; amount: number };

export function getPaymentActivityByMonth(
  range: DateRange,
): PaymentMonthlyRow[] {
  const df = dateFilter("p.EntDate", range);
  return runSelect<PaymentMonthlyRow>(
    `SELECT strftime('%Y-%m', p.EntDate) AS month,
            SUM(p.Amount) AS amount
     FROM Payment p
     WHERE p.IsActive = 1
       AND length(p.EntDate) >= 7
       AND ${df.sql}
     GROUP BY 1
     HAVING month IS NOT NULL
     ORDER BY month`,
    df.params,
  ).map((r) => ({
    month: String(r.month),
    amount: Number(r.amount) || 0,
  }));
}

export type TaxJurisdictionRow = { Jurisdiction: string; tax: number };

export function getTaxByJurisdiction(
  range: DateRange,
  limit = 10,
): TaxJurisdictionRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<TaxJurisdictionRow>(
    `SELECT COALESCE(NULLIF(trim(st.JurisdictionDisplayText), ''), 'Unknown') AS Jurisdiction,
            SUM(st.TotalTax) AS tax
     FROM SalesTax st
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
     GROUP BY 1
     ORDER BY tax DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    Jurisdiction: String(r.Jurisdiction),
    tax: Number(r.tax) || 0,
  }));
}

export type TaxableRow = { category: string; amount: number };

/**
 * Shared by Finance and Sales dashboards. The Sales dashboard re-exports this
 * via `lib/sales-queries.ts` so callers don't have to cross-import. Aggregates
 * `SalesTax.TaxableAmount` vs `SalesTax.NonTaxableAmount` for posted-any-type
 * invoices in `range`.
 */
export function getTaxableMix(range: DateRange): TaxableRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  type Agg = { taxable: number; nontaxable: number };
  const rows = runSelect<Agg>(
    `SELECT
        SUM(st.TaxableAmount) AS taxable,
        SUM(COALESCE(st.NonTaxableAmount, 0)) AS nontaxable
     FROM SalesTax st
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = st.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}`,
    df.params,
  );
  const r = rows[0];
  if (!r) return [];
  return [
    { category: "Taxable", amount: Number(r.taxable) || 0 },
    { category: "Non-taxable", amount: Number(r.nontaxable) || 0 },
  ];
}

export type LocationRevenueRow = { Location: string; revenue: number };

export function getRevenueByLocation(
  range: DateRange,
): LocationRevenueRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<LocationRevenueRow>(
    `SELECT COALESCE(sl.DisplayText, 'Unknown') AS Location,
            SUM(ih.TotalInvoice) AS revenue
     FROM InvoiceHeader ih
     LEFT JOIN SettingsLocation sl ON sl.LocationId = ih.LocationId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
     GROUP BY 1
     ORDER BY revenue DESC`,
    df.params,
  ).map((r) => ({
    Location: String(r.Location),
    revenue: Number(r.revenue) || 0,
  }));
}

export type ArByCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  balance: number;
};

export function getTopArCustomers(
  range: DateRange,
  limit = 10,
): ArByCustomerRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  return runSelect<ArByCustomerRow>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(ih.TotalInvoice - COALESCE(paid.amt, 0)) AS balance
     FROM InvoiceHeader ih
     LEFT JOIN (
       SELECT InvoiceDocId, SUM(Amount) AS amt
       FROM Payment
       WHERE IsActive = 1
       GROUP BY InvoiceDocId
     ) AS paid ON paid.InvoiceDocId = ih.InvoiceDocId
     WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
     GROUP BY ih.CustomerId
     HAVING balance > 0
     ORDER BY balance DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? "Unknown"),
    balance: Number(r.balance) || 0,
  }));
}

export type ReceivablesCoverageRow = {
  coverage: "With AR balance" | "Paid in full / no AR";
  customers: number;
};

/**
 * 2-row pie shape: how many distinct customers in `range` still have an
 * outstanding balance vs. are paid in full. Reuses the same `paid` subquery
 * pattern as `getTopArCustomers` so balances reconcile across the dashboard.
 */
export function getReceivablesCoverage(
  range: DateRange,
): ReceivablesCoverageRow[] {
  const df = dateFilter("ih.ActivityDate", range);
  type Agg = { with_ar: number; paid_in_full: number };
  const rows = runSelect<Agg>(
    `WITH paid AS (
       SELECT InvoiceDocId, SUM(Amount) AS amt
       FROM Payment
       WHERE IsActive = 1
       GROUP BY InvoiceDocId
     ),
     customer_balance AS (
       SELECT ih.CustomerId AS CustomerId,
              SUM(ih.TotalInvoice - COALESCE(paid.amt, 0)) AS balance
       FROM InvoiceHeader ih
       LEFT JOIN paid ON paid.InvoiceDocId = ih.InvoiceDocId
       WHERE ${POSTED_ANY_TYPE} AND ${df.sql}
       GROUP BY ih.CustomerId
     )
     SELECT
       SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) AS with_ar,
       SUM(CASE WHEN balance <= 0 THEN 1 ELSE 0 END) AS paid_in_full
     FROM customer_balance`,
    df.params,
  );
  const r = rows[0];
  if (!r) return [];
  return [
    { coverage: "With AR balance", customers: Number(r.with_ar) || 0 },
    { coverage: "Paid in full / no AR", customers: Number(r.paid_in_full) || 0 },
  ];
}

export type PaymentsByCustomerRow = {
  CustomerId: number;
  CustomerName: string;
  payments: number;
  payment_count: number;
};

/**
 * Sum of `Payment.Amount` per customer in `range`, ordered by amount DESC.
 * Joins through `InvoiceHeader` so the customer is the invoice's customer,
 * which is the same attribution the AR/leaderboard charts already use.
 */
export function getPaymentsByCustomer(
  range: DateRange,
  limit = 10,
): PaymentsByCustomerRow[] {
  const df = dateFilter("p.EntDate", range);
  return runSelect<PaymentsByCustomerRow>(
    `SELECT ih.CustomerId AS CustomerId,
            MAX(ih.CustomerName) AS CustomerName,
            SUM(p.Amount) AS payments,
            COUNT(p.PaymentId) AS payment_count
     FROM Payment p
     JOIN InvoiceHeader ih ON ih.InvoiceDocId = p.InvoiceDocId
     WHERE p.IsActive = 1 AND ${df.sql}
     GROUP BY ih.CustomerId
     HAVING payments > 0
     ORDER BY payments DESC
     LIMIT ?`,
    [...df.params, limit],
  ).map((r) => ({
    CustomerId: Number(r.CustomerId),
    CustomerName: String(r.CustomerName ?? "Unknown"),
    payments: Number(r.payments) || 0,
    payment_count: Number(r.payment_count) || 0,
  }));
}
