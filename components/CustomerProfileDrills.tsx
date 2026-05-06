"use client";

import { useState } from "react";
import { ResultTable } from "@/components/ResultTable";
import { DrillDrawerHost, type DrillFrame } from "@/components/DrillDrawerHost";
import type { DateRange } from "@/lib/sql-constants";

type PartRow = {
  PartNo: string;
  Description: string;
  qty: number;
  revenue: number;
  last_purchase: string | null;
};

type Props = {
  parts: PartRow[];
  /**
   * Customer profile is intentionally range-independent today, so callers
   * should pass `{ from: null, to: null }`. Sub-drills (e.g. invoice detail)
   * inside the drawer will then cover all time.
   */
  range: DateRange;
};

/**
 * Owns the drill-drawer state for the customer profile page so the page
 * itself can stay a Server Component for SQL fetching. Renders the
 * "Top purchased parts" table with row-click → part-detail drawer.
 */
export function CustomerProfileDrills({ parts, range }: Props) {
  const [stack, setStack] = useState<DrillFrame[]>([]);

  if (parts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        No parts purchased on posted invoices.
      </p>
    );
  }

  return (
    <>
      <ResultTable
        rows={parts as unknown as Record<string, unknown>[]}
        maxHeightClass="max-h-[28rem]"
        onRowClick={(row) => {
          const partNo = typeof row.PartNo === "string" ? row.PartNo : null;
          if (!partNo) return;
          setStack([
            {
              title: `Part ${partNo}`,
              subtitle:
                typeof row.Description === "string" ? row.Description : undefined,
              request: { kind: "partDetail", partNo, range },
            },
          ]);
        }}
      />
      <DrillDrawerHost stack={stack} setStack={setStack} />
    </>
  );
}
