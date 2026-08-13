// Mirrors the existing `spendView.ts` union convention.
import type { PendingView } from "@/features/finance-v2/domain";

export type PendingTabView = { status: "loading" } | { status: "ready"; view: PendingView };

/** Single readiness gate over TWO independently loading async sources (design D6): spend
 *  (transactions hook) and overrides (pending hook) load off the same `viewedMonth` but
 *  resolve independently. Collapsing both flags into one `loading | ready` union means no
 *  render can ever pair a fresh override set with a stale month's spend, or vice versa. */
export function toPendingTabView(
  isLoadingMonth: boolean,
  isLoadingPending: boolean,
  view: PendingView,
): PendingTabView {
  return isLoadingMonth || isLoadingPending ? { status: "loading" } : { status: "ready", view };
}
