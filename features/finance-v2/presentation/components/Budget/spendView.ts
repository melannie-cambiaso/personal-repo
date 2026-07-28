// Mirrors the existing `components/Budget/budgetMode.ts` constants-module convention.
import type { SpendComparison } from "@/features/finance-v2/domain";

export type SpendView = { status: "loading" } | { status: "ready"; comparison: SpendComparison };

/** Makes the `isLoadingMonth` stale-month hazard unrepresentable at the presentation seam
 *  (design D7): while the previous month's transactions are still in memory mid-load, the
 *  screen must surface "loading", never a comparison computed against stale data. This only
 *  holds because `useFinanceV2Transactions` derives `isLoadingMonth` synchronously during
 *  render (comparing the month its held `transactions` were loaded for against the
 *  currently viewed month) instead of via a `useState` flipped inside a `useEffect` — the
 *  latter lags one render behind a month change and would let a "ready" comparison slip
 *  through against stale data for that render. */
export function toSpendView(isLoadingMonth: boolean, comparison: SpendComparison): SpendView {
  return isLoadingMonth ? { status: "loading" } : { status: "ready", comparison };
}
