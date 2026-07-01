import type { SavingsEntry } from "./SavingsEntry";

export function computeTotalToReplenish(entries: SavingsEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.type === "gasto" && e.toReplenish ? e.amount : 0), 0);
}
