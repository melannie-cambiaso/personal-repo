import type { BucketKey } from "./BucketKey";
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

/** Groups actual spend by `category.id`/`sourceCategory.id` only (never by
 *  name - see `TransactionCategoryRef`'s snapshot contract). An `expense`
 *  with `category: null` falls to its own transaction `bucket`'s unassigned
 *  total instead of being dropped. A `savings` transaction with no
 *  `sourceCategory`, and every `income` transaction, contributes nowhere. */
export function computeSpentByCategory(transactions: FinanceV2Transaction[]): {
  byLeafId: Record<string, number>;
  unassignedByBucket: Record<ExpenseBucketKey, number>;
} {
  const byLeafId: Record<string, number> = {};
  const unassignedByBucket: Record<ExpenseBucketKey, number> = { fixed: 0, variable: 0 };

  for (const tx of transactions) {
    const leaf = spendLeafRef(tx);
    if (leaf !== null) {
      byLeafId[leaf.id] = (byLeafId[leaf.id] ?? 0) + tx.amount;
      continue;
    }
    // Only an EXPENSE falls to unassigned: an untagged savings/income tx
    // consumes no expense budget at all, so it contributes nowhere —
    // `spendLeafRef` returns null for both cases and this narrows them apart.
    if (tx.type === "expense") unassignedByBucket[tx.bucket] += tx.amount;
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
 *  the transaction that produced it - an `expense` with matching `category`,
 *  or a `savings` with matching `sourceCategory` - via the same `spendLeafRef`
 *  predicate `computeSpentByCategory` uses to build `byLeafId`. That shared
 *  predicate is what guarantees a match always exists here: the `throw` stays
 *  as a fail-loudly guard (see `FinanceV2Transaction`'s convention), but is
 *  unreachable by construction as long as both loops read the same predicate. */
export function resolveUnassignedBucket(transactions: FinanceV2Transaction[], leafId: string): BucketKey {
  for (const tx of transactions) {
    const leaf = spendLeafRef(tx);
    if (leaf?.id === leafId) return leaf.bucket;
  }
  throw new Error(
    `computeSpendComparison: no transaction found for unassigned leaf id "${leafId}" - cannot resolve its bucket.`,
  );
}

/** THE definition of "this transaction consumes an expense budget leaf", and
 *  the only place either the attribution loop or the orphan resolver may
 *  decide it. Returning a bucket alongside the id is what keeps the two in
 *  sync: a variant cannot start contributing to `byLeafId` without also
 *  becoming resolvable. `null` = contributes no leaf.
 *  The declared return type deliberately excludes `undefined`, so adding a
 *  4th transaction `type` fails to compile (TS2366) instead of throwing at
 *  runtime in the Budget tab. */
function spendLeafRef(tx: FinanceV2Transaction): { id: string; bucket: ExpenseBucketKey } | null {
  switch (tx.type) {
    case "expense":
      return tx.category ? { id: tx.category.id, bucket: tx.bucket } : null;
    case "savings":
      return tx.sourceCategory
        ? { id: tx.sourceCategory.id, bucket: tx.sourceCategory.bucket }
        : null;
    case "income":
      return null;
  }
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
