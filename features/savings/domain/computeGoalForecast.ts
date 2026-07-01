import type { SavingsGoal } from "./SavingsGoal";
import { sortGoalsByPriority } from "./SavingsGoal";
import type { ForecastMonth } from "./computeForecast";

export interface GoalForecastResult {
  goalId: string;
  name: string;
  monthsToCompletion: number | null;
  estimatedCompletionMonth: string | null;
}

export function computeGoalForecast(
  goals: SavingsGoal[],
  currentBalance: number,
  forecastMonths: ForecastMonth[]
): GoalForecastResult[] {
  if (goals.length === 0) return [];

  const sorted = sortGoalsByPriority(goals).filter((goal) => !goal.isDone);

  let cumulativeTarget = 0;

  return sorted.map((goal) => {
    cumulativeTarget += goal.targetAmount;

    if (currentBalance >= cumulativeTarget) {
      return {
        goalId: goal.id,
        name: goal.name,
        monthsToCompletion: 0,
        estimatedCompletionMonth: null,
      };
    }

    const idx = forecastMonths.findIndex((fm) => fm.projectedBalance >= cumulativeTarget);

    if (idx === -1) {
      return {
        goalId: goal.id,
        name: goal.name,
        monthsToCompletion: null,
        estimatedCompletionMonth: null,
      };
    }

    return {
      goalId: goal.id,
      name: goal.name,
      monthsToCompletion: idx + 1,
      estimatedCompletionMonth: forecastMonths[idx].monthKey,
    };
  });
}
