import { FinanceDashboard } from "@/components/FinanceDashboard";
import { DateRangeControls } from "@/components/DateRangeControls";
import {
  getFinanceKpis,
  getPaymentActivityByMonth,
  getPaymentsByCustomer,
  getPaymentsByMethod,
  getReceivablesCoverage,
  getRevenueByLocation,
  getTaxByJurisdiction,
  getTaxableMix,
  getTopArCustomers,
} from "@/lib/finance-queries";
import { parseDateRange, rangeLabel } from "@/lib/sql-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string | string[]; to?: string | string[] }>;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params);
  const kpis = getFinanceKpis(range);
  const byMethod = getPaymentsByMethod(range, 8);
  const paymentTrend = getPaymentActivityByMonth(range);
  const taxByJur = getTaxByJurisdiction(range, 10);
  const taxable = getTaxableMix(range);
  const byLocation = getRevenueByLocation(range);
  const topAr = getTopArCustomers(range, 10);
  const arCoverage = getReceivablesCoverage(range);
  const paymentsByCustomer = getPaymentsByCustomer(range, 10);

  return (
    <div className="space-y-6">
      <DateRangeControls
        from={range.from}
        to={range.to}
        label="Filter applies to revenue, tax, payments, and AR balances."
      />
      <FinanceDashboard
        kpis={kpis}
        byMethod={byMethod}
        paymentTrend={paymentTrend}
        taxByJur={taxByJur}
        taxable={taxable}
        byLocation={byLocation}
        topAr={topAr}
        arCoverage={arCoverage}
        paymentsByCustomer={paymentsByCustomer}
        range={range}
        rangeLabel={rangeLabel(range)}
      />
    </div>
  );
}
