import type { SavingsEntry } from "./SavingsEntry";

export function computeSuggestedIncome(entries: SavingsEntry[], now: Date = new Date()): number {
  const validKeys = new Set<string>();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    validKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  let sum = 0;
  for (const entry of entries) {
    if (entry.type === "deposito" && validKeys.has(entry.date.slice(0, 7))) {
      sum += entry.amount;
    }
  }

  return sum === 0 ? 0 : Math.round(sum / 3);
}
