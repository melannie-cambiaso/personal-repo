import type { FinanceV2Transaction } from "./FinanceV2Transaction";

export interface DayGroup {
  date: string;
  transactions: FinanceV2Transaction[];
}

/** Days sorted `date` desc; within a day, reverse insertion order. Since
 *  `addTransaction` only ever appends, insertion order IS creation order —
 *  deterministic without a `createdAt` timestamp. No Date parsing anywhere,
 *  unlike v1's grouping. */
export function groupTransactionsByDay(list: FinanceV2Transaction[]): DayGroup[] {
  const byDate = new Map<string, FinanceV2Transaction[]>();

  for (const tx of list) {
    const existing = byDate.get(tx.date);
    if (existing) {
      existing.unshift(tx);
    } else {
      byDate.set(tx.date, [tx]);
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, transactions]) => ({ date, transactions }));
}
