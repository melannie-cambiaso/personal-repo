import type { FinanceV2Transaction } from "./FinanceV2Transaction";

export interface TransactionTotals {
  income: number;
  expense: number;
  savings: number;
  /** `income - expense - savings`. Tagging a transaction `savings` means the money
   *  physically left the checking account, exactly like an expense, so it subtracts
   *  here too — a balance that ignored it would overstate available money.
   *  `savings` is ALSO reported on its own as a plain monthly sum, so "how much did
   *  I save this month" stays answerable. Still no comparison to tab 1's target.
   *  (Supersedes the `income - expense` rule locked by
   *  sdd/finance-v2-transactions-tab, reversed 2026-07-29.) */
  balance: number;
}

export function computeTransactionTotals(list: FinanceV2Transaction[]): TransactionTotals {
  const totals = list.reduce(
    (acc, tx) => {
      acc[tx.type] += tx.amount;
      return acc;
    },
    { income: 0, expense: 0, savings: 0 },
  );

  return { ...totals, balance: totals.income - totals.expense - totals.savings };
}
