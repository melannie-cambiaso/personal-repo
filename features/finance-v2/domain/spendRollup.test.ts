import { describe, it, expect } from "vitest";
import { computeSpentByCategory, computeSpendComparison, isOverrun } from "./spendRollup";
import type { BudgetConfig } from "./BudgetConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

function expenseTx(overrides: Partial<Extract<FinanceV2Transaction, { type: "expense" }>>): FinanceV2Transaction {
  return {
    id: "tx-1",
    amount: 0,
    date: "2026-07-01",
    month: "2026-07",
    type: "expense",
    bucket: "fixed",
    category: null,
    ...overrides,
  };
}

describe("computeSpentByCategory", () => {
  it("returns empty totals for an empty transaction list", () => {
    expect(computeSpentByCategory([])).toEqual({
      byLeafId: {},
      unassignedByBucket: { fixed: 0, variable: 0 },
    });
  });

  it("attributes a categorized expense to its leaf id", () => {
    const list = [expenseTx({ amount: 15000, category: { id: "cat-1", name: "Supermercado" } })];

    expect(computeSpentByCategory(list)).toEqual({
      byLeafId: { "cat-1": 15000 },
      unassignedByBucket: { fixed: 0, variable: 0 },
    });
  });

  it("attributes a null-category expense to its own bucket's unassigned total", () => {
    const list = [expenseTx({ amount: 8000, bucket: "fixed", category: null })];

    expect(computeSpentByCategory(list)).toEqual({
      byLeafId: {},
      unassignedByBucket: { fixed: 8000, variable: 0 },
    });
  });

  it("excludes income and savings transactions", () => {
    const list: FinanceV2Transaction[] = [
      { id: "tx-income", amount: 500000, date: "2026-07-01", month: "2026-07", type: "income" },
      { id: "tx-savings", amount: 50000, date: "2026-07-01", month: "2026-07", type: "savings" },
    ];

    expect(computeSpentByCategory(list)).toEqual({
      byLeafId: {},
      unassignedByBucket: { fixed: 0, variable: 0 },
    });
  });
});

