"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  /** Current active range, used to seed the form. */
  from: string | null;
  to: string | null;
  /** Optional label shown above the controls (e.g. dashboard title context). */
  label?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function startOfYearIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function lastTwelveMonthsIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 11, 1)
    .toISOString()
    .slice(0, 10);
}

export function DateRangeControls({ from, to, label }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [start, setStart] = useState(from ?? "");
  const [end, setEnd] = useState(to ?? "");

  function navigate(nextFrom: string | null, nextTo: string | null) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (nextFrom) next.set("from", nextFrom);
    else next.delete("from");
    if (nextTo) next.set("to", nextTo);
    else next.delete("to");
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function applyPreset(name: "30d" | "12m" | "ytd" | "all") {
    if (name === "all") {
      setStart("");
      setEnd("");
      navigate(null, null);
      return;
    }
    const today = todayIso();
    let nextStart = "";
    if (name === "30d") nextStart = offsetIso(30);
    else if (name === "12m") nextStart = lastTwelveMonthsIso();
    else if (name === "ytd") nextStart = startOfYearIso();
    setStart(nextStart);
    setEnd(today);
    navigate(nextStart, today);
  }

  function applyCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(start || null, end || null);
  }

  const presetBtn =
    "rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Date range
          </p>
          {label ? (
            <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={presetBtn} onClick={() => applyPreset("30d")}>
            Last 30 days
          </button>
          <button type="button" className={presetBtn} onClick={() => applyPreset("12m")}>
            Last 12 months
          </button>
          <button type="button" className={presetBtn} onClick={() => applyPreset("ytd")}>
            Year to date
          </button>
          <button type="button" className={presetBtn} onClick={() => applyPreset("all")}>
            All time
          </button>
        </div>
      </div>
      <form onSubmit={applyCustom} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-[var(--muted)]">
          Start
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)]"
          />
        </label>
        <label className="flex flex-col text-xs text-[var(--muted)]">
          End
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--bg)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--text)]"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
