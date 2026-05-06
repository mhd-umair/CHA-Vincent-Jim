import { PartsDashboard } from "@/components/PartsDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import {
  getPartsKpis,
  getPartsPolicySummary,
  getPartsVelocity,
  getRevenueByManufacturer,
  getRevenueByProductLine,
  getTopPartsByQuantity,
  getTopPartsByRevenue,
} from "@/lib/parts-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function PartsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getPartsKpis(range);
  const topByRevenue = getTopPartsByRevenue(range, 10);
  const topByQty = getTopPartsByQuantity(range, 10);
  const byManufacturer = getRevenueByManufacturer(range, 6);
  const velocity = getPartsVelocity(range);
  const policy = getPartsPolicySummary();
  const byProductLine = getRevenueByProductLine(range, 10);

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to revenue, quantity, manufacturer mix, and velocity. Stocking policy is range-independent."
      />
      <PartsDashboard
        kpis={kpis}
        topByRevenue={topByRevenue}
        topByQty={topByQty}
        byManufacturer={byManufacturer}
        velocity={velocity}
        policy={policy}
        byProductLine={byProductLine}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
