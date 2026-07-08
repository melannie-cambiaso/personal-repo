import type { SavingsEntry } from "./SavingsEntry";

export function sumEarmarksByGoal(entries: SavingsEntry[]): Record<string, number> {
  const earmarks: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.type !== "deposito" || !entry.goalId) continue;
    earmarks[entry.goalId] = (earmarks[entry.goalId] ?? 0) + entry.amount;
  }

  return earmarks;
}
