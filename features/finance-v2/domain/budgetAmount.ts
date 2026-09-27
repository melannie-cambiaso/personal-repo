import type { BudgetFrequency } from "./BudgetConfig";
import { countWeekdayInMonth, type Weekday } from "@/shared/utils/monthUtils";

/** The subset of a budget leaf (childless `BudgetCategory` or
 *  `BudgetSubcategory`) these resolvers need. */
export interface BudgetLeafAmount {
  amount: number;
  frequency?: BudgetFrequency;
  weekday?: Weekday;
}

/** Monday — the weekday assumed for weekly leaves persisted before `weekday`
 *  existed, which keeps their original Mondays-based week count. Single source
 *  of truth for every place that defaults a leaf's weekday. */
export const DEFAULT_WEEKDAY: Weekday = 1;

/** Resolves how many weekly cycles a leaf has in `month`: the occurrences of
 *  its `weekday` (Monday when absent). Only meaningful for weekly leaves. */
export function resolveLeafWeeks(leaf: BudgetLeafAmount, month: string): number {
  return countWeekdayInMonth(month, leaf.weekday ?? DEFAULT_WEEKDAY);
}

/** Resolves a budget leaf's MONTHLY budget for `month`. A monthly leaf
 *  (frequency absent or `"monthly"`) budgets exactly `amount`. A weekly leaf
 *  budgets `amount` PER WEEK, scaled by its weeks in `month` (see
 *  `resolveLeafWeeks`) — so cleaning every Sunday budgets 5 weeks in a
 *  5-Sunday month even when that month has only 4 Mondays. */
export function resolveLeafMonthlyAmount(leaf: BudgetLeafAmount, month: string): number {
  if (leaf.frequency === "weekly") {
    return leaf.amount * resolveLeafWeeks(leaf, month);
  }
  return leaf.amount;
}
