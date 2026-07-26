import type { FinanceV2Transaction } from "./FinanceV2Transaction";

export interface TransactionTotals {
  income: number;
  expense: number;
  savings: number;
  /** `income - expense`. Savings NEVER enters this — it is a plain sum shown
   *  separately, with no comparison to tab 1's target (locked scope). */
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

  return { ...totals, balance: totals.income - totals.expense };
}
