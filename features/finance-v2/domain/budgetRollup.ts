import type { BucketKey } from "./BucketKey";
import type { BudgetConfig } from "./BudgetConfig";

export type BucketTotals = Record<BucketKey, number>;

const BUCKET_ORDER: BucketKey[] = ["fixed", "variable", "savings"];

/** Sums only leaf nodes: a childless category's own amount, and every
 *  subcategory's own amount, each keyed by ITS OWN bucket tag. A parent
 *  category's own `bucket`/`amount` never contributes. */
export function computeBucketTotals(config: BudgetConfig): BucketTotals {
  const totals: BucketTotals = { fixed: 0, variable: 0, savings: 0 };

  for (const category of config.categories) {
    if (category.subcategories.length === 0) {
      totals[category.bucket] += category.amount;
      continue;
    }
    for (const sub of category.subcategories) {
      totals[sub.bucket] += sub.amount;
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

/** Bucket composition of the budget: each bucket's budgeted sum plus its integer
 *  share of the total. */
export function computeBudgetComparison(config: BudgetConfig): BudgetComparison {
  const totals = computeBucketTotals(config);
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
