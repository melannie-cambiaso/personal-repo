import type { SavingsEntry } from "./SavingsEntry";

export interface MonthlySavingsGroup {
  month: string; // "YYYY-MM" — sort/identity key
  totalDepositos: number;
  totalGastos: number;
  net: number;
  entries: SavingsEntry[];
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function groupEntriesByMonth(entries: SavingsEntry[]): MonthlySavingsGroup[] {
  const buckets = new Map<string, SavingsEntry[]>();

  for (const entry of entries) {
    const key = monthKey(entry.date);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      buckets.set(key, [entry]);
    }
  }

  const groups: MonthlySavingsGroup[] = [];
  for (const [month, monthEntries] of buckets) {
    const totalDepositos = monthEntries
      .filter((e) => e.type === "deposito")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalGastos = monthEntries
      .filter((e) => e.type === "gasto")
      .reduce((sum, e) => sum + e.amount, 0);

    groups.push({
      month,
      totalDepositos,
      totalGastos,
      net: totalDepositos - totalGastos,
      entries: monthEntries,
    });
  }

  groups.sort((a, b) => b.month.localeCompare(a.month));

  return groups;
}
