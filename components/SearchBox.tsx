"use client";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Reusable controlled search input. Plain text input with a leading magnifier
 * SVG (no icon library dependency) and the project's themed border / focus
 * ring. Used by leaderboard filtering and inside drill-down drawers.
 */
export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel,
}: Props) {
  return (
    <div className="relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
      />
    </div>
  );
}
