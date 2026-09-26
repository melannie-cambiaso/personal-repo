import type { BudgetFrequency } from "./BudgetConfig";
import { getWeeksInMonth } from "@/shared/utils/monthUtils";

/** The subset of a budget leaf (childless `BudgetCategory` or
 *  `BudgetSubcategory`) this resolver needs. */
export interface BudgetLeafAmount {
  amount: number;
  frequency?: BudgetFrequency;
}

/** Resolves a budget leaf's MONTHLY budget for `month`. A monthly leaf
 *  (frequency absent or `"monthly"`) budgets exactly `amount`. A weekly leaf
 *  budgets `amount` PER WEEK, scaled by the number of weekly cycles in
 *  `month` (see `getWeeksInMonth`) — so the same weekly amount produces a
 *  bigger monthly budget in a 5-Monday month than in a 4-Monday month. */
export function resolveLeafMonthlyAmount(leaf: BudgetLeafAmount, month: string): number {
  if (leaf.frequency === "weekly") {
    return leaf.amount * getWeeksInMonth(month);
  }
  return leaf.amount;
}
