// Mirrors `spendView.ts`: the presentation seam that keeps a stale month off screen.
import type { BudgetCategory, EnvelopeConfig } from "@/features/finance-v2/domain";

export interface AccountCoverageView {
  /** `null` while the viewed month is loading (design D7): the figures would otherwise
   *  be computed against the previous month's transactions. `pendingByCategory` is
   *  `computePendingByCategory` (display only); `pending` is the per-subcategory
   *  `computePendingFromMain`, the one the surplus/shortfall line subtracts. */
  figures: { pendingByCategory: number; pending: number; balance: number } | null;
  /** Which category both pending figures leave out because the envelope pays it; `null`
   *  when no envelope is configured or its bound category is gone — the same condition
   *  under which `computePendingFromMain` excludes nothing. */
  envelopeNote: { categoryName: string; envelopeName: string } | null;
}

interface Params {
  isLoadingMonth: boolean;
  pendingByCategory: number;
  pending: number;
  balance: number;
  envelope: EnvelopeConfig | null;
  categories: BudgetCategory[];
}

export function toAccountCoverageView({
  isLoadingMonth,
  pendingByCategory,
  pending,
  balance,
  envelope,
  categories,
}: Params): AccountCoverageView {
  const bound = envelope && categories.find((c) => c.id === envelope.boundCategoryId);
  return {
    figures: isLoadingMonth ? null : { pendingByCategory, pending, balance },
    envelopeNote:
      envelope && bound ? { categoryName: bound.name, envelopeName: envelope.name } : null,
  };
}
