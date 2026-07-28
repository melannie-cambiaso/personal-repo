import type { BucketKey } from "./computeSplit";
import type { BudgetConfig } from "./BudgetConfig";
import type { ExpenseBucketKey, FinanceV2Transaction } from "./FinanceV2Transaction";
import { computeBucketTotals } from "./budgetRollup";

const BUCKET_ORDER: BucketKey[] = ["fixed", "variable", "savings"];

export interface SpendRow {
  budgeted: number;
  spent: number;
}

export interface BucketSpendRow {
  key: BucketKey;
  budgeted: number;
  spent: number;
  /** Spend with no resolvable budget leaf. ALREADY INCLUDED in `spent`. */
  unassigned: number;
}

export interface SpendComparison {
  /** One entry per top-level category. Leaf -> its own row; parent -> derived
   *  sum of its subcategories (mirrors `toCategoryView.total`). */
  categories: Record<string, SpendRow>;
  /** One entry per budget LEAF - childless-category ids + subcategory ids,
   *  one flat namespace (mirrors `listExpenseCategoryOptions`). */
  leaves: Record<string, SpendRow>;
  /** BUCKET_ORDER order, always 3 rows. */
  buckets: BucketSpendRow[];
  total: { budgeted: number; spent: number; unassigned: number };
}

/** Groups actual spend by `category.id` only (never by name - see
 *  `TransactionCategoryRef`'s snapshot contract). A `category: null` expense,
 *  or one whose id no longer resolves to a live leaf, falls to its own
 *  transaction `bucket`'s unassigned total instead of being dropped. */
export function computeSpentByCategory(transactions: FinanceV2Transaction[]): {
  byLeafId: Record<string, number>;
  unassignedByBucket: Record<ExpenseBucketKey, number>;
} {
  const byLeafId: Record<string, number> = {};
  const unassignedByBucket: Record<ExpenseBucketKey, number> = { fixed: 0, variable: 0 };

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;

    if (tx.category === null) {
      unassignedByBucket[tx.bucket] += tx.amount;
      continue;
    }

    byLeafId[tx.category.id] = (byLeafId[tx.category.id] ?? 0) + tx.amount;
  }

  return { byLeafId, unassignedByBucket };
}

/** Actuals counterpart to `computeBudgetComparison`: walks the same leaf set
 *  as `computeBucketTotals`, pairing each leaf's budget against its actual
 *  spend. Spend attributed to an id absent from the config (deleted, or a
 *  leaf promoted to a parent - see `budgetMutations.addSubcategory`) is
 *  re-routed into that transaction's own bucket's `unassigned`, so bucket and
 *  overall totals always reconcile to the month's full expense sum. */
export function computeSpendComparison(
  config: BudgetConfig,
  transactions: FinanceV2Transaction[],
): SpendComparison {
  const { byLeafId, unassignedByBucket } = computeSpentByCategory(transactions);

  const categories: Record<string, SpendRow> = {};
  const leaves: Record<string, SpendRow> = {};
  const claimedLeafIds = new Set<string>();

  for (const category of config.categories) {
    if (category.subcategories.length === 0) {
      const spent = byLeafId[category.id] ?? 0;
      claimedLeafIds.add(category.id);
      const row: SpendRow = { budgeted: category.amount, spent };
      categories[category.id] = row;
      leaves[category.id] = row;
      continue;
    }

    let parentSpent = 0;
    for (const sub of category.subcategories) {
      const subSpent = byLeafId[sub.id] ?? 0;
      claimedLeafIds.add(sub.id);
      leaves[sub.id] = { budgeted: sub.amount, spent: subSpent };
      parentSpent += subSpent;
    }
    categories[category.id] = { budgeted: 0, spent: parentSpent };
  }

  const unassignedTotals: Record<BucketKey, number> = {
    fixed: unassignedByBucket.fixed,
    variable: unassignedByBucket.variable,
    savings: 0,
  };
  // An unclaimed id is, by construction, never a currently-valid leaf (deleted,
  // or promoted to a parent - see D3(c)), so its bucket comes from the
  // transaction itself, never from walking the config.
  for (const [leafId, spent] of Object.entries(byLeafId)) {
    if (claimedLeafIds.has(leafId)) continue;
    const bucket = resolveUnassignedBucket(transactions, leafId);
    unassignedTotals[bucket] += spent;
  }

  const budgetedByBucket = computeBucketTotals(config);
  const spentByBucket = computeSpentByBucket(config, byLeafId, unassignedTotals);

  const buckets: BucketSpendRow[] = BUCKET_ORDER.map((key) => ({
    key,
    budgeted: budgetedByBucket[key],
    spent: spentByBucket[key],
    unassigned: unassignedTotals[key],
  }));

  const total = buckets.reduce(
    (acc, row) => ({
      budgeted: acc.budgeted + row.budgeted,
      spent: acc.spent + row.spent,
      unassigned: acc.unassigned + row.unassigned,
    }),
    { budgeted: 0, spent: 0, unassigned: 0 },
  );

  return { categories, leaves, buckets, total };
}

/** Strict `>` - equality is NOT overrun. */
export function isOverrun(row: SpendRow): boolean {
  return row.spent > row.budgeted;
}

/** Resolves the bucket an unassigned leaf id's spend belongs to by locating
 *  the expense transaction that produced it. `byLeafId` is always built from
 *  this same `transactions` array (see `computeSpendComparison`), so a match
 *  should always exist - throws instead of silently dropping the amount if
 *  that invariant is ever violated (see `FinanceV2Transaction`'s fail-loudly
 *  convention). */
export function resolveUnassignedBucket(transactions: FinanceV2Transaction[], leafId: string): BucketKey {
  for (const tx of transactions) {
    if (tx.type === "expense" && tx.category?.id === leafId) return tx.bucket;
  }
  throw new Error(
    `computeSpendComparison: no transaction found for unassigned leaf id "${leafId}" - cannot resolve its bucket.`,
  );
}

function computeSpentByBucket(
  config: BudgetConfig,
  byLeafId: Record<string, number>,
  unassignedTotals: Record<BucketKey, number>,
): Record<BucketKey, number> {
  const totals: Record<BucketKey, number> = { ...unassignedTotals };
  for (const category of config.categories) {
    if (category.subcategories.length === 0) {
      totals[category.bucket] += byLeafId[category.id] ?? 0;
      continue;
    }
    for (const sub of category.subcategories) {
      totals[sub.bucket] += byLeafId[sub.id] ?? 0;
    }
  }
  return totals;
}
