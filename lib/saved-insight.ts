import type { ChartSpecResolved } from "@/lib/chart-spec";

export type SavedInsight = {
  id: string;
  title: string;
  question: string;
  sql: string;
  chart: ChartSpecResolved;
  createdAt: string;
};

export const STORAGE_INSIGHTS = "perseus_saved_insights_v1";
