import type { BucketKey } from "./BucketKey";
import type { BudgetConfig } from "./BudgetConfig";
import { resolveLeafMonthlyAmount } from "./budgetAmount";

export type BucketTotals = Record<BucketKey, number>;

const BUCKET_ORDER: BucketKey[] = ["fixed", "variable", "savings"];

/** Sums only leaf nodes: a childless category's own MONTHLY amount for
 *  `month`, and every subcategory's own monthly amount for `month`, each
 *  keyed by ITS OWN bucket tag. A parent category's own `bucket`/`amount`
 *  never contributes. Monthly leaves are month-independent (backward
 *  compatible); weekly leaves are scaled via `resolveLeafMonthlyAmount`. */
export function computeBucketTotals(config: BudgetConfig, month: string): BucketTotals {
  const totals: BucketTotals = { fixed: 0, variable: 0, savings: 0 };

  for (const category of config.categories) {
    if (category.subcategories.length === 0) {
      totals[category.bucket] += resolveLeafMonthlyAmount(category, month);
      continue;
    }
    for (const sub of category.subcategories) {
      totals[sub.bucket] += resolveLeafMonthlyAmount(sub, month);
    }
  }

  return totals;
}

export interface BucketBudgetRow {
  key: BucketKey;
  budgeted: number;
  sharePct: number;
}

export interface BudgetComparison {
  rows: BucketBudgetRow[];
  total: { budgeted: number };
}

/** Bucket composition of the budget for `month`: each bucket's budgeted sum
 *  plus its integer share of the total. */
export function computeBudgetComparison(config: BudgetConfig, month: string): BudgetComparison {
  const totals = computeBucketTotals(config, month);
  const rows = BUCKET_ORDER.map((key) => ({ key, budgeted: totals[key] }));
  const budgeted = rows.reduce((sum, row) => sum + row.budgeted, 0);

  return {
    rows: rows.map((row) => ({ ...row, sharePct: toSharePct(row.budgeted, budgeted) })),
    total: { budgeted },
  };
}

/** Integer share of total budget. Deliberately NOT normalized — rounded shares may
 *  sum to 99 or 101; display-only. Zero total yields 0, never NaN/Infinity. */
function toSharePct(budgeted: number, total: number): number {
  return total === 0 ? 0 : Math.round((budgeted / total) * 100);
}
