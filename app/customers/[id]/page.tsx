import { notFound } from "next/navigation";
import { ResultTable } from "@/components/ResultTable";
import { KpiCard } from "@/components/KpiCard";
import { InsightChart } from "@/components/InsightChart";
import { CustomerProfileDrills } from "@/components/CustomerProfileDrills";
import {
  getCustomerActivityTrend,
  getCustomerById,
  getCustomerContacts,
  getCustomerPurchasedParts,
  getCustomerRecentInvoices,
  getCustomerRevenueSummary,
} from "@/lib/customer-queries";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type { DateRange } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

const activityChart: ChartSpecResolved = {
  type: "line",
  title: "Monthly revenue",
  xField: "month",
  yFields: ["revenue"],
  xLabel: "Month",
  yLabel: "Revenue (USD)",
};

/**
 * Customer profile is range-independent today; sub-drills launched from this
 * page should cover all time so users can see the customer's full history.
 */
const FULL_RANGE: DateRange = { from: null, to: null };

type Props = { params: Promise<{ id: string }> };

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (!Number.isFinite(customerId)) notFound();

  const customer = getCustomerById(customerId);
  if (!customer) notFound();

  const summary = getCustomerRevenueSummary(customerId);
  const invoices = getCustomerRecentInvoices(customerId, 20);
  const parts = getCustomerPurchasedParts(customerId, 25);
  const contacts = getCustomerContacts(customerId);
  const trend = getCustomerActivityTrend(customerId);

  const money = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const contactRows = contacts.map((c) => ({
    Name: `${c.FirstName} ${c.LastName}`.trim() || "—",
    Title: c.TitleDept || "—",
    Email: c.Email ?? "—",
    Phone: c.Phone ?? "—",
    Primary: c.IsPrimary ? "Yes" : "No",
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase text-[var(--muted)]">Customer insight</p>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{customer.CustomerName}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          No. {customer.CustomerNo} · ID {customer.CustomerId}
          {customer.IsActive ? " · Active" : " · Inactive"}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Posted sales revenue"
          value={money(summary.revenue)}
          hint="Standard invoices, finalized/archived."
        />
        <KpiCard label="Posted invoices" value={String(summary.invoices)} hint="Same revenue filter." />
        <KpiCard
          label="Last activity"
          value={summary.lastActivity ?? "—"}
          hint="Latest ActivityDate on posted standard invoices."
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Recent invoices</h2>
        <ResultTable rows={invoices as unknown as Record<string, unknown>[]} maxHeightClass="max-h-[28rem]" />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">Activity trend</h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Posted standard-sale revenue per month — full history.
        </p>
        {trend.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No posted-sale activity yet.
          </p>
        ) : (
          <InsightChart
            chart={activityChart}
            rows={trend as unknown as Record<string, unknown>[]}
          />
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">Top purchased parts</h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Click a row to open part detail and recent invoices for that part.
        </p>
        <CustomerProfileDrills parts={parts} range={FULL_RANGE} />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">Contacts</h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Active contacts with their default email and phone.
        </p>
        {contactRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No contacts on file.
          </p>
        ) : (
          <ResultTable
            rows={contactRows as unknown as Record<string, unknown>[]}
            maxHeightClass="max-h-[24rem]"
          />
        )}
      </section>
    </div>
  );
}
