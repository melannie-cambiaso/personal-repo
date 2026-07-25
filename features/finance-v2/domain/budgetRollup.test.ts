import { describe, it, expect } from "vitest";
import { computeBucketTotals, computeBudgetComparison } from "./budgetRollup";
import type { BudgetConfig } from "./BudgetConfig";
import type { SplitResult } from "./computeSplit";

describe("computeBucketTotals", () => {
  it("returns all-zero totals for an empty config", () => {
    const config: BudgetConfig = { categories: [] };

    expect(computeBucketTotals(config)).toEqual({ fixed: 0, variable: 0, savings: 0 });
  });

  it("counts a childless category's own bucket and amount", () => {
    const config: BudgetConfig = {
      categories: [
        { id: "c1", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] },
      ],
    };

    expect(computeBucketTotals(config)).toEqual({ fixed: 350000, variable: 0, savings: 0 });
  });

  it("never counts a parent category's own bucket or amount", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 999999,
          subcategories: [{ id: "s1", name: "Luz", bucket: "fixed", amount: 10000 }],
        },
      ],
    };

    expect(computeBucketTotals(config)).toEqual({ fixed: 10000, variable: 0, savings: 0 });
  });

  it("splits mixed-bucket subcategories under one parent across buckets, no validation error", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [
            { id: "s1", name: "Luz", bucket: "fixed", amount: 5000 },
            { id: "s2", name: "Ocio", bucket: "variable", amount: 3000 },
          ],
        },
      ],
    };

    expect(computeBucketTotals(config)).toEqual({ fixed: 5000, variable: 3000, savings: 0 });
  });

  it("returns 0 (not undefined) for a bucket with no leaves", () => {
    const config: BudgetConfig = {
      categories: [
        { id: "c1", name: "Arriendo", bucket: "fixed", amount: 100000, subcategories: [] },
      ],
    };

    const totals = computeBucketTotals(config);

    expect(totals.savings).toBe(0);
    expect(totals.variable).toBe(0);
  });
});

describe("computeBudgetComparison", () => {
  const validSplit: SplitResult = {
    status: "valid",
    buckets: [
      { key: "fixed", percentage: 50, amount: 500000 },
      { key: "variable", percentage: 30, amount: 300000 },
      { key: "savings", percentage: 20, amount: 200000 },
    ],
  };

  const invalidSplit: SplitResult = {
    status: "invalid",
    reason: "percentages-must-sum-to-100",
    totalPercentage: 90,
  };

  const config: BudgetConfig = {
    categories: [
      { id: "c1", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] },
      { id: "c2", name: "Ocio", bucket: "variable", amount: 50000, subcategories: [] },
    ],
  };

  it("returns with-targets rows ordered fixed, variable, savings when the split is valid", () => {
    expect(computeBudgetComparison(config, validSplit)).toEqual({
      status: "with-targets",
      rows: [
        { key: "fixed", budgeted: 350000, target: 500000 },
        { key: "variable", budgeted: 50000, target: 300000 },
        { key: "savings", budgeted: 0, target: 200000 },
      ],
      total: { budgeted: 400000, target: 1000000 },
    });
  });

  it("degrades to budget-only rows with no target key when the split is invalid", () => {
    const result = computeBudgetComparison(config, invalidSplit);

    expect(result).toEqual({
      status: "budget-only",
      rows: [
        { key: "fixed", budgeted: 350000 },
        { key: "variable", budgeted: 50000 },
        { key: "savings", budgeted: 0 },
      ],
      total: { budgeted: 400000 },
    });
    for (const row of result.rows) {
      expect(row).not.toHaveProperty("target");
    }
    expect(result.total).not.toHaveProperty("target");
  });
});
