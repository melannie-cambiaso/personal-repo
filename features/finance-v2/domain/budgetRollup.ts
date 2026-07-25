import type { BucketKey, SplitResult } from "./computeSplit";
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

export type BudgetComparison =
  | { status: "with-targets"; rows: { key: BucketKey; budgeted: number; target: number }[] }
  | { status: "budget-only"; rows: { key: BucketKey; budgeted: number }[] };

/** Informational comparison of budgeted sums against tab 1's split targets.
 *  Degrades to budgeted-sum-only when `split` is invalid — never fabricates
 *  or reuses a stale target. */
export function computeBudgetComparison(config: BudgetConfig, split: SplitResult): BudgetComparison {
  const totals = computeBucketTotals(config);

  if (split.status === "invalid") {
    return {
      status: "budget-only",
      rows: BUCKET_ORDER.map((key) => ({ key, budgeted: totals[key] })),
    };
  }

  const targetsByKey = new Map(split.buckets.map((bucket) => [bucket.key, bucket.amount]));

  return {
    status: "with-targets",
    rows: BUCKET_ORDER.map((key) => ({
      key,
      budgeted: totals[key],
      target: targetsByKey.get(key) ?? 0,
    })),
  };
}
