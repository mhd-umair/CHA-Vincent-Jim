"use client";

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return String(v);
    if (Math.abs(v) >= 1e6) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v);
}

type Props = {
  rows: Record<string, unknown>[];
  maxHeightClass?: string;
  /**
   * Optional per-row click handler. When supplied, rows become focusable and
   * Enter/Space activate the handler. We avoid `role="button"` on the `<tr>`
   * to keep the implicit `tablerow` role intact for accessibility tools.
   */
  onRowClick?: (row: Record<string, unknown>) => void;
};

export function ResultTable({ rows, maxHeightClass = "max-h-80", onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        No rows returned.
      </p>
    );
  }

  const cols = Object.keys(rows[0] ?? {});
  const clickable = typeof onRowClick === "function";

  return (
    <div className={`overflow-auto rounded-lg border border-[var(--border)] ${maxHeightClass}`}>
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--surface-hover)] text-xs uppercase text-[var(--muted)]">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`bg-[var(--surface)] hover:bg-[var(--surface-hover)] ${
                clickable
                  ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  : ""
              }`}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onRowClick?.(row) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick?.(row);
                      }
                    }
                  : undefined
              }
            >
              {cols.map((c) => (
                <td key={c} className="max-w-xs truncate px-3 py-2 tabular-nums text-[var(--text)]">
                  {fmt(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
