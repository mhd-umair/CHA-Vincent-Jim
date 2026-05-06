"use client";

import { useRouter } from "next/navigation";
import { ResultTable } from "@/components/ResultTable";
import type { CustomerDirectoryRow } from "@/lib/customer-queries";

type Props = {
  rows: CustomerDirectoryRow[];
};

export function CustomerDirectoryTable({ rows }: Props) {
  const router = useRouter();
  const display = rows.map((r) => ({
    CustomerId: r.CustomerId,
    CustomerNo: r.CustomerNo,
    CustomerName: r.CustomerName,
    "Last activity": r.last_activity ?? "—",
    "Lifetime revenue (posted sales)": r.lifetime_revenue,
  }));
  return (
    <ResultTable
      rows={display as unknown as Record<string, unknown>[]}
      maxHeightClass="max-h-[32rem]"
      onRowClick={(row) => {
        const id = Number(row.CustomerId);
        if (Number.isFinite(id) && id > 0) router.push(`/customers/${id}`);
      }}
    />
  );
}
