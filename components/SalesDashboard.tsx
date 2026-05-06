"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type {
  AvgInvoiceRow,
  QuoteStatusRow,
  SalesKpis,
  SalesMonthlyRow,
  SalesPersonRow,
  StatusCountRow,
  TaxableRow,
  TopCustomerRow,
} from "@/lib/sales-queries";
import type { DateRange } from "@/lib/sql-constants";

const monthlyChart: ChartSpecResolved = {
  type: "line",
  title: "Monthly revenue",
  xField: "month",
  yFields: ["revenue"],
  xLabel: "Month",
  yLabel: "Revenue (USD)",
};

const salesPersonChart: ChartSpecResolved = {
  type: "bar",
  title: "Revenue by salesperson",
  xField: "SalesPersonName",
  yFields: ["revenue"],
  xLabel: "Salesperson",
  yLabel: "Revenue (USD)",
};

const statusChart: ChartSpecResolved = {
  type: "pie",
  title: "Invoice count by status",
  xField: "Status",
  yFields: ["count"],
};

const topCustomersChart: ChartSpecResolved = {
  type: "bar",
  title: "Top customers by revenue",
  xField: "CustomerName",
  yFields: ["revenue"],
  xLabel: "Customer",
  yLabel: "Revenue (USD)",
};

const quotePipelineChart: ChartSpecResolved = {
  type: "bar",
  title: "Quote pipeline by status",
  xField: "QuoteStatus",
  yFields: ["count"],
  xLabel: "Quote status",
  yLabel: "Quote count",
};

const avgInvoiceChart: ChartSpecResolved = {
  type: "line",
  title: "Average invoice value trend",
  xField: "month",
  yFields: ["avg_invoice"],
  xLabel: "Month",
  yLabel: "Avg invoice (USD)",
};

const taxableMixChart: ChartSpecResolved = {
  type: "pie",
  title: "Taxable vs non-taxable sales",
  xField: "category",
  yFields: ["amount"],
};

type Props = {
  kpis: SalesKpis;
  monthly: SalesMonthlyRow[];
  bySalesPerson: SalesPersonRow[];
  statusCounts: StatusCountRow[];
  topCustomers: TopCustomerRow[];
  quotePipeline: QuoteStatusRow[];
  avgTrend: AvgInvoiceRow[];
  taxableMix: TaxableRow[];
  range: DateRange;
  rangeLabel: string;
};

export function SalesDashboard({
  kpis,
  monthly,
  bySalesPerson,
  statusCounts,
  topCustomers,
  quotePipeline,
  avgTrend,
  taxableMix,
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
          Sales dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Top-of-funnel through booked revenue. Posted = status{" "}
          <code className="text-[var(--accent)]">finalized</code>/
          <code className="text-[var(--accent)]">archived</code>, type{" "}
          <code className="text-[var(--accent)]">in</code>. Active range:{" "}
          <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Posted sales revenue"
          value={money(kpis.totalRevenue)}
          hint={`Sum of TotalInvoice on posted standard invoices in ${rangeLabel}.`}
        />
        <KpiCard
          label="Average invoice"
          value={money(kpis.avgInvoice)}
          hint="Posted sale revenue / posted sale invoice count."
        />
        <KpiCard
          label="Active quote pipeline"
          value={money(kpis.pipelineValue)}
          hint="Sum of TotalInvoice for invoices in quote/committed/draft status."
        />
        <KpiCard
          label="Quote conversion"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          hint="Won quotes ÷ all decided + open quotes (QuoteDetails.QuoteStatus)."
        />
        <KpiCard
          label="Total discounts"
          value={money(kpis.totalDiscounts)}
          hint="Sum of InvoiceHeader.DiscountAmt on posted invoices."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Monthly revenue
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a month to drill into invoices for that month.
          </p>
          <InsightChart
            chart={monthlyChart}
            rows={monthly as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted sales — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForMonth",
                    range,
                    month: label,
                    invoiceType: "in",
                  },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Revenue by salesperson
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Top {bySalesPerson.length} based on posted sale revenue.
          </p>
          <InsightChart
            chart={salesPersonChart}
            rows={bySalesPerson as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted sales — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForSalesperson",
                    range,
                    salesPersonName: label,
                  },
                },
              ])
            }
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Invoice status mix
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Standard invoice statuses observed in the range.
          </p>
          <InsightChart
            chart={statusChart}
            rows={statusCounts as unknown as Record<string, unknown>[]}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Top customers
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to open the customer profile.
          </p>
          <InsightChart
            chart={topCustomersChart}
            rows={topCustomers as unknown as Record<string, unknown>[]}
            onDatumClick={({ row }) => {
              const id = row.CustomerId;
              if (typeof id === "number") router.push(`/customers/${id}`);
            }}
          />
          <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {topCustomers.slice(0, 5).map((c) => (
              <li key={c.CustomerId}>
                <Link
                  className="text-[var(--accent)] hover:underline"
                  href={`/customers/${c.CustomerId}`}
                >
                  {c.CustomerName}
                </Link>
                <span className="text-[var(--muted)]"> — {money(c.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Quote pipeline by status
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Counts from <code className="text-[var(--accent)]">QuoteDetails</code>.
          </p>
          <InsightChart
            chart={quotePipelineChart}
            rows={quotePipeline as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Quotes — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForQuoteStatus",
                    range,
                    quoteStatus: label,
                  },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Average invoice value trend
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Mean TotalInvoice per month — useful for deal-size shifts.
          </p>
          <InsightChart
            chart={avgInvoiceChart}
            rows={avgTrend as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted sales — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForMonth",
                    range,
                    month: label,
                    invoiceType: "in",
                  },
                },
              ])
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Taxable vs non-taxable sales
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          From <code className="text-[var(--accent)]">SalesTax</code> on posted
          invoices. Informational — slices are not interactive.
        </p>
        {/*
          Phase-6 choice: this pie is non-interactive. The data crosses sales
          and finance (SalesTax aggregates against any-type posted invoices)
          and a "show me invoices in this taxability bucket" drill would just
          re-tell the story the bar charts above already cover.
         */}
        <InsightChart
          chart={taxableMixChart}
          rows={taxableMix as unknown as Record<string, unknown>[]}
        />
      </section>

      <DrillDrawerHost stack={stack} setStack={setStack} />
    </div>
  );
}
