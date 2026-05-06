import { ServiceDashboard } from "@/components/ServiceDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import {
  getEstimateVsActual,
  getLaborHoursByTechnician,
  getOpenWoByStatus,
  getScheduleAdherence,
  getServiceKpis,
  getWoAgingBuckets,
  getWoRevenueByMonth,
} from "@/lib/service-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function ServicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getServiceKpis(range);
  const openByStatus = getOpenWoByStatus();
  const techHours = getLaborHoursByTechnician(range, 10);
  const woMonthly = getWoRevenueByMonth(range);
  const aging = getWoAgingBuckets();
  const adherence = getScheduleAdherence(range);
  const estimateActual = getEstimateVsActual(range, 200);

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to labor hours, WO revenue, schedule adherence, and estimate-vs-actual. Open-WO status, aging, and avg open age are range-independent (current snapshot)."
      />
      <ServiceDashboard
        kpis={kpis}
        openByStatus={openByStatus}
        techHours={techHours}
        woMonthly={woMonthly}
        aging={aging}
        adherence={adherence}
        estimateActual={estimateActual}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
