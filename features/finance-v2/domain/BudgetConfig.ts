import type { BucketKey } from "./BucketKey";

export interface BudgetSubcategory {
  id: string;
  name: string;
  bucket: BucketKey;
  amount: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  /** Own tag when childless (counted in rollups). When this category has
   *  subcategories, this is ONLY the default offered for the next
   *  subcategory added — it is never counted in any rollup. */
  bucket: BucketKey;
  /** Meaningful only when `subcategories` is empty. */
  amount: number;
  subcategories: BudgetSubcategory[];
}

export interface BudgetConfig {
  categories: BudgetCategory[];
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = { categories: [] };
