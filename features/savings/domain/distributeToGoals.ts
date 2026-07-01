import type { SavingsGoal, GoalWithProgress } from "./SavingsGoal";
import { sortGoalsByPriority } from "./SavingsGoal";

export function distributeToGoals(
  balance: number,
  goals: SavingsGoal[]
): { goals: GoalWithProgress[]; surplus: number } {
  const sorted = sortGoalsByPriority(goals);

  let remaining = balance;
  const out = sorted.map((g) => {
    const currentAmount = Math.min(Math.max(0, remaining), g.targetAmount);
    remaining -= g.targetAmount;
    const progress = Math.min(1, Math.max(0, currentAmount / g.targetAmount));
    return { ...g, currentAmount, progress, isCompleted: progress >= 1 };
  });

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const surplus = Math.max(0, balance - totalTarget);
  return { goals: out, surplus };
}
