import { describe, it, expect } from "vitest";
import { sumEarmarksByGoal } from "./sumEarmarksByGoal";
import type { SavingsEntry } from "./SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("sumEarmarksByGoal", () => {
  it("returns an empty object for empty input", () => {
    expect(sumEarmarksByGoal([])).toEqual({});
  });

  it("sums deposit amounts tagged to the same goal", () => {
    const entries = [
      entry({ id: "1", type: "deposito", amount: 300, goalId: "G1" }),
      entry({ id: "2", type: "deposito", amount: 200, goalId: "G1" }),
    ];
    expect(sumEarmarksByGoal(entries)).toEqual({ G1: 500 });
  });

  it("keeps separate goals in separate buckets", () => {
    const entries = [
      entry({ id: "1", type: "deposito", amount: 300, goalId: "G1" }),
      entry({ id: "2", type: "deposito", amount: 700, goalId: "G2" }),
    ];
    expect(sumEarmarksByGoal(entries)).toEqual({ G1: 300, G2: 700 });
  });

  it("ignores gasto entries even when tagged with a goalId", () => {
    const entries = [
      entry({ id: "1", type: "gasto", amount: 300, goalId: "G1" }),
      entry({ id: "2", type: "deposito", amount: 200, goalId: "G1" }),
    ];
    expect(sumEarmarksByGoal(entries)).toEqual({ G1: 200 });
  });

  it("ignores deposits without a goalId", () => {
    const entries = [
      entry({ id: "1", type: "deposito", amount: 300 }),
      entry({ id: "2", type: "deposito", amount: 200, goalId: "G1" }),
    ];
    expect(sumEarmarksByGoal(entries)).toEqual({ G1: 200 });
  });
});
