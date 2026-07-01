import type { SavingsGoal } from "./SavingsGoal";

export function normalizePriorities(goals: SavingsGoal[]): SavingsGoal[] {
  return [...goals]
    .sort((a, b) =>
      a.priority !== b.priority ? a.priority - b.priority : a.createdAt.localeCompare(b.createdAt)
    )
    .map((g, i) => ({ ...g, priority: i + 1 }));
}
