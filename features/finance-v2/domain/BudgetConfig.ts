import type { BucketKey } from "./BucketKey";
import type { Weekday } from "@/shared/utils/monthUtils";

/** How often a budget leaf's `amount` recurs. Absent/`"monthly"` means `amount`
 *  IS the monthly budget. `"weekly"` means `amount` is PER WEEK, and the
 *  monthly budget is `amount × getWeeksInMonth(month)` — see
 *  `resolveLeafMonthlyAmount` in `./budgetAmount`. */
export type BudgetFrequency = "monthly" | "weekly";

export interface BudgetSubcategory {
  id: string;
  name: string;
  bucket: BucketKey;
  amount: number;
  /** Absent means `"monthly"` (backward compatible with configs persisted
   *  before this field existed). */
  frequency?: BudgetFrequency;
  /** Day a weekly leaf recurs on; its weeks in a month are that day's
   *  occurrences. Ignored for monthly leaves. Absent means Monday (backward
   *  compatible). See `resolveLeafWeeks`. */
  weekday?: Weekday;
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
  /** Meaningful only when `subcategories` is empty. Absent means `"monthly"`
   *  (backward compatible with configs persisted before this field existed). */
  frequency?: BudgetFrequency;
  /** Meaningful only when `subcategories` is empty and `frequency` is
   *  `"weekly"`. Absent means Monday. See `resolveLeafWeeks`. */
  weekday?: Weekday;
  subcategories: BudgetSubcategory[];
}

export interface BudgetConfig {
  categories: BudgetCategory[];
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = { categories: [] };
