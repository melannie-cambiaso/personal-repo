import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";
import { computeSpendComparison } from "./spendRollup";

/** Per-category counterpart to `computePendingFromMain`: each TOP-LEVEL
 *  category's remaining (`budgeted − spent`) summed, so the clamp is PER
 *  CATEGORY and an overspent subcategory is netted against the rest of its
 *  parent — the same figure as the "quedan" on each category card. A parent's
 *  budgeted is the sum of its leaves' month-aware budgets (the card's
 *  `view.total`; `computeSpendComparison` leaves parents at 0).
 *  Envelope exclusion skips the whole bound category: `boundCategoryId` is
 *  always a top-level id (see `resolvePaidFrom`), so the envelope pays either
 *  every subcategory of a parent or a childless leaf — never a single leaf
 *  inside a parent — and no partial subtraction is needed. A bound id missing
 *  from `config` excludes nothing. */
export function computePendingByCategory(
  config: BudgetConfig,
  transactions: FinanceV2Transaction[],
  month: string,
  envelope: EnvelopeConfig | null
): number {
  const monthTransactions = transactions.filter((tx) => tx.month === month);
  const { categories, leaves } = computeSpendComparison(config, monthTransactions, month);

  let pending = 0;
  for (const category of config.categories) {
    if (envelope !== null && category.id === envelope.boundCategoryId) continue;

    const budgeted =
      category.subcategories.length === 0
        ? categories[category.id].budgeted
        : category.subcategories.reduce((sum, sub) => sum + leaves[sub.id].budgeted, 0);
    pending += Math.max(budgeted - categories[category.id].spent, 0);
  }
  return pending;
}
