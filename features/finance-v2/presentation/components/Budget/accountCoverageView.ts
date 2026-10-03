// Mirrors `spendView.ts`: the presentation seam that keeps a stale month off screen.
import type { BudgetCategory, EnvelopeConfig } from "@/features/finance-v2/domain";

export interface AccountCoverageView {
  /** `null` while the viewed month is loading (design D7): `pending` and `balance`
   *  would otherwise be computed against the previous month's transactions. */
  figures: { pending: number; balance: number } | null;
  /** Which category `pending` leaves out because the envelope pays it; `null` when no
   *  envelope is configured or its bound category is gone — the same condition under
   *  which `computePendingFromMain` excludes nothing. */
  envelopeNote: { categoryName: string; envelopeName: string } | null;
}

interface Params {
  isLoadingMonth: boolean;
  pending: number;
  balance: number;
  envelope: EnvelopeConfig | null;
  categories: BudgetCategory[];
}

export function toAccountCoverageView({
  isLoadingMonth,
  pending,
  balance,
  envelope,
  categories,
}: Params): AccountCoverageView {
  const bound = envelope && categories.find((c) => c.id === envelope.boundCategoryId);
  return {
    figures: isLoadingMonth ? null : { pending, balance },
    envelopeNote:
      envelope && bound ? { categoryName: bound.name, envelopeName: envelope.name } : null,
  };
}
