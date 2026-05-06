"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DetailDrawer } from "@/components/DetailDrawer";
import { DrillContent, type DrillStatus } from "@/components/DrillContent";
import type {
  DrillKind,
  DrillKpi,
  DrillRequest,
  DrillResponse,
} from "@/lib/drill-types";

/** A single frame on the drill stack: title + subtitle + the request payload. */
export type DrillFrame = {
  title: string;
  subtitle?: string;
  request: DrillRequest;
};

type Props = {
  /** Stack of drill frames; top of stack is the visible drawer. */
  stack: DrillFrame[];
  /** Replace the entire stack (e.g. close drawer -> []). */
  setStack: (next: DrillFrame[]) => void;
  /**
   * Optional per-row click override. Receives the raw row plus the visible
   * frame for context. Return one of:
   *   • `void` / `true`  — the override handled the click (default sub-drill
   *     is suppressed). Use this for kinds like unit-list or customer-list
   *     that should route to a deep-link page.
   *   • `false`         — fall back to the host's built-in sub-drill (e.g.
   *     invoice row → `invoiceDetail`). Use this when the override only
   *     wants to handle a subset of frame kinds.
   */
  onRowClick?: (
    row: Record<string, unknown>,
    frame: DrillFrame,
  ) => void | boolean;
};

/** Kinds whose rows are invoices and that benefit from a sub-drill. */
const INVOICE_LIST_KINDS = new Set<DrillKind>([
  "invoicesForMonth",
  "invoicesByType",
  "invoicesForLocation",
  "invoicesForJurisdiction",
  "invoicesForSalesperson",
  "invoicesForQuoteStatus",
  "postedStandardInvoicesInRange",
]);

const UNIT_LIST_KINDS = new Set<DrillKind>([
  "unitsByStatus",
  "unitsByCategory",
  "unitsByCondition",
  "unitsByAgingBucket",
  "allInStockUnits",
]);

const INVOICE_SEARCH_COLS = [
  "DocNo",
  "InvoiceNo",
  "CustomerName",
  "PartNo",
  "Description",
  "Model",
];

function searchableColumnsForKind(kind: DrillKind): string[] | undefined {
  switch (kind) {
    case "invoicesForMonth":
    case "invoicesByType":
    case "invoicesForLocation":
    case "invoicesForJurisdiction":
    case "invoicesForSalesperson":
    case "invoicesForQuoteStatus":
    case "postedStandardInvoicesInRange":
      return INVOICE_SEARCH_COLS;
    case "partDetail":
      return INVOICE_SEARCH_COLS;
    case "partsByManufacturer":
      return ["PartNo", "Description", "CustomerName"];
    case "tradeInsForMonth":
      return ["DocNo", "CustomerName", "Description", "Model"];
    case "paymentsForMonth":
    case "paymentsByMethod":
      return ["DocNo", "CustomerName", "Method", "PmtType", "Summary"];
    case "decliningCustomers":
    case "dormantCustomers":
    case "contactCompleteness":
    case "receivablesByCoverage":
    case "topArCustomersDrill":
      return ["CustomerName", "CustomerNo"];
    case "unitsByStatus":
    case "unitsByCategory":
    case "unitsByCondition":
    case "unitsByAgingBucket":
    case "allInStockUnits":
      return ["StockNo", "Make", "Model", "Category", "Condition"];
    case "allOpenWos":
    case "openWosByStatus":
    case "openWosForAging":
      return ["DocNo", "CustomerName", "Status", "Technician"];
    case "wosForAdherence":
      return ["DocNo", "CustomerName"];
    case "invoiceDetail":
    case "segmentsForWo":
      return undefined;
    default:
      return undefined;
  }
}

/** Kinds whose rows are open WOs that benefit from a segments sub-drill. */
const OPEN_WO_KINDS = new Set<DrillKind>([
  "openWosByStatus",
  "openWosForAging",
  "wosForAdherence",
  "allOpenWos",
]);

/**
 * Hosts the drill drawer for a dashboard. Owns the per-frame fetch lifecycle
 * and renders the standard back/close chrome around `DrillContent`.
 */
export function DrillDrawerHost({ stack, setStack, onRowClick: onRowClickOverride }: Props) {
  const router = useRouter();
  const top = stack[stack.length - 1];
  const [state, setState] = useState<DrillStatus>({ status: "loading" });
  const [kpis, setKpis] = useState<DrillKpi[] | undefined>(undefined);

  const close = useCallback(() => setStack([]), [setStack]);
  const pop = useCallback(
    () => setStack(stack.slice(0, -1)),
    [stack, setStack],
  );

  useEffect(() => {
    if (!top) return;
    let cancelled = false;
    setState({ status: "loading" });
    setKpis(undefined);

    fetch("/api/drill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(top.request),
    })
      .then((r) => r.json() as Promise<DrillResponse>)
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setState({ status: "err", message: data.error });
          return;
        }
        setState({ status: "ok", rows: data.rows });
        setKpis(data.kpis);
      })
      .catch(() => {
        if (!cancelled) setState({ status: "err", message: "Network error." });
      });

    return () => {
      cancelled = true;
    };
  }, [top]);

  const onRowClick = useCallback(
    (row: Record<string, unknown>) => {
      if (!top) return;
      if (onRowClickOverride) {
        const result = onRowClickOverride(row, top);
        if (result !== false) return;
        // Override returned `false` → fall through to the built-in sub-drill.
      }
      const k = top.request.kind;
      if (UNIT_LIST_KINDS.has(k)) {
        const id = Number(row.UnitId);
        if (Number.isFinite(id) && id > 0) {
          router.push(`/units/${id}`);
        }
        return;
      }
      if (INVOICE_LIST_KINDS.has(k)) {
        const id = Number(row.InvoiceDocId);
        if (Number.isFinite(id) && id > 0) {
          setStack([
            ...stack,
            {
              title: `Invoice ${row.DocNo ?? row.InvoiceNo ?? id}`,
              subtitle: typeof row.CustomerName === "string" ? row.CustomerName : undefined,
              request: { kind: "invoiceDetail", invoiceDocId: id },
            },
          ]);
        }
        return;
      }
      if (OPEN_WO_KINDS.has(k)) {
        const id = Number(row.InvoiceDocId);
        if (Number.isFinite(id) && id > 0) {
          setStack([
            ...stack,
            {
              title: `Segments — WO ${row.DocNo ?? id}`,
              subtitle:
                typeof row.CustomerName === "string" ? row.CustomerName : undefined,
              request: { kind: "segmentsForWo", invoiceDocId: id },
            },
          ]);
        }
      }
    },
    [stack, setStack, top, onRowClickOverride, router],
  );

  if (!top) return null;

  const canGoBack = stack.length > 1;
  const header = canGoBack ? (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={pop}
        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        ← Back
      </button>
      <span className="text-xs text-[var(--muted)]">
        {stack.length} of {stack.length}
      </span>
    </div>
  ) : null;

  return (
    <DetailDrawer
      open
      onClose={close}
      title={top.title}
      subtitle={top.subtitle}
      header={header}
    >
      <DrillContent
        state={state}
        kpis={kpis}
        onRowClick={onRowClick}
        searchableColumns={
          top ? searchableColumnsForKind(top.request.kind) : undefined
        }
      />
    </DetailDrawer>
  );
}
