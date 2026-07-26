import type { BudgetConfig } from "./BudgetConfig";
import type { ExpenseBucketKey } from "./FinanceV2Transaction";

export interface ExpenseCategoryOption {
  id: string;
  name: string;
  bucket: ExpenseBucketKey;
}

/** Flattens childless categories + subcategories into expense-linkable leaves
 *  (same leaf-flattening shape as `computeBucketTotals`), EXCLUDING any leaf
 *  tagged `bucket: "savings"` — a savings-bucketed budget leaf can never back
 *  an expense transaction (locked design decision, critical correctness
 *  guard). A parent category's own `bucket`/`amount` never contributes. */
export function listExpenseCategoryOptions(budget: BudgetConfig): ExpenseCategoryOption[] {
  const options: ExpenseCategoryOption[] = [];

  for (const category of budget.categories) {
    if (category.subcategories.length === 0) {
      if (category.bucket !== "savings") {
        options.push({ id: category.id, name: category.name, bucket: category.bucket });
      }
      continue;
    }

    for (const sub of category.subcategories) {
      if (sub.bucket !== "savings") {
        options.push({ id: sub.id, name: sub.name, bucket: sub.bucket });
      }
    }
  }

  return options;
}
