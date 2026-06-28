import { describe, it, expect } from "vitest";
import { normalizePriorities } from "./normalizePriorities";
import type { SavingsGoal } from "./SavingsGoal";

const goal = (overrides: Partial<SavingsGoal>): SavingsGoal => ({
  id: "1",
  name: "Test",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("normalizePriorities", () => {
  it("empty array returns empty array", () => {
    expect(normalizePriorities([])).toEqual([]);
  });

  it("single item gets priority 1", () => {
    const g = goal({ id: "1", priority: 5 });
    const result = normalizePriorities([g]);
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe(1);
  });

  it("dense sequential priorities are preserved as 1, 2, 3", () => {
    const goals = [
      goal({ id: "1", priority: 1 }),
      goal({ id: "2", priority: 2 }),
      goal({ id: "3", priority: 3 }),
    ];
    const result = normalizePriorities(goals);
    expect(result.map((g) => g.priority)).toEqual([1, 2, 3]);
  });

  it("gaps are filled: [1,3,5] becomes [1,2,3]", () => {
    const goals = [
      goal({ id: "1", priority: 1 }),
      goal({ id: "2", priority: 3 }),
      goal({ id: "3", priority: 5 }),
    ];
    const result = normalizePriorities(goals);
    expect(result.map((g) => g.priority)).toEqual([1, 2, 3]);
  });

  it("unsorted input [p=10, p=1, p=5] sorts and renumbers to [1,2,3]", () => {
    const goals = [
      goal({ id: "a", priority: 10 }),
      goal({ id: "b", priority: 1 }),
      goal({ id: "c", priority: 5 }),
    ];
    const result = normalizePriorities(goals);
    expect(result.map((g) => g.priority)).toEqual([1, 2, 3]);
    // b should be first (priority 1)
    expect(result[0].id).toBe("b");
    // c should be second (priority 5)
    expect(result[1].id).toBe("c");
    // a should be third (priority 10)
    expect(result[2].id).toBe("a");
  });

  it("tie-break by createdAt ASC: earlier createdAt gets lower priority number", () => {
    const goals = [
      goal({ id: "later", priority: 1, createdAt: "2026-06-01T00:00:00Z" }),
      goal({ id: "earlier", priority: 1, createdAt: "2026-01-01T00:00:00Z" }),
    ];
    const result = normalizePriorities(goals);
    expect(result[0].id).toBe("earlier");
    expect(result[0].priority).toBe(1);
    expect(result[1].id).toBe("later");
    expect(result[1].priority).toBe(2);
  });

  it("does not mutate the input array", () => {
    const goals = [
      goal({ id: "1", priority: 3 }),
      goal({ id: "2", priority: 1 }),
    ];
    normalizePriorities(goals);
    expect(goals[0].priority).toBe(3);
    expect(goals[1].priority).toBe(1);
  });

  it("returns a new array (strict reference inequality)", () => {
    const goals = [goal({ id: "1", priority: 1 })];
    const result = normalizePriorities(goals);
    expect(result).not.toBe(goals);
  });
});
