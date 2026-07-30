import type { BucketKey } from "./BucketKey";
import type { BudgetConfig } from "./BudgetConfig";
import type { ExpenseBucketKey, TransactionCategoryRef } from "./FinanceV2Transaction";

export interface ExpenseCategoryOption {
  id: string;
  name: string;
  bucket: ExpenseBucketKey;
}

interface BudgetLeaf {
  id: string;
  name: string;
  bucket: BucketKey;
}

/** Flattens childless categories + subcategories into linkable leaves (same
 *  leaf-flattening shape as `computeBucketTotals`). A parent category's own
 *  `bucket`/`amount` never contributes — shared by `listExpenseCategoryOptions`
 *  and `listSavingsCategoryOptions` so both derive from one flatten pass. */
function flattenBudgetLeaves(budget: BudgetConfig): BudgetLeaf[] {
  const leaves: BudgetLeaf[] = [];

  for (const category of budget.categories) {
    if (category.subcategories.length === 0) {
      leaves.push({ id: category.id, name: category.name, bucket: category.bucket });
      continue;
    }

    for (const sub of category.subcategories) {
      leaves.push({ id: sub.id, name: sub.name, bucket: sub.bucket });
    }
  }

  return leaves;
}

/** EXCLUDES any leaf tagged `bucket: "savings"` — a savings-bucketed budget
 *  leaf can never back an expense transaction (locked design decision,
 *  critical correctness guard). */
export function listExpenseCategoryOptions(budget: BudgetConfig): ExpenseCategoryOption[] {
  return flattenBudgetLeaves(budget)
    .filter((leaf) => leaf.bucket !== "savings")
    .map((leaf) => ({ id: leaf.id, name: leaf.name, bucket: leaf.bucket as ExpenseBucketKey }));
}

/** Mirrors `listExpenseCategoryOptions` for the `savings` bucket: only leaves
 *  tagged `bucket: "savings"` back a savings transaction's category. */
export function listSavingsCategoryOptions(budget: BudgetConfig): TransactionCategoryRef[] {
  return flattenBudgetLeaves(budget)
    .filter((leaf) => leaf.bucket === "savings")
    .map((leaf) => ({ id: leaf.id, name: leaf.name }));
}
