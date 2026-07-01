import type { FinanceTransaction } from "./FinanceTransaction";

// Local type alias — mirrors Group from kvAdapter without pulling in server-only
type Group = { name: string; categories: string[] };

export interface CategoryGroup {
  category: string;
  groupName: string; // resolved from passed groups[], "Otro" fallback
  total: number; // sum of amount
  transactions: FinanceTransaction[];
}

export function groupTransactionsByCategory(
  transactions: FinanceTransaction[],
  groups: Group[]
): CategoryGroup[] {
  const buckets = new Map<
    string,
    { groupName: string; total: number; transactions: FinanceTransaction[] }
  >();

  for (const tx of transactions) {
    const existing = buckets.get(tx.category);
    if (existing) {
      existing.total += tx.amount;
      existing.transactions.push(tx);
    } else {
      const group = groups.find((g) => g.categories.includes(tx.category));
      const groupName = group ? group.name : "Otro";
      buckets.set(tx.category, {
        groupName,
        total: tx.amount,
        transactions: [tx],
      });
    }
  }

  const result: CategoryGroup[] = [];
  for (const [category, data] of buckets) {
    data.transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    result.push({ category, ...data });
  }

  result.sort((a, b) => a.category.localeCompare(b.category, "es"));

  return result;
}
