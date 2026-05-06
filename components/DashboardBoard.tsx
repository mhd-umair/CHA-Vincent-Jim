"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InsightChart } from "@/components/InsightChart";
import { ResultTable } from "@/components/ResultTable";
import { STORAGE_INSIGHTS, type SavedInsight } from "@/lib/saved-insight";

type TileState =
  | { status: "loading" }
  | { status: "ok"; rows: Record<string, unknown>[] }
  | { status: "err"; message: string };

export function DashboardBoard() {
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [tiles, setTiles] = useState<Record<string, TileState>>({});

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_INSIGHTS);
    const list: SavedInsight[] = raw ? (JSON.parse(raw) as SavedInsight[]) : [];
    setInsights(list);
  }, []);

  useEffect(() => {
    if (insights.length === 0) return;
    let cancelled = false;

    async function loadOne(ins: SavedInsight) {
      setTiles((t) => ({ ...t, [ins.id]: { status: "loading" } }));
      try {
        const res = await fetch("/api/safe-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: ins.sql }),
        });
        const data = (await res.json()) as
          | { ok: true; rows: Record<string, unknown>[] }
          | { ok: false; error: string };
        if (cancelled) return;
        if (!data.ok) setTiles((t) => ({ ...t, [ins.id]: { status: "err", message: data.error } }));
        else setTiles((t) => ({ ...t, [ins.id]: { status: "ok", rows: data.rows } }));
      } catch {
        if (!cancelled) setTiles((t) => ({ ...t, [ins.id]: { status: "err", message: "Network error" } }));
      }
    }

    for (const ins of insights) void loadOne(ins);
    return () => {
      cancelled = true;
    };
  }, [insights]);

  if (insights.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--text)]">My dashboard</h1>
        <p className="max-w-xl text-sm text-[var(--muted)]">
          No saved insights yet. Run a question on{" "}
          <Link href="/explore" className="text-[var(--accent)] hover:underline">
            Ask data
          </Link>{" "}
          and choose <strong>Save to My dashboard</strong> to pin charts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">My dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tiles refresh from saved SQL (read-only, same guardrails as Explore). Layout is a simple vertical stack;
          reordering can be added later.
        </p>
      </div>

      <div className="grid gap-8">
        {insights.map((ins) => {
          const st = tiles[ins.id];
          return (
            <article
              key={ins.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
            >
              <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium text-[var(--text)]">{ins.title}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Saved {new Date(ins.createdAt).toLocaleString()} ·{" "}
                    <Link href="/explore" className="text-[var(--accent)] hover:underline">
                      Open Explore
                    </Link>
                  </p>
                </div>
              </header>
              {!st || st.status === "loading" ? (
                <p className="text-sm text-[var(--muted)]">Loading data…</p>
              ) : st.status === "err" ? (
                <p className="text-sm text-red-300">{st.message}</p>
              ) : (
                <>
                  <InsightChart chart={ins.chart} rows={st.rows} />
                  <ResultTable rows={st.rows} maxHeightClass="max-h-56" />
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
