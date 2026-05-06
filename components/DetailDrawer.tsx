"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional pinned header (KPI strip, search box) rendered above the body. */
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Optional width class override. Defaults to roomy 720px. */
  widthClass?: string;
};

/**
 * Slide-in detail drawer used for dashboard drill-downs. Closes on backdrop
 * click, ESC, or the close button. Locks body scroll while open.
 */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  header,
  children,
  widthClass = "w-full sm:w-[640px] lg:w-[760px]",
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <aside
        className={`absolute right-0 top-0 flex h-full ${widthClass} flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[var(--text)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </header>
        {header ? (
          <div className="border-b border-[var(--border)] px-5 py-3">{header}</div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
