import { notFound } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { ResultTable } from "@/components/ResultTable";
import {
  getUnitById,
  getUnitCustomerEvents,
  getUnitSerials,
} from "@/lib/equipment-queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function UnitPage({ params }: Props) {
  const { id } = await params;
  const unitId = parseInt(id, 10);
  if (!Number.isFinite(unitId)) notFound();

  const unit = getUnitById(unitId);
  if (!unit) notFound();

  const serials = getUnitSerials(unitId);
  const events = getUnitCustomerEvents(unitId);

  const money = (n: number) =>
    n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const heading =
    [unit.Make, unit.Model, unit.Year > 0 ? unit.Year : null]
      .filter(Boolean)
      .join(" ") || `Unit ${unit.UnitId}`;

  const stockStatus = unit.StockStatus || "Unknown";
  const activeLabel = unit.IsActive ? "Active" : "Inactive";

  const serialRows = serials.map((s) => ({
    "Serial #": s.SerialNo || "—",
    "Warranty date": s.WarrantyDate ?? "—",
  }));

  const eventRows = events.map((e) => ({
    "Event date": e.EventDate ?? "—",
    Activity: e.Activity || "—",
    Customer: e.CustomerName,
    "List amount": e.ListAmount,
    "Invoice amount": e.InvoiceAmount,
    "Trade amount": e.TradeAmount,
    Source: e.Source || "—",
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase text-[var(--muted)]">Unit insight</p>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{heading}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Stock # {unit.StockNo || "—"} · ID {unit.UnitId} · {stockStatus} ·{" "}
          {activeLabel} · {unit.Condition} · {unit.Category} · {unit.Location}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Retail"
          value={money(unit.BaseRetail)}
          hint="UnitBase.BaseRetail."
        />
        <KpiCard
          label="Cost"
          value={money(unit.BaseCost)}
          hint="UnitBase.BaseCost."
        />
        <KpiCard
          label="Margin"
          value={`${(Number(unit.MarginPct) || 0).toFixed(1)}%`}
          hint="UnitBase.MarginPct (configured on the unit record)."
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Serial numbers
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Active rows in UnitSerial for this unit.
        </p>
        {serialRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No active serial records for this unit.
          </p>
        ) : (
          <ResultTable
            rows={serialRows as unknown as Record<string, unknown>[]}
            maxHeightClass="max-h-[24rem]"
          />
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Customer / unit history
        </h2>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Active events from UnitCustomer (purchase, trade, transfer, etc.),
          ordered most recent first.
        </p>
        {eventRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No active customer events for this unit.
          </p>
        ) : (
          <ResultTable
            rows={eventRows as unknown as Record<string, unknown>[]}
            maxHeightClass="max-h-[32rem]"
          />
        )}
      </section>
    </div>
  );
}
