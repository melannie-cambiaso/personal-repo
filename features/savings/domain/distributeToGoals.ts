import type { SavingsGoal, GoalWithProgress } from "./SavingsGoal";
import { sortGoalsByPriority } from "./SavingsGoal";

export function distributeToGoals(
  balance: number,
  goals: SavingsGoal[],
  earmarks: Record<string, number> = {}
): { goals: GoalWithProgress[]; surplus: number } {
  const sorted = sortGoalsByPriority(goals);

  // Money earmarked to a specific goal funds it directly and leaves the waterfall pool.
  // Capped at the goal's own target — earmark beyond target never reduces the pool further,
  // it simply isn't "applied" and flows to other goals then surplus like any other balance.
  const applied = new Map(sorted.map((g) => [g.id, Math.min(earmarks[g.id] ?? 0, g.targetAmount)]));
  const totalApplied = [...applied.values()].reduce((sum, v) => sum + v, 0);

  let pool = balance - totalApplied;
  const out = sorted.map((g) => {
    if (g.isDone) {
      return { ...g, currentAmount: g.targetAmount, progress: 1, isCompleted: true };
    }
    const goalApplied = applied.get(g.id) ?? 0;
    const remainingTarget = g.targetAmount - goalApplied;
    const share = Math.min(Math.max(0, pool), remainingTarget);
    pool -= remainingTarget;
    const currentAmount = Math.min(g.targetAmount, goalApplied + share);
    const progress = Math.min(1, Math.max(0, currentAmount / g.targetAmount));
    return { ...g, currentAmount, progress, isCompleted: progress >= 1 };
  });

  // Unchanged from the pre-earmark formula: earmarked deposits are already part of `balance`,
  // so this needs no earmark-aware adjustment.
  const totalTarget = goals.reduce((s, g) => (g.isDone ? s : s + g.targetAmount), 0);
  const surplus = Math.max(0, balance - totalTarget);
  return { goals: out, surplus };
}
