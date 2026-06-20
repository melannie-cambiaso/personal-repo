import type { SavingsEntry } from "./SavingsEntry";

export function computeBalance(entries: SavingsEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.type === "deposito" ? e.amount : -e.amount), 0);
}
