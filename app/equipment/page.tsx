import { EquipmentDashboard } from "@/components/EquipmentDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import { getUnitsByStockStatus } from "@/lib/dashboard-queries";
import {
  getEquipmentKpis,
  getNewVsUsed,
  getTradeInActivity,
  getUnitAgingBuckets,
  getUnitsByCategory,
} from "@/lib/equipment-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getEquipmentKpis();
  const byCategory = getUnitsByCategory();
  const newVsUsed = getNewVsUsed();
  const aging = getUnitAgingBuckets();
  const tradeIns = getTradeInActivity(range);
  const units = getUnitsByStockStatus();

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to trade-in activity. KPIs and inventory composition use master records and are range-independent."
      />
      <EquipmentDashboard
        kpis={kpis}
        byCategory={byCategory}
        newVsUsed={newVsUsed}
        aging={aging}
        tradeIns={tradeIns}
        units={units}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
