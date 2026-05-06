"use client";

import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type {
  AdherenceRow,
  AgingRow,
  EstimateActualRow,
  ServiceKpis,
  TechHoursRow,
  WoMonthlyRow,
  WoStatusRow,
} from "@/lib/service-queries";
import type { DateRange } from "@/lib/sql-constants";

const woStatusChart: ChartSpecResolved = {
  type: "bar",
  title: "Open work orders by status",
  xField: "Status",
  yFields: ["count"],
  xLabel: "WO status",
  yLabel: "WO count",
};

const techHoursChart: ChartSpecResolved = {
  type: "bar",
  title: "Labor hours by technician",
  xField: "Technician",
  yFields: ["hours"],
  xLabel: "Technician",
  yLabel: "Hours",
};

const woRevenueChart: ChartSpecResolved = {
  type: "line",
  title: "WO revenue by month",
  xField: "month",
  yFields: ["revenue"],
  xLabel: "Month",
  yLabel: "Revenue (USD)",
};

const agingChart: ChartSpecResolved = {
  type: "bar",
  title: "Open WO aging",
  xField: "bucket",
  yFields: ["count"],
  xLabel: "Age bucket",
  yLabel: "WO count",
};

const adherenceChart: ChartSpecResolved = {
  type: "pie",
  title: "Schedule adherence",
  xField: "adherence",
  yFields: ["count"],
};

const estimateActualChart: ChartSpecResolved = {
  type: "scatter",
  title: "Estimate vs actual",
  xField: "DocNo",
  yFields: ["WOEstimate", "TotalInvoice"],
  xLabel: "WO estimate (USD)",
  yLabel: "Total invoice (USD)",
};

type AgingBucket = "0-7 days" | "8-30 days" | "31-90 days" | "90+ days";
type AdherenceBucket = "On time" | "Late" | "Missing data";

const AGING_BUCKETS = new Set<AgingBucket>([
  "0-7 days",
  "8-30 days",
  "31-90 days",
  "90+ days",
]);
const ADHERENCE_BUCKETS = new Set<AdherenceBucket>([
  "On time",
  "Late",
  "Missing data",
]);

type Props = {
  kpis: ServiceKpis;
  openByStatus: WoStatusRow[];
  techHours: TechHoursRow[];
  woMonthly: WoMonthlyRow[];
  aging: AgingRow[];
  adherence: AdherenceRow[];
  estimateActual: EstimateActualRow[];
  range: DateRange;
  rangeLabel: string;
};

export function ServiceDashboard({
  kpis,
  openByStatus,
  techHours,
  woMonthly,
  aging,
  adherence,
  estimateActual,
  range,
  rangeLabel,
}: Props) {
  const [stack, setStack] = useState<DrillFrame[]>([]);
  const money = (n: number) =>
    n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const num = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Service dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Shop throughput and technician load. Open WOs ={" "}
          <code className="text-[var(--accent)]">InvoiceType=&apos;wo&apos;</code> with
          status not in finalized/archived/voided. WO revenue uses posted (finalized
          + archived) work orders. Active range: <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Open work orders"
          value={kpis.openWoCount.toLocaleString()}
          hint="WO invoices not yet finalized/archived/voided (range-independent)."
          onClick={() =>
            setStack([
              {
                title: "All open work orders",
                request: { kind: "allOpenWos" },
              },
            ])
          }
        />
        <KpiCard
          label="Total labor hours"
          value={num(kpis.totalLaborHours)}
          hint="Sum of WorkInProgress.ElapsedHours for clock entries in range."
        />
        <KpiCard
          label="Avg open WO age"
          value={`${num(kpis.avgWoAgeDays)} d`}
          hint="Mean days since EntDate for currently open WOs (range-independent)."
        />
        <KpiCard
          label="WO revenue"
          value={money(kpis.woRevenue)}
          hint="Sum TotalInvoice on posted WO invoices in range."
        />
        <KpiCard
          label="WOs completed"
          value={kpis.woCompletedCount.toLocaleString()}
          hint="Count of posted WO invoices in range."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Open WOs by status
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to list open work orders in that status.
          </p>
          <InsightChart
            chart={woStatusChart}
            rows={openByStatus as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Open WOs — ${label}`,
                  request: { kind: "openWosByStatus", status: label },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Labor hours by technician
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Top {techHours.length} technicians by clocked hours in range.
          </p>
          <InsightChart
            chart={techHoursChart}
            rows={techHours as unknown as Record<string, unknown>[]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            WO revenue by month
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">Posted WO revenue trend.</p>
          <InsightChart
            chart={woRevenueChart}
            rows={woMonthly as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted WOs — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "invoicesForMonth",
                    range,
                    month: label,
                    invoiceType: "wo",
                  },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Open WO aging
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            How long current open work orders have been open.
          </p>
          <InsightChart
            chart={agingChart}
            rows={aging as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              if (!AGING_BUCKETS.has(label as AgingBucket)) return;
              setStack([
                {
                  title: `Open WOs — ${label}`,
                  request: {
                    kind: "openWosForAging",
                    bucket: label as AgingBucket,
                  },
                },
              ]);
            }}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Schedule adherence
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Comparing <code className="text-[var(--accent)]">ActualEndTime</code> vs{" "}
            <code className="text-[var(--accent)]">ScheduledEndTime</code> on posted WOs.
          </p>
          <InsightChart
            chart={adherenceChart}
            rows={adherence as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              if (!ADHERENCE_BUCKETS.has(label as AdherenceBucket)) return;
              setStack([
                {
                  title: `WOs — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "wosForAdherence",
                    range,
                    bucket: label as AdherenceBucket,
                  },
                },
              ]);
            }}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Estimate vs actual revenue
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Each dot is one posted WO. Diagonal would mean exact estimate.
          </p>
          <InsightChart
            chart={estimateActualChart}
            rows={estimateActual as unknown as Record<string, unknown>[]}
            onDatumClick={({ row, label }) => {
              const id = Number(row.InvoiceDocId);
              if (!Number.isFinite(id) || id <= 0) return;
              setStack([
                {
                  title: `WO ${label}`,
                  request: { kind: "invoiceDetail", invoiceDocId: id },
                },
              ]);
            }}
          />
        </div>
      </section>

      <DrillDrawerHost stack={stack} setStack={setStack} />
    </div>
  );
}
