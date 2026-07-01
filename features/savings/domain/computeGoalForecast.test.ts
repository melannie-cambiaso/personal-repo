import { describe, it, expect } from "vitest";
import { computeGoalForecast } from "./computeGoalForecast";
import type { ForecastMonth } from "./computeForecast";
import type { SavingsGoal } from "./SavingsGoal";

const GOAL_A: SavingsGoal = {
  id: "goal-a",
  name: "Emergency Fund",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2024-01-01T00:00:00.000Z",
};

const GOAL_B: SavingsGoal = {
  id: "goal-b",
  name: "Vacation",
  targetAmount: 500,
  priority: 2,
  createdAt: "2024-01-02T00:00:00.000Z",
};

function makeForecast(balances: number[]): ForecastMonth[] {
  return balances.map((projectedBalance, i) => ({
    monthKey: `2026-${String(i + 8).padStart(2, "0")}`,
    month: `Mes ${i + 1}`,
    projectedBalance,
  }));
}

describe("computeGoalForecast", () => {
  it("returns an empty array when goals is empty", () => {
    const forecast = makeForecast([500, 1000, 1500]);
    expect(computeGoalForecast([], 0, forecast)).toEqual([]);
  });

  it("returns monthsToCompletion: 0 when the goal is already funded", () => {
    const forecast = makeForecast([200, 400]);
    const result = computeGoalForecast([GOAL_A], 1000, forecast);
    expect(result).toHaveLength(1);
    expect(result[0].goalId).toBe("goal-a");
    expect(result[0].monthsToCompletion).toBe(0);
    expect(result[0].estimatedCompletionMonth).toBeNull();
  });

  it("returns monthsToCompletion: 3 when goal completes at forecast index 2", () => {
    // index 0: 300, index 1: 600, index 2: 1000 (>= GOAL_A target 1000)
    const forecast = makeForecast([300, 600, 1000, 1200]);
    const result = computeGoalForecast([GOAL_A], 0, forecast);
    expect(result[0].monthsToCompletion).toBe(3);
    expect(result[0].estimatedCompletionMonth).toBe("2026-10"); // index 2 → "2026-10"
  });

  it("returns monthsToCompletion: null when goal is outside the window", () => {
    const forecast = makeForecast([100, 200, 300]);
    const result = computeGoalForecast([GOAL_A], 0, forecast);
    expect(result[0].monthsToCompletion).toBeNull();
    expect(result[0].estimatedCompletionMonth).toBeNull();
  });

  it("applies cumulative thresholds for two goals in priority order", () => {
    // GOAL_A target=1000 (priority 1), cumulative=1000
    // GOAL_B target=500 (priority 2), cumulative=1500
    // currentBalance=0
    // forecast reaches 1000 at index 2 and 1500 at index 5
    const forecast = makeForecast([200, 500, 1000, 1100, 1200, 1500]);
    const result = computeGoalForecast([GOAL_A, GOAL_B], 0, forecast);
    expect(result).toHaveLength(2);
    expect(result[0].goalId).toBe("goal-a");
    expect(result[0].monthsToCompletion).toBe(3); // index 2 → 3
    expect(result[1].goalId).toBe("goal-b");
    expect(result[1].monthsToCompletion).toBe(6); // index 5 → 6
  });

  it("sorts goals by priority ASC regardless of insertion order", () => {
    // Pass goals in reverse priority order
    const forecast = makeForecast([200, 500, 1000, 1100, 1200, 1500]);
    const result = computeGoalForecast([GOAL_B, GOAL_A], 0, forecast);
    expect(result[0].goalId).toBe("goal-a"); // priority 1 first
    expect(result[1].goalId).toBe("goal-b"); // priority 2 second
  });

  it("returns correct name in each result", () => {
    const forecast = makeForecast([2000]);
    const result = computeGoalForecast([GOAL_A], 0, forecast);
    expect(result[0].name).toBe("Emergency Fund");
  });

  it("done goal does not inflate the next goal's threshold and is omitted from output", () => {
    // GOAL_A (target 1000, priority 1, done) should not contribute to cumulativeTarget
    const forecast = makeForecast([200, 500, 1000]);
    const result = computeGoalForecast([{ ...GOAL_A, isDone: true }, GOAL_B], 0, forecast);
    expect(result).toHaveLength(1);
    expect(result[0].goalId).toBe("goal-b");
    expect(result[0].monthsToCompletion).toBe(2); // cumulative=500, reached at index 1
  });

  it("all goals done returns an empty forecast", () => {
    const forecast = makeForecast([500, 1000, 1500]);
    const result = computeGoalForecast(
      [
        { ...GOAL_A, isDone: true },
        { ...GOAL_B, isDone: true },
      ],
      0,
      forecast
    );
    expect(result).toEqual([]);
  });
});
