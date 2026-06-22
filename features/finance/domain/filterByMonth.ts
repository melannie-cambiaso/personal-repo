import type { FinanceEntry } from "./FinanceEntry";

export function filterByMonth(entries: FinanceEntry[], month: string): FinanceEntry[] {
  return entries.filter((e) => e.date.startsWith(month));
}