describe("computeSpendComparison", () => {
  it("returns all-zero rows for an empty config with no transactions", () => {
    const config: BudgetConfig = { categories: [] };

    expect(computeSpendComparison(config, [])).toEqual({
      categories: {},
      leaves: {},
      buckets: [
        { key: "fixed", budgeted: 0, spent: 0, unassigned: 0 },
        { key: "variable", budgeted: 0, spent: 0, unassigned: 0 },
        { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
      ],
      total: { budgeted: 0, spent: 0, unassigned: 0 },
    });
  });

  it("pairs a leaf-only category's budget against its actual spend", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] }],
    };
    const list = [expenseTx({ amount: 350000, bucket: "fixed", category: { id: "c1", name: "Arriendo" } })];

    const result = computeSpendComparison(config, list);

    expect(result.categories.c1).toEqual({ budgeted: 350000, spent: 350000 });
    expect(result.leaves.c1).toEqual({ budgeted: 350000, spent: 350000 });
  });

  it("derives a parent's spend as the sum of its subcategories' spend, never its own amount", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 999999,
          subcategories: [
            { id: "s1", name: "Luz", bucket: "fixed", amount: 20000 },
            { id: "s2", name: "Ocio", bucket: "variable", amount: 5000 },
          ],
        },
      ],
    };
    const list = [
      expenseTx({ amount: 20000, bucket: "fixed", category: { id: "s1", name: "Luz" } }),
      expenseTx({ amount: 5000, bucket: "variable", category: { id: "s2", name: "Ocio" } }),
    ];

    const result = computeSpendComparison(config, list);

    expect(result.categories.c1).toEqual({ budgeted: 0, spent: 25000 });
    expect(result.leaves.s1).toEqual({ budgeted: 20000, spent: 20000 });
    expect(result.leaves.s2).toEqual({ budgeted: 5000, spent: 5000 });
  });

  it("routes a category: null expense into its bucket's unassigned residual", () => {
    const config: BudgetConfig = { categories: [] };
    const list = [expenseTx({ amount: 8000, bucket: "fixed", category: null })];

    const result = computeSpendComparison(config, list);
    const fixedRow = result.buckets.find((row) => row.key === "fixed");

    expect(fixedRow).toEqual({ key: "fixed", budgeted: 0, spent: 8000, unassigned: 8000 });
    expect(result.total).toEqual({ budgeted: 0, spent: 8000, unassigned: 8000 });
  });

  it("routes spend against a deleted leaf id into its bucket's unassigned residual", () => {
    const config: BudgetConfig = { categories: [] };
    const list = [expenseTx({ amount: 12000, bucket: "fixed", category: { id: "cat-old", name: "Super" } })];

    const result = computeSpendComparison(config, list);
    const fixedRow = result.buckets.find((row) => row.key === "fixed");

    expect(fixedRow).toEqual({ key: "fixed", budgeted: 0, spent: 12000, unassigned: 12000 });
  });

  it("routes spend against a leaf promoted to a parent into its bucket's unassigned residual", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [{ id: "s1", name: "Luz", bucket: "fixed", amount: 10000 }],
        },
      ],
    };
    // Historical transaction referencing "c1" back when it was a leaf, before a subcategory was added.
    const list = [expenseTx({ amount: 7000, bucket: "fixed", category: { id: "c1", name: "Servicios" } })];

    const result = computeSpendComparison(config, list);
    const fixedRow = result.buckets.find((row) => row.key === "fixed");

    expect(result.categories.c1).toEqual({ budgeted: 0, spent: 0 });
    expect(fixedRow?.unassigned).toBe(7000);
    expect(fixedRow?.spent).toBe(7000);
  });

  it("still matches a renamed leaf by id, ignoring the transaction's stale snapshotted name", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Supermercado", bucket: "fixed", amount: 50000, subcategories: [] }],
    };
    const list = [expenseTx({ amount: 30000, bucket: "fixed", category: { id: "c1", name: "Super" } })];

    const result = computeSpendComparison(config, list);

    expect(result.leaves.c1).toEqual({ budgeted: 50000, spent: 30000 });
    const fixedRow = result.buckets.find((row) => row.key === "fixed");
    expect(fixedRow?.unassigned).toBe(0);
  });

  it("shows a savings-bucket leaf at zero spend, never excluded", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Fondo emergencia", bucket: "savings", amount: 30000, subcategories: [] }],
    };

    const result = computeSpendComparison(config, []);

    expect(result.leaves.c1).toEqual({ budgeted: 30000, spent: 0 });
    const savingsRow = result.buckets.find((row) => row.key === "savings");
    expect(savingsRow).toEqual({ key: "savings", budgeted: 30000, spent: 0, unassigned: 0 });
  });

  it("keeps every budget category and leaf present at zero spend when untouched", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Streaming", bucket: "variable", amount: 10000, subcategories: [] }],
    };

    const result = computeSpendComparison(config, []);

    expect(result.categories.c1).toEqual({ budgeted: 10000, spent: 0 });
    expect(result.leaves.c1).toEqual({ budgeted: 10000, spent: 0 });
  });

  it("total.spent always reconciles to the sum of every expense transaction, regardless of category state", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] }],
    };
    const list = [
      expenseTx({ amount: 100000, bucket: "fixed", category: { id: "c1", name: "Arriendo" } }),
      expenseTx({ amount: 8000, bucket: "fixed", category: null }),
      expenseTx({ amount: 12000, bucket: "variable", category: { id: "gone", name: "Gone" } }),
      { id: "tx-income", amount: 500000, date: "2026-07-01", month: "2026-07", type: "income" as const },
    ];

    const result = computeSpendComparison(config, list);

    expect(result.total.spent).toBe(120000);
  });
});

describe("isOverrun", () => {
  it("flags a row where spent strictly exceeds budgeted", () => {
    expect(isOverrun({ budgeted: 20000, spent: 25000 })).toBe(true);
  });

  it("does not flag a row where spent exactly equals budgeted", () => {
    expect(isOverrun({ budgeted: 20000, spent: 20000 })).toBe(false);
  });

  it("does not flag a row where spent is below budgeted", () => {
    expect(isOverrun({ budgeted: 20000, spent: 10000 })).toBe(false);
  });
});
