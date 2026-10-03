import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";
import { toCategoryView } from "./categoryView";
import { nextMonth } from "@/shared/utils/monthUtils";

/** Money into (`transferred`) and out of (`paid`) the envelope for a list of
 *  transactions — typically one month's. */
export interface EnvelopeFlows {
  transferred: number;
  paid: number;
}

/** `paid` reads only the `paidFrom` snapshot, never the current bound
 *  category: rebinding or deleting a subcategory must not rewrite history. */
export function computeEnvelopeFlows(transactions: FinanceV2Transaction[]): EnvelopeFlows {
  let transferred = 0;
  let paid = 0;
  for (const tx of transactions) {
    if (tx.type === "transfer") transferred += tx.amount;
    else if (tx.type === "expense" && tx.paidFrom === "envelope") paid += tx.amount;
  }
  return { transferred, paid };
}

/** Ascending YYYY-MM months in `[from, toExclusive)`, walked via `nextMonth`
 *  (so it crosses year boundaries). Empty when `from >= toExclusive` — a plain
 *  string comparison is correct for zero-padded YYYY-MM. */
export function monthsFromTo(from: string, toExclusive: string): string[] {
  const months: string[] = [];
  for (let cursor = from; cursor < toExclusive; cursor = nextMonth(cursor)) {
    months.push(cursor);
  }
  return months;
}

/** Decides, at creation time only, whether an expense is paid from the
 *  envelope — the result is stamped as `paidFrom` and never recomputed. A
 *  category belongs to the envelope when it is a subcategory of the bound
 *  category, or the bound category itself while it is childless (i.e. a leaf).
 *  A bound category missing from `budget` stamps nothing. */
export function resolvePaidFrom(
  config: EnvelopeConfig | null,
  budget: BudgetConfig,
  categoryId: string | null
): "envelope" | undefined {
  if (config === null || categoryId === null) return undefined;

  const bound = budget.categories.find((c) => c.id === config.boundCategoryId);
  if (!bound) return undefined;

  const isEnvelopeLeaf =
    bound.subcategories.length === 0
      ? bound.id === categoryId
      : bound.subcategories.some((sub) => sub.id === categoryId);
  return isEnvelopeLeaf ? "envelope" : undefined;
}

/** The bound category's monthly budget for `month` (weekly leaves resolved via
 *  `toCategoryView`): a parent's derived `total`, or a leaf's `monthlyAmount`.
 *  `null` when the bound category no longer exists in `budget`. */
export function suggestedTransfer(
  config: EnvelopeConfig,
  budget: BudgetConfig,
  month: string
): number | null {
  const bound = budget.categories.find((c) => c.id === config.boundCategoryId);
  if (!bound) return null;

  const view = toCategoryView(bound, month);
  return view.kind === "parent" ? view.total : view.monthlyAmount;
}
