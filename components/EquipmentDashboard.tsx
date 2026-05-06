"use client";

import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type { UnitStatusRow } from "@/lib/dashboard-queries";
import type {
  EquipmentKpis,
  NewVsUsedRow,
  TradeInActivityRow,
  UnitAgingRow,
  UnitsByCategoryRow,
} from "@/lib/equipment-queries";
import type { DateRange } from "@/lib/sql-constants";

const inventoryByCategoryChart: ChartSpecResolved = {
  type: "bar",
  title: "Inventory by category",
  xField: "Category",
  yFields: ["units"],
  xLabel: "Category",
  yLabel: "Unit count",
};

const retailByCategoryChart: ChartSpecResolved = {
  type: "bar",
  title: "Retail value by category",
  xField: "Category",
  yFields: ["retail"],
  xLabel: "Category",
  yLabel: "Retail value (USD)",
};

const newVsUsedChart: ChartSpecResolved = {
  type: "pie",
  title: "New vs used",
  xField: "condition",
  yFields: ["units"],
};

const agingChart: ChartSpecResolved = {
  type: "bar",
  title: "Unit aging buckets",
  xField: "bucket",
  yFields: ["units"],
  xLabel: "Age bucket",
  yLabel: "Unit count",
};

const tradeInChart: ChartSpecResolved = {
  type: "line",
  title: "Trade-in activity",
  xField: "month",
  yFields: ["value"],
  xLabel: "Month",
  yLabel: "Trade value (USD)",
};

const stockStatusChart: ChartSpecResolved = {
  type: "bar",
  title: "Active units by stock status",
  xField: "StockStatus",
  yFields: ["units"],
  xLabel: "Stock status",
  yLabel: "Unit count",
};

type Props = {
  kpis: EquipmentKpis;
  byCategory: UnitsByCategoryRow[];
  newVsUsed: NewVsUsedRow[];
  aging: UnitAgingRow[];
  tradeIns: TradeInActivityRow[];
  units: UnitStatusRow[];
  range: DateRange;
  rangeLabel: string;
};

export function EquipmentDashboard({
  kpis,
  byCategory,
  newVsUsed,
  aging,
  tradeIns,
  units,
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
  const num = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Equipment dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Inventory health, retail value, aging, mix, and trade-in activity.
          KPIs marked range-independent reflect master records; trade-in
          activity uses the active range. Active range:{" "}
          <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Active units"
          value={num(kpis.activeUnits)}
          hint="Rows in UnitBase with IsActive = 1 (range-independent)."
        />
        <KpiCard
          label="In-stock retail value"
          value={money(kpis.inStockRetailValue)}
          hint="Sum of BaseRetail across in-stock active units."
        />
        <KpiCard
          label="In-stock cost"
          value={money(kpis.inStockCost)}
          hint="Sum of BaseCost across in-stock active units."
        />
        <KpiCard
          label="Avg margin %"
          value={`${kpis.marginPct.toFixed(1)}%`}
          hint="(Retail − Cost) / Retail across in-stock units."
        />
        <KpiCard
          label="Avg aging"
          value={`${num(kpis.avgAgingDays)} d`}
          hint="Mean days since DateReceived for in-stock units."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Inventory by category
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to see in-stock units in that category.
          </p>
          <InsightChart
            chart={inventoryByCategoryChart}
            rows={byCategory as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `In-stock units — ${label}`,
                  request: { kind: "unitsByCategory", category: label },
                },
              ])
            }
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Retail value by category
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Total BaseRetail for in-stock active units.
          </p>
          <InsightChart
            chart={retailByCategoryChart}
            rows={byCategory as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `In-stock units — ${label}`,
                  request: { kind: "unitsByCategory", category: label },
                },
              ])
            }
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            New vs used
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Split of in-stock units by UnitCondition.IsNew.
          </p>
          <InsightChart
            chart={newVsUsedChart}
            rows={newVsUsed as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              const condition = label === "New" ? "New" : "Used";
              setStack([
                {
                  title: `In-stock units — ${condition}`,
                  request: { kind: "unitsByCondition", condition },
                },
              ]);
            }}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Unit aging buckets
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Days since DateReceived for in-stock units.
          </p>
          <InsightChart
            chart={agingChart}
            rows={aging as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              const bucket = label as
                | "0-30"
                | "31-90"
                | "91-180"
                | "180+";
              setStack([
                {
                  title: `In-stock units — ${bucket} days`,
                  request: { kind: "unitsByAgingBucket", bucket },
                },
              ]);
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Trade-in activity
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Monthly trade-in dollar volume on posted invoices. Click a point
          to see the contributing trade-in lines.
        </p>
        {tradeIns.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No trade-in activity in this range.
          </p>
        ) : (
          <InsightChart
            chart={tradeInChart}
            rows={tradeIns as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Trade-ins — ${label}`,
                  subtitle: rangeLabel,
                  request: {
                    kind: "tradeInsForMonth",
                    range,
                    month: label,
                  },
                },
              ])
            }
          />
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Active units by stock status
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Active rows in UnitBase grouped by raw StockStatus
          (range-independent). Click a bar to drill into that status.
        </p>
        <InsightChart
          chart={stockStatusChart}
          rows={units as unknown as Record<string, unknown>[]}
          onDatumClick={({ label }) =>
            setStack([
              {
                title: `Active units — ${label}`,
                request: { kind: "unitsByStatus", stockStatus: label },
              },
            ])
          }
        />
      </section>

      <DrillDrawerHost stack={stack} setStack={setStack} />
    </div>
  );
}
