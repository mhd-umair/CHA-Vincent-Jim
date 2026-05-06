import { Suspense } from "react";
import { DashboardBoard } from "@/components/DashboardBoard";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
      <DashboardBoard />
    </Suspense>
  );
}
