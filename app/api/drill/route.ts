import { NextResponse } from "next/server";
import {
  drillRequestSchema,
  type DrillKpi,
  type DrillResponse,
} from "@/lib/drill-types";
import {
  getDecliningCustomersDrill,
  getDormantCustomersDrill,
  getContactCompletenessDrill,
  getInvoiceById,
  getInvoicesByType,
  getInvoicesForJurisdiction,
  getInvoicesForLocation,
  getInvoicesForMonth,
  getInvoicesForQuoteStatus,
  getInvoicesForSalesperson,
  getOpenWosByStatus,
  getOpenWosForAging,
  getPartByNo,
  getPartsByManufacturer,
  getPaymentsByMethodDetail,
  getPaymentsForMonth,
  getSegmentsForWo,
  getTradeInsForMonth,
  getUnitsByAgingBucket,
  getUnitsByCategoryDrill,
  getUnitsByCondition,
  getUnitsByStatus,
  getWosForAdherence,
  getInvoicesForPart,
  getReceivablesByCoverage,
  getPostedStandardInvoicesInRange,
  getAllOpenWos,
  getAllInStockUnits,
  getTopArCustomersDrill,
} from "@/lib/drill-queries";

export const runtime = "nodejs";

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/**
 * Drill-down endpoint for dashboard drawers. The body is a discriminated union
 * (`kind`) plus typed params; we never receive SQL from the client, and every
 * downstream call is parameterized.
 */
export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<DrillResponse>(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const parsed = drillRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.join(".") ?? "request";
    const msg = issue?.message ?? "Invalid drill request.";
    return NextResponse.json<DrillResponse>(
      { ok: false, error: `${where}: ${msg}` },
      { status: 422 },
    );
  }

  const req2 = parsed.data;
  try {
    switch (req2.kind) {
      case "invoicesForMonth": {
        const rows = getInvoicesForMonth(req2.range, req2.month, {
          invoiceType: req2.invoiceType,
        });
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoicesByType": {
        const rows = getInvoicesByType(req2.range, req2.invoiceType);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoicesForLocation": {
        const rows = getInvoicesForLocation(req2.range, req2.location);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoicesForJurisdiction": {
        const rows = getInvoicesForJurisdiction(req2.range, req2.jurisdiction);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "unitsByStatus": {
        const rows = getUnitsByStatus(req2.stockStatus);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "partDetail": {
        const part = getPartByNo(req2.partNo);
        const rows = getInvoicesForPart(req2.partNo, req2.range);
        const totalQty = rows.reduce((s, r) => s + r.Qty, 0);
        const totalRev = rows.reduce((s, r) => s + r.NetExt, 0);
        const kpis: DrillKpi[] = [
          { label: "Invoices", value: rows.length.toLocaleString() },
          {
            label: "Total qty",
            value: totalQty.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            }),
          },
          { label: "Total revenue", value: money(totalRev) },
        ];
        if (part) {
          kpis.unshift({
            label: "Part",
            value: part.PartNo,
            hint: part.Description || part.Manufacturer,
          });
        }
        return NextResponse.json<DrillResponse>({
          ok: true,
          rows: rows as unknown as Record<string, unknown>[],
          kpis,
        });
      }
      case "partsByManufacturer": {
        const rows = getPartsByManufacturer(req2.manufacturer, req2.range);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "openWosByStatus": {
        const rows = getOpenWosByStatus(req2.status);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "openWosForAging": {
        const rows = getOpenWosForAging(req2.bucket);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "wosForAdherence": {
        const rows = getWosForAdherence(req2.range, req2.bucket);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoiceDetail": {
        const r = getInvoiceById(req2.invoiceDocId);
        if (!r) {
          return NextResponse.json<DrillResponse>(
            { ok: false, error: "Invoice not found." },
            { status: 404 },
          );
        }
        const kpis: DrillKpi[] = [
          { label: "Doc no.", value: r.DocNo || r.InvoiceNo || "—" },
          { label: "Customer", value: r.CustomerName || "—" },
          { label: "Total", value: money(r.TotalInvoice) },
        ];
        return NextResponse.json<DrillResponse>({
          ok: true,
          rows: [r as unknown as Record<string, unknown>],
          kpis,
        });
      }
      case "segmentsForWo": {
        const rows = getSegmentsForWo(req2.invoiceDocId);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "paymentsByMethod": {
        const rows = getPaymentsByMethodDetail(req2.range, req2.method);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "paymentsForMonth": {
        const rows = getPaymentsForMonth(req2.range, req2.month);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoicesForSalesperson": {
        const rows = getInvoicesForSalesperson(req2.range, req2.salesPersonName);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "invoicesForQuoteStatus": {
        const rows = getInvoicesForQuoteStatus(req2.range, req2.quoteStatus);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "unitsByCategory": {
        const rows = getUnitsByCategoryDrill(req2.category);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "unitsByCondition": {
        const rows = getUnitsByCondition(req2.condition);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "unitsByAgingBucket": {
        const rows = getUnitsByAgingBucket(req2.bucket);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "tradeInsForMonth": {
        const rows = getTradeInsForMonth(req2.range, req2.month);
        const totalValue = rows.reduce((s, r) => s + r.TradeValue, 0);
        const kpis: DrillKpi[] = [
          { label: "Trade-ins", value: rows.length.toLocaleString() },
          { label: "Total trade value", value: money(totalValue) },
        ];
        return NextResponse.json<DrillResponse>({
          ok: true,
          rows: rows as unknown as Record<string, unknown>[],
          kpis,
        });
      }
      case "decliningCustomers": {
        const { rows, kpis } = getDecliningCustomersDrill();
        return NextResponse.json<DrillResponse>({ ok: true, rows, kpis });
      }
      case "dormantCustomers": {
        const { rows, kpis } = getDormantCustomersDrill(req2.sinceDays);
        return NextResponse.json<DrillResponse>({ ok: true, rows, kpis });
      }
      case "contactCompleteness": {
        const rows = getContactCompletenessDrill(req2.bucket);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "receivablesByCoverage": {
        const rows = getReceivablesByCoverage(req2.range, req2.bucket);
        const totalBalance = rows.reduce((s, r) => s + r.balance, 0);
        const totalInvoices = rows.reduce((s, r) => s + r.invoices, 0);
        const kpis: DrillKpi[] = [
          { label: "Customers", value: rows.length.toLocaleString() },
          {
            label: req2.bucket === "with_ar" ? "Outstanding AR" : "Net balance",
            value: money(totalBalance),
            hint:
              req2.bucket === "with_ar"
                ? "Sum of remaining balances across these customers."
                : "Sum across customers; ≤ 0 means paid in full or overpaid.",
          },
          { label: "Invoices", value: totalInvoices.toLocaleString() },
        ];
        return NextResponse.json<DrillResponse>({
          ok: true,
          rows: rows as unknown as Record<string, unknown>[],
          kpis,
        });
      }
      case "postedStandardInvoicesInRange": {
        const rows = getPostedStandardInvoicesInRange(req2.range);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "allOpenWos": {
        const rows = getAllOpenWos();
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "allInStockUnits": {
        const rows = getAllInStockUnits();
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
      case "topArCustomersDrill": {
        const rows = getTopArCustomersDrill(req2.range);
        return NextResponse.json<DrillResponse>({ ok: true, rows });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Drill query failed.";
    return NextResponse.json<DrillResponse>(
      { ok: false, error: msg },
      { status: 422 },
    );
  }

  return NextResponse.json<DrillResponse>(
    { ok: false, error: "Unhandled drill kind." },
    { status: 400 },
  );
}
