// Mirrors the existing `components/Budget/budgetMode.ts` constants-module convention.
import type { SpendComparison } from "@/features/finance-v2/domain";

export type SpendView = { status: "loading" } | { status: "ready"; comparison: SpendComparison };

/** Makes the `isLoadingMonth` stale-month hazard unrepresentable at the presentation seam
 *  (design D7): while the previous month's transactions are still in memory mid-load, the
 *  screen must surface "loading", never a comparison computed against stale data. */
export function toSpendView(isLoadingMonth: boolean, comparison: SpendComparison): SpendView {
  return isLoadingMonth ? { status: "loading" } : { status: "ready", comparison };
}
