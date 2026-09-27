import type { BucketKey } from "./BucketKey";
import type { BudgetCategory, BudgetFrequency, BudgetSubcategory } from "./BudgetConfig";
import { resolveLeafMonthlyAmount } from "./budgetAmount";

/** A subcategory with its frequency defaulted and its budget resolved for the
 *  viewed month, so the UI never has to repeat the weekly math. */
export type SubcategoryView = BudgetSubcategory & {
  frequency: BudgetFrequency;
  monthlyAmount: number;
};

/** Makes "a parent has an amount input" unrepresentable in the UI: a leaf
 *  carries its own `bucket`/`amount`, a parent carries a derived `total`
 *  instead — never both, never neither. `amount` stays the raw stored figure
 *  (per week for weekly leaves); `monthlyAmount`/`total` are resolved for the
 *  viewed month via `resolveLeafMonthlyAmount`. */
export type CategoryView =
  | {
      kind: "leaf";
      id: string;
      name: string;
      bucket: BucketKey;
      amount: number;
      frequency: BudgetFrequency;
      monthlyAmount: number;
    }
  | {
      kind: "parent";
      id: string;
      name: string;
      defaultBucket: BucketKey;
      total: number;
      subcategories: SubcategoryView[];
    };

export function toCategoryView(category: BudgetCategory, month: string): CategoryView {
  if (category.subcategories.length === 0) {
    return {
      kind: "leaf",
      id: category.id,
      name: category.name,
      bucket: category.bucket,
      amount: category.amount,
      frequency: category.frequency ?? "monthly",
      monthlyAmount: resolveLeafMonthlyAmount(category, month),
    };
  }

  const subcategories: SubcategoryView[] = category.subcategories.map((sub) => ({
    ...sub,
    frequency: sub.frequency ?? "monthly",
    monthlyAmount: resolveLeafMonthlyAmount(sub, month),
  }));

  return {
    kind: "parent",
    id: category.id,
    name: category.name,
    defaultBucket: category.bucket,
    total: subcategories.reduce((sum, sub) => sum + sub.monthlyAmount, 0),
    subcategories,
  };
}
