import { SalesDashboard } from "@/components/SalesDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import {
  getAvgInvoiceTrend,
  getInvoiceCountByStatus,
  getQuotePipelineByStatus,
  getRevenueBySalesPerson,
  getSalesKpis,
  getSalesMonthlyRevenue,
  getTaxableMix,
  getTopCustomers,
} from "@/lib/sales-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getSalesKpis(range);
  const monthly = getSalesMonthlyRevenue(range);
  const bySalesPerson = getRevenueBySalesPerson(range, 10);
  const statusCounts = getInvoiceCountByStatus(range);
  const topCustomers = getTopCustomers(range, 10);
  const quotePipeline = getQuotePipelineByStatus(range);
  const avgTrend = getAvgInvoiceTrend(range);
  const taxableMix = getTaxableMix(range);

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to all sales metrics, leaderboards, and trend lines."
      />
      <SalesDashboard
        kpis={kpis}
        monthly={monthly}
        bySalesPerson={bySalesPerson}
        statusCounts={statusCounts}
        topCustomers={topCustomers}
        quotePipeline={quotePipeline}
        avgTrend={avgTrend}
        taxableMix={taxableMix}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
