import { describe, it, expect } from "vitest";
import { computeSplit } from "./computeSplit";
import type { FinanceV2Config } from "./FinanceV2Config";

const config = (overrides: Partial<FinanceV2Config> = {}): FinanceV2Config => ({
  income: 1000000,
  fixedPct: 50,
  variablePct: 30,
  savingsPct: 20,
  ...overrides,
});

describe("computeSplit", () => {
  it("returns valid status with three ordered buckets when percentages sum to 100", () => {
    const result = computeSplit(config());

    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("expected valid result");
    expect(result.buckets).toEqual([
      { key: "fixed", percentage: 50, amount: 500000 },
      { key: "variable", percentage: 30, amount: 300000 },
      { key: "savings", percentage: 20, amount: 200000 },
    ]);
  });

  it("returns invalid status with totalPercentage when the sum is 99", () => {
    const result = computeSplit(config({ fixedPct: 49 }));

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") throw new Error("expected invalid result");
    expect(result.reason).toBe("percentages-must-sum-to-100");
    expect(result.totalPercentage).toBe(99);
  });

  it("returns invalid status with totalPercentage when the sum is 101", () => {
    const result = computeSplit(config({ fixedPct: 51 }));

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") throw new Error("expected invalid result");
    expect(result.totalPercentage).toBe(101);
  });

  it("returns invalid status when all percentages are 0", () => {
    const result = computeSplit(config({ fixedPct: 0, variablePct: 0, savingsPct: 0 }));

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") throw new Error("expected invalid result");
    expect(result.totalPercentage).toBe(0);
  });

  it("returns valid zero amounts when income is 0 and percentages sum to 100", () => {
    const result = computeSplit(config({ income: 0 }));

    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("expected valid result");
    expect(result.buckets.map((b) => b.amount)).toEqual([0, 0, 0]);
  });

  it("does not round bucket amounts (formatCLP owns rounding at render time)", () => {
    const result = computeSplit({ income: 100000, fixedPct: 33, variablePct: 33, savingsPct: 34 });

    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error("expected valid result");
    expect(result.buckets[0].amount).toBeCloseTo(33000, 10);
    expect(result.buckets[1].amount).toBeCloseTo(33000, 10);
    expect(result.buckets[2].amount).toBeCloseTo(34000, 10);
  });

  it("does not include amounts/buckets on the invalid branch (type-level hidden)", () => {
    const result = computeSplit(config({ fixedPct: 40 }));

    expect(result.status).toBe("invalid");
    expect((result as { buckets?: unknown }).buckets).toBeUndefined();
  });
});
