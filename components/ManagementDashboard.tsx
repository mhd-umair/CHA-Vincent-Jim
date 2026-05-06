"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { ResultTable } from "@/components/ResultTable";
import { SearchBox } from "@/components/SearchBox";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type {
  CustomerLeaderRow,
  MonthlyRevenueRow,
  RevenueByLocationRow,
  RevenueByTypeRow,
  UnitStatusRow,
} from "@/lib/dashboard-queries";
import type {
  ContactCompletenessRow,
  DecliningCustomerRow,
  DormantCustomerRow,
} from "@/lib/customer-health-queries";
import type { DateRange } from "@/lib/sql-constants";
import type { DrillKind } from "@/lib/drill-types";

type Kpis = {
  totalRevenue: number;
  invoiceCount: number;
  avgInvoice: number;
  activeCustomers: number;
  unitsInStock: number;
};

const monthlyChart: ChartSpecResolved = {
  type: "line",
  title: "Posted sales revenue by month",
  xField: "month",
  yFields: ["revenue"],
  xLabel: "Month",
  yLabel: "Revenue (USD)",
};

const typeMixChart: ChartSpecResolved = {
  type: "pie",
  title: "Revenue mix by invoice type",
  xField: "InvoiceType",
  yFields: ["revenue"],
};

const leadersChart: ChartSpecResolved = {
  type: "bar",
  title: "Top customers",
  xField: "CustomerName",
  yFields: ["revenue"],
  xLabel: "Customer",
  yLabel: "Revenue (USD)",
};

const unitsChart: ChartSpecResolved = {
  type: "bar",
  title: "Active units by stock status",
  xField: "StockStatus",
  yFields: ["units"],
  xLabel: "Stock status",
  yLabel: "Unit count",
};

const locationChart: ChartSpecResolved = {
  type: "bar",
  title: "Revenue by branch",
  xField: "Location",
  yFields: ["revenue"],
  xLabel: "Branch / Location",
  yLabel: "Revenue (USD)",
};

const contactCompletenessChart: ChartSpecResolved = {
  type: "bar",
  title: "Contact completeness",
  xField: "bucket",
  yFields: ["count"],
  xLabel: "Contact status",
  yLabel: "Customer count",
};

/** Drill kinds whose rows are customers that should route to /customers/:id. */
const CUSTOMER_LIST_KINDS = new Set<DrillKind>([
  "decliningCustomers",
  "dormantCustomers",
  "contactCompleteness",
]);

/** Map the chart's display label back to the contact-completeness bucket key. */
const BUCKET_LABEL_TO_KEY: Record<
  string,
  "no_contacts" | "missing_email" | "missing_phone" | "complete"
> = {
  "No contacts on file": "no_contacts",
  "Missing email": "missing_email",
  "Missing phone": "missing_phone",
  "Complete (email + phone)": "complete",
};

type Props = {
  kpis: Kpis;
  monthly: MonthlyRevenueRow[];
  typeMix: RevenueByTypeRow[];
  leaders: CustomerLeaderRow[];
  units: UnitStatusRow[];
  byLocation: RevenueByLocationRow[];
  decliningCustomers: DecliningCustomerRow[];
  dormantCustomers: DormantCustomerRow[];
  contactCompleteness: ContactCompletenessRow[];
  range: DateRange;
  rangeLabel: string;
};

/** "Sale (in)" -> "in", "Work order (wo)" -> "wo", "Rental (rl)" -> "rl". */
function extractTypeCode(label: string): string {
  const m = label.match(/\(([a-z]+)\)\s*$/i);
  return m ? m[1].toLowerCase() : label;
}

