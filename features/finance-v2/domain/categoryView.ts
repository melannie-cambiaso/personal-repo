import type { BucketKey } from "./computeSplit";
import type { BudgetCategory, BudgetSubcategory } from "./BudgetConfig";

/** Makes "a parent has an amount input" unrepresentable in the UI: a leaf
 *  carries its own `bucket`/`amount`, a parent carries a derived `total`
 *  instead — never both, never neither. */
export type CategoryView =
  | { kind: "leaf"; id: string; name: string; bucket: BucketKey; amount: number }
  | {
      kind: "parent";
      id: string;
      name: string;
      defaultBucket: BucketKey;
      total: number;
      subcategories: BudgetSubcategory[];
    };

export function toCategoryView(category: BudgetCategory): CategoryView {
  if (category.subcategories.length === 0) {
    return {
      kind: "leaf",
      id: category.id,
      name: category.name,
      bucket: category.bucket,
      amount: category.amount,
    };
  }

  return {
    kind: "parent",
    id: category.id,
    name: category.name,
    defaultBucket: category.bucket,
    total: category.subcategories.reduce((sum, sub) => sum + sub.amount, 0),
    subcategories: category.subcategories,
  };
}
