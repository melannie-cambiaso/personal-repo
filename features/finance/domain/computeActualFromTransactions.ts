import type { FinanceTransaction } from "./FinanceTransaction";

export function computeActualFromTransactions(
  transactions: FinanceTransaction[]
): Record<string, number> {
  return transactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    return acc;
  }, {});
}
