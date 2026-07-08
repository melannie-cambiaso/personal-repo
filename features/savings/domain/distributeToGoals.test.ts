import { describe, it, expect } from "vitest";
import { distributeToGoals } from "./distributeToGoals";
import type { SavingsGoal } from "./SavingsGoal";

const goal = (overrides: Partial<SavingsGoal>): SavingsGoal => ({
  id: "1",
  name: "Test",
  targetAmount: 1000,
  priority: 1,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("distributeToGoals", () => {
  it("empty goals returns empty goals and surplus equals balance", () => {
    const result = distributeToGoals(500, []);
    expect(result.goals).toEqual([]);
    expect(result.surplus).toBe(500);
  });

  it("zero balance sets all goals to zero and surplus to 0", () => {
    const goals = [
      goal({ id: "1", targetAmount: 1000, priority: 1 }),
      goal({ id: "2", targetAmount: 500, priority: 2 }),
    ];
    const result = distributeToGoals(0, goals);
    expect(result.surplus).toBe(0);
    result.goals.forEach((g) => {
      expect(g.currentAmount).toBe(0);
      expect(g.progress).toBe(0);
      expect(g.isCompleted).toBe(false);
    });
  });

  it("negative balance sets all goals to zero and surplus to 0", () => {
    const goals = [goal({ id: "1", targetAmount: 1000, priority: 1 })];
    const result = distributeToGoals(-200, goals);
    expect(result.surplus).toBe(0);
    expect(result.goals[0].currentAmount).toBe(0);
    expect(result.goals[0].progress).toBe(0);
  });

  it("full cascade (SCN-001): balance covers first two goals fully, third partially", () => {
    // balance=1500, targets=[1000,800,2000]
    const goals = [
      goal({ id: "1", targetAmount: 1000, priority: 1 }),
      goal({ id: "2", targetAmount: 800, priority: 2 }),
      goal({ id: "3", targetAmount: 2000, priority: 3 }),
    ];
    const result = distributeToGoals(1500, goals);
    expect(result.surplus).toBe(0);
    expect(result.goals[0].currentAmount).toBe(1000);
    expect(result.goals[0].progress).toBe(1);
    expect(result.goals[0].isCompleted).toBe(true);
    expect(result.goals[1].currentAmount).toBe(500);
    expect(result.goals[1].progress).toBeCloseTo(500 / 800);
    expect(result.goals[1].isCompleted).toBe(false);
    expect(result.goals[2].currentAmount).toBe(0);
    expect(result.goals[2].progress).toBe(0);
    expect(result.goals[2].isCompleted).toBe(false);
  });

  it("all funded with surplus (SCN-002): balance=4500, targets=[1000,800,2000]", () => {
    const goals = [
      goal({ id: "1", targetAmount: 1000, priority: 1 }),
      goal({ id: "2", targetAmount: 800, priority: 2 }),
      goal({ id: "3", targetAmount: 2000, priority: 3 }),
    ];
    const result = distributeToGoals(4500, goals);
    expect(result.surplus).toBe(700);
    result.goals.forEach((g) => {
      expect(g.progress).toBe(1);
      expect(g.isCompleted).toBe(true);
    });
  });

  it("partial fill (SCN-004): balance=1800, targets=[1000,500,2000]", () => {
    const goals = [
      goal({ id: "1", targetAmount: 1000, priority: 1 }),
      goal({ id: "2", targetAmount: 500, priority: 2 }),
      goal({ id: "3", targetAmount: 2000, priority: 3 }),
    ];
    const result = distributeToGoals(1800, goals);
    expect(result.surplus).toBe(0);
    expect(result.goals[0].currentAmount).toBe(1000);
    expect(result.goals[0].isCompleted).toBe(true);
    expect(result.goals[1].currentAmount).toBe(500);
    expect(result.goals[1].isCompleted).toBe(true);
    expect(result.goals[2].currentAmount).toBe(300);
    expect(result.goals[2].progress).toBeCloseTo(300 / 2000);
    expect(result.goals[2].isCompleted).toBe(false);
  });

  it("output order is priority ASC even when input is disordered", () => {
    const goals = [
      goal({ id: "3", priority: 3, name: "Third" }),
      goal({ id: "1", priority: 1, name: "First" }),
      goal({ id: "2", priority: 2, name: "Second" }),
    ];
    const result = distributeToGoals(500, goals);
    expect(result.goals.map((g) => g.id)).toEqual(["1", "2", "3"]);
  });

  it("createdAt tie-break (SCN-011): earlier createdAt filled first when same priority", () => {
    const goals = [
      goal({ id: "later", priority: 1, targetAmount: 1000, createdAt: "2026-06-01T00:00:00Z" }),
      goal({ id: "earlier", priority: 1, targetAmount: 1000, createdAt: "2026-01-01T00:00:00Z" }),
    ];
    const result = distributeToGoals(1000, goals);
    // "earlier" should be filled first
    expect(result.goals[0].id).toBe("earlier");
    expect(result.goals[0].currentAmount).toBe(1000);
    expect(result.goals[1].currentAmount).toBe(0);
  });

  it("progress never exceeds 1 even if remaining > targetAmount", () => {
    const goals = [goal({ id: "1", targetAmount: 500, priority: 1 })];
    const result = distributeToGoals(10000, goals);
    expect(result.goals[0].progress).toBe(1);
  });

  it("isCompleted is true when progress >= 1", () => {
    const goals = [goal({ id: "1", targetAmount: 500, priority: 1 })];
    const result = distributeToGoals(500, goals);
    expect(result.goals[0].isCompleted).toBe(true);
  });

  it("isCompleted is false when progress < 1", () => {
    const goals = [goal({ id: "1", targetAmount: 500, priority: 1 })];
    const result = distributeToGoals(499, goals);
    expect(result.goals[0].isCompleted).toBe(false);
  });

  it("done goal is skipped, freeing balance for the next goal", () => {
    const goals = [
      goal({ id: "1", priority: 1, targetAmount: 1000, isDone: true }),
      goal({ id: "2", priority: 2, targetAmount: 500, isDone: false }),
    ];
    const result = distributeToGoals(500, goals);
    const a = result.goals.find((g) => g.id === "1")!;
    const b = result.goals.find((g) => g.id === "2")!;
    expect(a.currentAmount).toBe(1000);
    expect(a.progress).toBe(1);
    expect(a.isCompleted).toBe(true);
    expect(b.currentAmount).toBe(500);
    expect(b.progress).toBe(1);
    expect(b.isCompleted).toBe(true);
  });

  it("done goal excluded from totalTarget used for surplus", () => {
    const goals = [goal({ id: "1", priority: 1, targetAmount: 1000, isDone: true })];
    const result = distributeToGoals(1000, goals);
    expect(result.surplus).toBe(1000);
  });

  it("done goal preserves its priority slot in the output array", () => {
    const goals = [
      goal({ id: "1", priority: 1, targetAmount: 1000, isDone: true }),
      goal({ id: "2", priority: 2, targetAmount: 500, isDone: false }),
    ];
    const result = distributeToGoals(500, goals);
    expect(result.goals.map((g) => g.id)).toEqual(["1", "2"]);
  });

  it("no done goals — behavior unchanged (regression guard)", () => {
    const goals = [
      goal({ id: "1", targetAmount: 1000, priority: 1 }),
      goal({ id: "2", targetAmount: 800, priority: 2 }),
      goal({ id: "3", targetAmount: 2000, priority: 3 }),
    ];
    const result = distributeToGoals(1500, goals);
    expect(result.surplus).toBe(0);
    expect(result.goals[0].currentAmount).toBe(1000);
    expect(result.goals[1].currentAmount).toBe(500);
    expect(result.goals[2].currentAmount).toBe(0);
  });

  describe("earmarks (deposit tagging extension)", () => {
    it("tagged deposit under target: earmark funds the goal directly, waterfall fills the rest", () => {
      // G1(1000,p1), G2(800,p2), G3(2000,p3); 300 tagged to G2; untagged pool 1200; balance=1500
      const goals = [
        goal({ id: "1", targetAmount: 1000, priority: 1 }),
        goal({ id: "2", targetAmount: 800, priority: 2 }),
        goal({ id: "3", targetAmount: 2000, priority: 3 }),
      ];
      const result = distributeToGoals(1500, goals, { "2": 300 });
      expect(result.goals[0].currentAmount).toBe(1000);
      expect(result.goals[1].currentAmount).toBe(500);
      expect(result.goals[2].currentAmount).toBe(0);
      expect(result.surplus).toBe(0);
    });

    it("tagged deposit overshoots target: excess is not subtracted from the pool, surfaces as surplus", () => {
      // G1(1000,p1), G2(800,p2); 1000 tagged to G2 (200 over target); untagged deposit 1000; balance=2000
      const goals = [
        goal({ id: "1", targetAmount: 1000, priority: 1 }),
        goal({ id: "2", targetAmount: 800, priority: 2 }),
      ];
      const result = distributeToGoals(2000, goals, { "2": 1000 });
      expect(result.goals[0].currentAmount).toBe(1000);
      expect(result.goals[1].currentAmount).toBe(800);
      expect(result.surplus).toBe(200);
    });

    it("deposit tagged to a goal later marked done: currentAmount stays targetAmount, earmark surfaces via the unchanged surplus formula", () => {
      // surplus formula stays untouched: max(0, balance - totalTarget), totalTarget excludes isDone goals.
      // The earmark isn't reassigned; it's simply part of balance, and this done goal's target is
      // excluded from totalTarget, so the earmark surfaces as surplus rather than being "returned".
      const goals = [goal({ id: "1", targetAmount: 1000, priority: 1, isDone: true })];
      const result = distributeToGoals(1000, goals, { "1": 500 });
      expect(result.goals[0].currentAmount).toBe(1000);
      expect(result.goals[0].isCompleted).toBe(true);
      expect(result.surplus).toBe(1000);
    });

    it("dangling earmark (goalId not present in goals list) is ignored, money stays in the untagged pool", () => {
      const goals = [goal({ id: "1", targetAmount: 1000, priority: 1 })];
      const result = distributeToGoals(1000, goals, { "deleted-goal": 300 });
      expect(result.goals[0].currentAmount).toBe(1000);
      expect(result.surplus).toBe(0);
    });

    it("empty earmarks object behaves identically to omitting the argument (default {})", () => {
      const goals = [
        goal({ id: "1", targetAmount: 1000, priority: 1 }),
        goal({ id: "2", targetAmount: 800, priority: 2 }),
        goal({ id: "3", targetAmount: 2000, priority: 3 }),
      ];
      const withDefault = distributeToGoals(1500, goals);
      const withEmpty = distributeToGoals(1500, goals, {});
      expect(withEmpty).toEqual(withDefault);
    });
  });
});
