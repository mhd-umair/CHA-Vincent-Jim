"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type {
  ArByCustomerRow,
  FinanceKpis,
  LocationRevenueRow,
  PaymentMethodRow,
  PaymentMonthlyRow,
  PaymentsByCustomerRow,
  ReceivablesCoverageRow,
  TaxJurisdictionRow,
  TaxableRow,
} from "@/lib/finance-queries";
import type { DrillKind } from "@/lib/drill-types";
import type { DateRange } from "@/lib/sql-constants";

/** Drill kinds whose rows are customers that should route to /customers/:id. */
const CUSTOMER_LIST_KINDS = new Set<DrillKind>([
  "receivablesByCoverage",
  "topArCustomersDrill",
]);

const methodChart: ChartSpecResolved = {
  type: "pie",
  title: "Payments by method",
  xField: "Method",
  yFields: ["amount"],
};

const paymentTrendChart: ChartSpecResolved = {
  type: "line",
  title: "Payment activity by month",
  xField: "month",
  yFields: ["amount"],
  xLabel: "Month",
  yLabel: "Payments received (USD)",
};

const taxChart: ChartSpecResolved = {
  type: "bar",
  title: "Tax collected by jurisdiction",
  xField: "Jurisdiction",
  yFields: ["tax"],
  xLabel: "Jurisdiction",
  yLabel: "Tax (USD)",
};

const taxableChart: ChartSpecResolved = {
  type: "pie",
  title: "Taxable vs non-taxable sales",
  xField: "category",
  yFields: ["amount"],
};

const locationChart: ChartSpecResolved = {
  type: "bar",
  title: "Revenue by branch",
  xField: "Location",
  yFields: ["revenue"],
  xLabel: "Branch / Location",
  yLabel: "Revenue (USD)",
};

const arChart: ChartSpecResolved = {
  type: "bar",
  title: "Top customers by outstanding AR",
  xField: "CustomerName",
  yFields: ["balance"],
  xLabel: "Customer",
  yLabel: "Outstanding balance (USD)",
};

const arCoverageChart: ChartSpecResolved = {
  type: "pie",
  title: "Receivables coverage",
  xField: "coverage",
  yFields: ["customers"],
};

const paymentsByCustomerChart: ChartSpecResolved = {
  type: "bar",
  title: "Top customers by payments received",
  xField: "CustomerName",
  yFields: ["payments"],
  xLabel: "Customer",
  yLabel: "Payments received (USD)",
};

type Props = {
  kpis: FinanceKpis;
  byMethod: PaymentMethodRow[];
  paymentTrend: PaymentMonthlyRow[];
  taxByJur: TaxJurisdictionRow[];
  taxable: TaxableRow[];
  byLocation: LocationRevenueRow[];
  topAr: ArByCustomerRow[];
  arCoverage: ReceivablesCoverageRow[];
  paymentsByCustomer: PaymentsByCustomerRow[];
  range: DateRange;
  rangeLabel: string;
};

