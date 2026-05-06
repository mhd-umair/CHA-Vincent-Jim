import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--muted)]" role="status">
          Loading Ask data…
        </p>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
