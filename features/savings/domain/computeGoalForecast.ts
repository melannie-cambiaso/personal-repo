import type { SavingsGoal } from "./SavingsGoal";
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

  // Sort by priority ASC, ties broken by createdAt ASC — mirrors distributeToGoals
  const sorted = [...goals].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.createdAt.localeCompare(b.createdAt)
  );

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