export function ManagementDashboard({
  kpis,
  monthly,
  typeMix,
  leaders,
  units,
  byLocation,
  decliningCustomers,
  dormantCustomers,
  contactCompleteness,
  range,
  rangeLabel,
}: Props) {
  const router = useRouter();
  const [stack, setStack] = useState<DrillFrame[]>([]);
  const [leaderQuery, setLeaderQuery] = useState("");
  const filteredLeaders = useMemo(() => {
    const q = leaderQuery.trim().toLowerCase();
    if (!q) return leaders;
    return leaders.filter((c) => c.CustomerName.toLowerCase().includes(q));
  }, [leaders, leaderQuery]);
  const money = (n: number) =>
    n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const pct = (n: number) =>
    `${(n * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;

  const decliningTopRows = decliningCustomers.slice(0, 5).map((r) => ({
    Customer: r.CustomerName,
    "Prior 90d": money(r.prior_revenue),
    "Current 90d": money(r.current_revenue),
    Drop: pct(r.drop_pct),
    CustomerId: r.CustomerId,
  }));
  const dormantTopRows = dormantCustomers.slice(0, 5).map((r) => ({
    Customer: r.CustomerName,
    "Last activity": r.last_activity ?? "—",
    "Lifetime revenue": money(r.lifetime_revenue),
    Invoices: r.lifetime_invoices,
    CustomerId: r.CustomerId,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          Management dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
          Executive view of revenue, customers, and inventory. Posted standard
          invoice metrics use status <code className="text-[var(--accent)]">finalized</code>{" "}
          / <code className="text-[var(--accent)]">archived</code>, type{" "}
          <code className="text-[var(--accent)]">in</code>. Active range:{" "}
          <strong>{rangeLabel}</strong>.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Posted sales revenue"
          value={money(kpis.totalRevenue)}
          hint={`Sum of TotalInvoice on posted standard invoices in ${rangeLabel}.`}
          onClick={() =>
            setStack([
              {
                title: "Posted standard sales — invoices in range",
                subtitle: rangeLabel,
                request: { kind: "postedStandardInvoicesInRange", range },
              },
            ])
          }
        />
        <KpiCard
          label="Posted invoice count"
          value={kpis.invoiceCount.toLocaleString()}
          hint="Number of qualifying invoices in the same window."
          onClick={() =>
            setStack([
              {
                title: "Posted standard sales — invoices in range",
                subtitle: rangeLabel,
                request: { kind: "postedStandardInvoicesInRange", range },
              },
            ])
          }
        />
        <KpiCard
          label="Average invoice"
          value={money(kpis.avgInvoice)}
          hint="Revenue divided by invoice count."
        />
        <KpiCard
          label="Active customers"
          value={kpis.activeCustomers.toLocaleString()}
          hint="Customers flagged active in Customer master (range-independent)."
        />
        <KpiCard
          label="Active unit records"
          value={kpis.unitsInStock.toLocaleString()}
          hint="Rows in UnitBase with IsActive = 1 (range-independent)."
          onClick={() =>
            setStack([
              {
                title: "In-stock units (all statuses except sold/voided/deleted/transferred)",
                request: { kind: "allInStockUnits" },
              },
            ])
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">Sales trend</h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a month to drill into invoices for that month.
          </p>
          <InsightChart
            chart={monthlyChart}
            rows={monthly as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) =>
              setStack([
                {
                  title: `Posted standard sales — ${label}`,
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
            Revenue mix by invoice type
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Standard sale, work order, rental — share of posted revenue.
          </p>
          <InsightChart
            chart={typeMixChart}
            rows={typeMix as unknown as Record<string, unknown>[]}
            onDatumClick={({ label }) => {
              const code = extractTypeCode(label);
              setStack([
                {
                  title: `Posted invoices — ${label}`,
                  subtitle: rangeLabel,
                  request: { kind: "invoicesByType", range, invoiceType: code },
                },
              ]);
            }}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Customer leaderboard
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Click a bar to open the customer profile.
          </p>
          <div className="mb-3">
            <SearchBox
              value={leaderQuery}
              onChange={setLeaderQuery}
              placeholder="Filter customers…"
              ariaLabel="Filter top customers"
            />
          </div>
          <InsightChart
            chart={leadersChart}
            rows={filteredLeaders as unknown as Record<string, unknown>[]}
            onDatumClick={({ row }) => {
              const id = row.CustomerId;
              if (typeof id === "number") router.push(`/customers/${id}`);
            }}
          />
          {filteredLeaders.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--muted)]">No customers match.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
              {filteredLeaders.slice(0, 5).map((c) => (
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
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Inventory — units by status
          </h2>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Active rows in UnitBase grouped by StockStatus (range-independent).
          </p>
          <InsightChart
            chart={unitsChart}
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
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">
            Customer health
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Rolling 90-day revenue declines, dormant accounts, and contact
            data completeness — anchored to today, independent of the page
            range.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Declining customers
            </h3>
            <p className="mb-2 text-xs text-[var(--muted)]">
              Top 5 with ≥30% drop in trailing-90 vs prior-90 day revenue.
              Click a row to open the customer profile.
            </p>
            {decliningTopRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                No qualifying declines.
              </p>
            ) : (
              <ResultTable
                rows={decliningTopRows as unknown as Record<string, unknown>[]}
                maxHeightClass="max-h-72"
                onRowClick={(row) => {
                  const id = Number(row.CustomerId);
                  if (Number.isFinite(id) && id > 0) {
                    router.push(`/customers/${id}`);
                  }
                }}
              />
            )}
            <div className="mt-3 text-right">
              <button
                type="button"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
                onClick={() =>
                  setStack([
                    {
                      title: "Declining customers — top 25",
                      subtitle: "Trailing 90d vs prior 90d",
                      request: { kind: "decliningCustomers" },
                    },
                  ])
                }
              >
                View all →
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Dormant customers
            </h3>
            <p className="mb-2 text-xs text-[var(--muted)]">
              Active accounts with no posted standard sale in the last 180
              days, by lifetime revenue.
            </p>
            {dormantTopRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                No dormant customers.
              </p>
            ) : (
              <ResultTable
                rows={dormantTopRows as unknown as Record<string, unknown>[]}
                maxHeightClass="max-h-72"
                onRowClick={(row) => {
                  const id = Number(row.CustomerId);
                  if (Number.isFinite(id) && id > 0) {
                    router.push(`/customers/${id}`);
                  }
                }}
              />
            )}
            <div className="mt-3 text-right">
              <button
                type="button"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
                onClick={() =>
                  setStack([
                    {
                      title: "Dormant customers — top 50",
                      subtitle: "Last sale > 180 days ago",
                      request: { kind: "dormantCustomers" },
                    },
                  ])
                }
              >
                View all →
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Contact completeness
            </h3>
            <p className="mb-2 text-xs text-[var(--muted)]">
              Active customers grouped by available contact data. Click a
              bar to list the customers in that bucket.
            </p>
            <InsightChart
              chart={contactCompletenessChart}
              rows={
                contactCompleteness as unknown as Record<string, unknown>[]
              }
              onDatumClick={({ label }) => {
                const bucket = BUCKET_LABEL_TO_KEY[label];
                if (!bucket) return;
                setStack([
                  {
                    title: `Customers — ${label}`,
                    request: { kind: "contactCompleteness", bucket },
                  },
                ]);
              }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Revenue by branch
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Posted standard sales attributed to each store/location.
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
