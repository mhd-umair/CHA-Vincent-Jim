type Props = {
  label: string;
  value: string;
  hint?: string;
  /** When set, the card is keyboard-focusable and activates on Enter/Space. */
  onClick?: () => void;
};

export function KpiCard({ label, value, hint, onClick }: Props) {
  const interactive = typeof onClick === "function";
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ${
        interactive
          ? "cursor-pointer outline-none transition hover:bg-[var(--surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
