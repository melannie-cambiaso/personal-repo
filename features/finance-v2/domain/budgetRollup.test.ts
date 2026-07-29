import { describe, it, expect } from "vitest";
import { computeBucketTotals, computeBudgetComparison } from "./budgetRollup";
import type { BudgetConfig } from "./BudgetConfig";

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
  const config: BudgetConfig = {
    categories: [
      { id: "c1", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] },
      { id: "c2", name: "Ocio", bucket: "variable", amount: 50000, subcategories: [] },
    ],
  };

  it("returns rows ordered fixed, variable, savings with a per-row sharePct of the total budgeted", () => {
    expect(computeBudgetComparison(config)).toEqual({
      rows: [
        { key: "fixed", budgeted: 350000, sharePct: 88 },
        { key: "variable", budgeted: 50000, sharePct: 13 },
        { key: "savings", budgeted: 0, sharePct: 0 },
      ],
      total: { budgeted: 400000 },
    });
  });

  it("returns sharePct: 0 for every bucket when the total budgeted is 0, never NaN", () => {
    const result = computeBudgetComparison({ categories: [] });

    expect(result).toEqual({
      rows: [
        { key: "fixed", budgeted: 0, sharePct: 0 },
        { key: "variable", budgeted: 0, sharePct: 0 },
        { key: "savings", budgeted: 0, sharePct: 0 },
      ],
      total: { budgeted: 0 },
    });
    for (const row of result.rows) {
      expect(Number.isNaN(row.sharePct)).toBe(false);
    }
  });

  it("does not normalize rounded shares to sum to 100 — three equal buckets round to 33/33/33 (sums to 99)", () => {
    const equalConfig: BudgetConfig = {
      categories: [
        { id: "c1", name: "Arriendo", bucket: "fixed", amount: 100, subcategories: [] },
        { id: "c2", name: "Ocio", bucket: "variable", amount: 100, subcategories: [] },
        { id: "c3", name: "Fondo", bucket: "savings", amount: 100, subcategories: [] },
      ],
    };

    const result = computeBudgetComparison(equalConfig);

    expect(result.rows.map((row) => row.sharePct)).toEqual([33, 33, 33]);
    expect(result.rows.reduce((sum, row) => sum + row.sharePct, 0)).toBe(99);
  });
});
