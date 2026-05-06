"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { ResultTable } from "@/components/ResultTable";
import { SearchBox } from "@/components/SearchBox";

export type DrillStatus =
  | { status: "loading" }
  | { status: "ok"; rows: Record<string, unknown>[] }
  | { status: "err"; message: string };

type Props = {
  state: DrillStatus;
  /** Optional KPI cards rendered above the table. */
  kpis?: { label: string; value: string; hint?: string }[];
  /** Empty-state copy when rows.length === 0. */
  emptyMessage?: string;
  /** Optional per-row click handler. */
  onRowClick?: (row: Record<string, unknown>) => void;
  /**
   * When supplied, renders a search box above the table that filters the
   * rows to those whose value in any of these columns contains the typed
   * query (case-insensitive `String(...)` match). Missing columns on a row
   * are silently ignored, so it's safe to pass a superset for shapes that
   * vary across drill kinds.
   */
  searchableColumns?: string[];
};

/**
 * Body of a drill drawer: KPI strip + result table, with shared loading and
 * error treatments. Styling mirrors `ExploreClient` for consistency.
 */
export function DrillContent({
  state,
  kpis,
  emptyMessage = "No matching rows.",
  onRowClick,
  searchableColumns,
}: Props) {
  const [query, setQuery] = useState("");
  const rows = state.status === "ok" ? state.rows : [];
  const filteredRows = useMemo(() => {
    if (!searchableColumns || searchableColumns.length === 0) return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchableColumns.some((col) => {
        const v = row[col];
        if (v === null || v === undefined) return false;
        return String(v).toLowerCase().includes(q);
      }),
    );
  }, [rows, searchableColumns, query]);

  if (state.status === "loading") {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        Loading…
      </p>
    );
  }

  if (state.status === "err") {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        {state.message}
      </div>
    );
  }

  const showSearch = !!searchableColumns && searchableColumns.length > 0;
  const filteredEmpty =
    showSearch && rows.length > 0 && filteredRows.length === 0;

  return (
    <div className="space-y-4">
      {kpis && kpis.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard key={k.label} label={k.label} value={k.value} hint={k.hint} />
          ))}
        </div>
      ) : null}

      {showSearch ? (
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search results…"
          ariaLabel="Search results"
        />
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          {emptyMessage}
        </p>
      ) : filteredEmpty ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No rows match “{query}”.
        </p>
      ) : (
        <ResultTable
          rows={filteredRows}
          maxHeightClass="max-h-[60vh]"
          onRowClick={onRowClick}
        />
      )}
    </div>
  );
}
