"use client";

import { useCallback, useState } from "react";
import { InsightChart } from "@/components/InsightChart";
import { ResultTable } from "@/components/ResultTable";
import type { ChartSpecResolved } from "@/lib/chart-spec";
import type { Intent } from "@/lib/intent";
import type { ExploreMessage } from "@/lib/nl-query";
import { STORAGE_INSIGHTS, type SavedInsight } from "@/lib/saved-insight";

type ExploreOk = {
  ok: true;
  sql: string;
  rows: Record<string, unknown>[];
  chart: ChartSpecResolved;
  summary: string;
  drillDownPrompts: string[];
  interpretation: Intent;
  interpretationLabel: string;
  source: "composed" | "freeform";
  trace: string[];
};

type ExploreFail = { ok: false; error: string };

export function ExploreClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ExploreMessage[]>([]);
  const [last, setLast] = useState<ExploreOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const runExplore = useCallback(
    async (opts: { userText: string; drillContext?: string; appendUser?: boolean }) => {
      const { userText, drillContext, appendUser = true } = opts;
      if (!userText.trim() && !drillContext) return;

      setError(null);
      setSaveMsg(null);
      setLoading(true);

      const nextMessages: ExploreMessage[] =
        appendUser && userText.trim()
          ? [...messages, { role: "user", content: userText.trim() }]
          : [...messages];

      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            drillContext,
          }),
        });
        const data = (await res.json()) as ExploreOk | ExploreFail;

        if (!data.ok) {
          setError(data.error);
          setLoading(false);
          return;
        }

        const assistantText = data.summary;
        const withAssistant: ExploreMessage[] = [
          ...nextMessages,
          { role: "assistant", content: assistantText },
        ];
        setMessages(withAssistant);
        setLast(data);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    },
    [messages],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    void runExplore({ userText: t });
  };

  const onChartClick = (ctx: { label: string; row: Record<string, unknown> }) => {
    const keys = Object.keys(ctx.row).slice(0, 8).join(", ");
    const userText = `Drill down for "${ctx.label}" from the previous chart.`;
    const drillContext = `Chart click. Label: "${ctx.label}". Row snapshot (partial keys): ${keys}. Values: ${JSON.stringify(ctx.row).slice(0, 1200)}`;
    void runExplore({ userText, drillContext });
  };

  const saveInsight = () => {
    if (!last) return;
    const title =
      messages.filter((m) => m.role === "user").pop()?.content?.slice(0, 80) ?? "Saved insight";
    const insight: SavedInsight = {
      id: crypto.randomUUID(),
      title,
      question: title,
      sql: last.sql,
      chart: last.chart,
      createdAt: new Date().toISOString(),
    };
    const raw = localStorage.getItem(STORAGE_INSIGHTS);
    const list: SavedInsight[] = raw ? (JSON.parse(raw) as SavedInsight[]) : [];
    list.unshift(insight);
    localStorage.setItem(STORAGE_INSIGHTS, JSON.stringify(list.slice(0, 50)));

    setSaveMsg("Saved to My dashboard.");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Ask your data</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Questions run as read-only SQL against the Perseus warehouse. Results include a chart when
            the shape fits, plus the full row set.
          </p>
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Try: “Top 10 parts by revenue last year” or “Units by stock status.”</p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-6 bg-[var(--accent-dim)]/30 text-[var(--text)]"
                    : "mr-6 border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
                }`}
              >
                {m.content}
              </div>
            ))
          )}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Ask in plain English…"
            className="resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "Running…" : "Run"}
            </button>
            {last ? (
              <button
                type="button"
                onClick={saveInsight}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)]"
              >
                Save to My dashboard
              </button>
            ) : null}
          </div>
        </form>

        {error ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
        ) : null}
        {saveMsg ? <p className="text-sm text-[var(--positive)]">{saveMsg}</p> : null}

        {last && last.drillDownPrompts.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-[var(--muted)]">Suggested follow-ups</p>
            <div className="flex flex-wrap gap-2">
              {last.drillDownPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void runExplore({ userText: p })}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-left text-xs text-[var(--text)] hover:border-[var(--accent)]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        {last ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-[var(--text)]">Latest result</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                <input type="checkbox" checked={showSql} onChange={(e) => setShowSql(e.target.checked)} />
                Show SQL
              </label>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Understood
                </span>
                <span className="text-sm text-[var(--text)]">{last.interpretationLabel}</span>
                <span className="rounded-full bg-[var(--accent-dim)]/30 px-2.5 py-1 text-xs text-[var(--accent)]">
                  {last.source === "composed" ? "semantic layer" : "LLM SQL"}
                </span>
              </div>
              {last.interpretation.rationale ? (
                <p className="mt-2 text-xs text-[var(--muted)]">{last.interpretation.rationale}</p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--muted)]">
                If this interpretation is off, rephrase with the metric, grouping, period, or filter you want.
              </p>
            </div>
            {showSql ? (
              <pre className="max-h-40 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
                {last.sql}
              </pre>
            ) : null}
            <InsightChart chart={last.chart} rows={last.rows} onDatumClick={onChartClick} />
            <ResultTable rows={last.rows} maxHeightClass="max-h-96" />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
            Run a question to see a chart and data table here.
          </div>
        )}
      </section>
    </div>
  );
}
