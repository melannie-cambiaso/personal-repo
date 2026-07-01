import type { FinanceTransaction } from "./FinanceTransaction";

export interface DayGroup {
  date: string; // local YYYY-MM-DD — sort/identity key
  transactions: FinanceTransaction[];
}

function localDateKey(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function groupTransactionsByDay(transactions: FinanceTransaction[]): DayGroup[] {
  const buckets = new Map<string, FinanceTransaction[]>();

  for (const tx of transactions) {
    const key = localDateKey(tx.createdAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(tx);
    } else {
      buckets.set(key, [tx]);
    }
  }

  const groups: DayGroup[] = [];
  for (const [date, txs] of buckets) {
    txs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    groups.push({ date, transactions: txs });
  }

  groups.sort((a, b) => b.date.localeCompare(a.date));

  return groups;
}