export function FinanceDashboard({
  kpis,
  byMethod,
  paymentTrend,
  taxByJur,
  taxable,
  byLocation,
  topAr,
  arCoverage,
  paymentsByCustomer,
  range,
  rangeLabel,
}: Props) {
  const router = useRouter();
  const [stack, setStack] = useState<DrillFrame[]>([]);
  const money = (n: number) =>
    n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Finance dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Cash, tax, and AR. Revenue here uses all posted invoice types
          (sales + WO + rentals). Outstanding AR ={" "}
          <code className="text-[var(--accent)]">TotalInvoice − payments collected</code>{" "}
          per invoice. Active range: <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total revenue (all types)"
          value={money(kpis.totalRevenue)}
          hint="Posted finalized/archived invoices in range — sales, WOs, rentals."
        />
        <KpiCard
          label="Tax collected"
          value={money(kpis.totalTax)}
          hint="Sum of SalesTax.TotalTax for invoices in range."
        />
        <KpiCard
          label="Payments received"
          value={money(kpis.totalPayments)}
          hint="Sum of Payment.Amount entered in range."
        />
        <KpiCard
          label="Avg days to pay"
          value={`${kpis.avgDaysToPay.toFixed(1)} d`}
          hint="Avg of julianday(first payment) − julianday(FinalizedDate)."
        />
        <KpiCard
          label="Outstanding AR"
          value={money(Math.max(0, kpis.outstandingAr))}
          hint="Posted invoice total minus collected payments per invoice."
          onClick={() =>
            setStack([
              {
                title: "Top customers by outstanding AR",
                subtitle: rangeLabel,
                request: { kind: "topArCustomersDrill", range },
              },
            ])
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Payments by method
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Share of payments collected by method in range.
          </p>
          <InsightChart
            chart={methodChart}
            rows={byMethod as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Payments — ${label}`,
                  subtitle: rangeLabel,
                  request: { kind: "paymentsByMethod", range, method: label },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Payment activity over time
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a month to list payments entered in that month.
          </p>
          <InsightChart
            chart={paymentTrendChart}
            rows={paymentTrend as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Payments — ${label}`,
                  subtitle: rangeLabel,
                  request: { kind: "paymentsForMonth", range, month: label },
                },
              ])
            }
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Tax collected by jurisdiction
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Top {taxByJur.length} jurisdictions by collected tax.
          </p>
          <InsightChart
            chart={taxChart}
            rows={taxByJur as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Tax — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForJurisdiction",
                    range,
                    jurisdiction: label,
                  },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Taxable vs non-taxable sales
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            From <code className="text-[var(--accent)]">SalesTax</code> on posted invoices.
          </p>
          <InsightChart
            chart={taxableChart}
            rows={taxable as unknown as Record<string, unknown>[]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Revenue by branch
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Posted revenue (all types) by store/location.
          </p>
          <InsightChart
            chart={locationChart}
            rows={byLocation as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted invoices — ${label}`,
                  subtitle: rangeLabel,
                  request: { kind: "invoicesForLocation", range, location: label },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Top customers by outstanding AR
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to open the customer profile.
          </p>
          <InsightChart
            chart={arChart}
            rows={topAr as unknown as Record<string, unknown>[]}
            onDatumClick={({ row }) => {
              const id = row.CustomerId;
              if (typeof id === "number") router.push(`/customers/${id}`);
            }}
          />
          <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {topAr.slice(0, 5).map((c) => (
              <li key={c.CustomerId}>
                <Link
                  className="text-[var(--accent)] hover:underline"
                  href={`/customers/${c.CustomerId}`}
                >
                  {c.CustomerName}
                </Link>
                <span className="text-[var(--muted)]"> — {money(c.balance)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Receivables coverage
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Distinct customers in range with an outstanding balance vs. paid in
            full. Click a slice to see who.
          </p>
          <InsightChart
            chart={arCoverageChart}
            rows={arCoverage as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              const bucket =
                label === "With AR balance" ? "with_ar" : "paid_in_full";
              setStack([
                {
                  title: `Receivables — ${label}`,
                  subtitle: rangeLabel,
                  request: { kind: "receivablesByCoverage", range, bucket },
                },
              ]);
            }}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Top customers by payments received
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Sum of <code className="text-[var(--accent)]">Payment.Amount</code>{" "}
            per customer in range. Click a bar to open the customer profile.
          </p>
          <InsightChart
            chart={paymentsByCustomerChart}
            rows={paymentsByCustomer as unknown as Record<string, unknown>[]}
            onDatumClick={({ row }) => {
              const id = row.CustomerId;
              if (typeof id === "number") router.push(`/customers/${id}`);
            }}
          />
          <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {paymentsByCustomer.slice(0, 5).map((c) => (
              <li key={c.CustomerId}>
                <Link
                  className="text-[var(--accent)] hover:underline"
                  href={`/customers/${c.CustomerId}`}
                >
                  {c.CustomerName}
                </Link>
                <span className="text-[var(--muted)]"> — {money(c.payments)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DrillDrawerHost
        stack={stack}
        setStack={setStack}
        onRowClick={(row, frame) => {
          if (CUSTOMER_LIST_KINDS.has(frame.request.kind)) {
            const id = Number(row.CustomerId);
            if (Number.isFinite(id) && id > 0) {
              router.push(`/customers/${id}`);
            }
            return;
          }
          return false;
        }}
      />
    </div>
  );
}
