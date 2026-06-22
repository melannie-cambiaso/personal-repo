import type { FinanceEntry } from "./FinanceEntry";

export function groupByDay(entries: FinanceEntry[]): Map<string, FinanceEntry[]> {
  const sorted = [...entries].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    return d !== 0 ? d : b.createdAt.localeCompare(a.createdAt);
  });
  return sorted.reduce((map, entry) => {
    map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    return map;
  }, new Map<string, FinanceEntry[]>());
}
