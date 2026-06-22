import type { FinanceEntry, FinanceSummary } from "./FinanceEntry";

export function computeMonthSummary(entries: FinanceEntry[]): FinanceSummary {
  const byGroup = new Map<string, number>();
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const e of entries) {
    byGroup.set(e.group, (byGroup.get(e.group) ?? 0) + e.amount);
    if (e.type === "income") totalIncome += e.amount;
    else totalExpenses += e.amount;
  }

  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, byGroup };
}
