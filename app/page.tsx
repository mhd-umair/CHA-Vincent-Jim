import { ManagementDashboard } from "@/components/ManagementDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import {
  getCustomerLeaders,
  getKpis,
  getMonthlyRevenue,
  getRevenueByInvoiceType,
  getRevenueByLocation,
  getUnitsByStockStatus,
} from "@/lib/dashboard-queries";
import {
  getContactCompleteness,
  getDecliningCustomers,
  getDormantCustomers,
} from "@/lib/customer-health-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getKpis(range);
  const monthly = getMonthlyRevenue(range);
  const typeMix = getRevenueByInvoiceType(range);
  const leaders = getCustomerLeaders(range, 12);
  const units = getUnitsByStockStatus();
  const byLocation = getRevenueByLocation(range);
  const decliningCustomers = getDecliningCustomers(5);
  const dormantCustomers = getDormantCustomers(5);
  const contactCompleteness = getContactCompleteness();

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to all revenue, leaderboard, branch, and trend widgets. KPIs marked range-independent always reflect master records."
      />
      <ManagementDashboard
        kpis={kpis}
        monthly={monthly}
        typeMix={typeMix}
        leaders={leaders}
        units={units}
        byLocation={byLocation}
        decliningCustomers={decliningCustomers}
        dormantCustomers={dormantCustomers}
        contactCompleteness={contactCompleteness}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
