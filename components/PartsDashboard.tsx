"use client";

import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type {
  ManufacturerRevenueRow,
  PartPolicyRow,
  PartsKpis,
  PartsVelocityRow,
  ProductLineRow,
  TopPartQtyRow,
  TopPartRevenueRow,
} from "@/lib/parts-queries";
import type { DateRange } from "@/lib/sql-constants";

const topRevChart: ChartSpecResolved = {
  type: "bar",
  title: "Top parts by revenue",
  xField: "PartNo",
  yFields: ["line_revenue"],
  xLabel: "Part #",
  yLabel: "Line revenue (USD)",
};

const topQtyChart: ChartSpecResolved = {
  type: "bar",
  title: "Top parts by quantity",
  xField: "PartNo",
  yFields: ["qty"],
  xLabel: "Part #",
  yLabel: "Quantity sold",
};

const mfgChart: ChartSpecResolved = {
  type: "pie",
  title: "Parts revenue by manufacturer",
  xField: "Manufacturer",
  yFields: ["revenue"],
};

const velocityChart: ChartSpecResolved = {
  type: "line",
  title: "Parts sales velocity",
  xField: "month",
  yFields: ["line_revenue"],
  xLabel: "Month",
  yLabel: "Line revenue (USD)",
};

const policyChart: ChartSpecResolved = {
  type: "pie",
  title: "Stocking policy coverage at part locations",
  xField: "policy",
  yFields: ["count"],
};

const productLineChart: ChartSpecResolved = {
  type: "bar",
  title: "Parts revenue by product line",
  xField: "ProductLine",
  yFields: ["revenue"],
  xLabel: "Product line",
  yLabel: "Revenue (USD)",
};

type Props = {
  kpis: PartsKpis;
  topByRevenue: TopPartRevenueRow[];
  topByQty: TopPartQtyRow[];
  byManufacturer: ManufacturerRevenueRow[];
  velocity: PartsVelocityRow[];
  policy: PartPolicyRow[];
  byProductLine: ProductLineRow[];
  range: DateRange;
  rangeLabel: string;
};

export function PartsDashboard({
  kpis,
  topByRevenue,
  topByQty,
  byManufacturer,
  velocity,
  policy,
  byProductLine,
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
  const num = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const drillPart = (partNo: string) =>
    setStack([
      {
        title: `Part ${partNo}`,
        subtitle: rangeLabel,
        request: { kind: "partDetail", partNo, range },
      },
    ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Parts dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Parts revenue, quantity, mix, and stocking policy. Margin is
          estimated from <code className="text-[var(--accent)]">SalePart.NetExt</code>{" "}
          minus <code className="text-[var(--accent)]">Qty × AvgCost</code> on rows
          where AvgCost is populated. Active range: <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Parts revenue"
          value={money(kpis.partsRevenue)}
          hint="Sum of SalePart.NetExt on posted sale invoices."
        />
        <KpiCard
          label="Parts qty sold"
          value={num(kpis.partsQty)}
          hint="Sum of SalePart.Qty on posted sale invoices."
        />
        <KpiCard
          label="Distinct parts sold"
          value={num(kpis.distinctParts)}
          hint="Distinct PartId on posted sale invoices."
        />
        <KpiCard
          label="Estimated margin %"
          value={`${kpis.estMarginPct.toFixed(1)}%`}
          hint="(NetExt − Qty × AvgCost) / NetExt — only rows with AvgCost."
        />
        <KpiCard
          label="Stocking policy coverage"
          value={`${kpis.policyCoveragePct.toFixed(1)}%`}
          hint="Active PartLocation rows with min or max configured (range-independent)."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Top parts by revenue
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to open part detail and recent invoices.
          </p>
          <InsightChart
            chart={topRevChart}
            rows={topByRevenue as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => drillPart(label)}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Top parts by quantity
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Useful for high-volume / low-price stocking review.
          </p>
          <InsightChart
            chart={topQtyChart}
            rows={topByQty as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => drillPart(label)}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Revenue by manufacturer
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Top {byManufacturer.length} manufacturers by parts revenue.
          </p>
          <InsightChart
            chart={mfgChart}
            rows={byManufacturer as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Top parts — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "partsByManufacturer",
                    manufacturer: label,
                    range,
                  },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Parts sales velocity
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Posted parts revenue per month.
          </p>
          <InsightChart
            chart={velocityChart}
            rows={velocity as unknown as Record<string, unknown>[]}
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Stocking policy coverage
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Active PartLocation rows split by whether min/max is configured.
          </p>
          <InsightChart
            chart={policyChart}
            rows={policy as unknown as Record<string, unknown>[]}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Revenue by product line
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Posted parts revenue grouped by manufacturer&apos;s product line.
          </p>
          <InsightChart
            chart={productLineChart}
            rows={byProductLine as unknown as Record<string, unknown>[]}
          />
        </div>
      </section>

      <DrillDrawerHost stack={stack} setStack={setStack} />
    </div>
  );
}
