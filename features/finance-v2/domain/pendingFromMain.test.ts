import { describe, it, expect } from "vitest";
import { computePendingFromMain } from "./pendingFromMain";
import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

const MONTH = "2026-10";

// 2026-08 has 5 Mondays, 2026-09 has 4 (see `getWeeksInMonth`).
const FIVE_WEEK_MONTH = "2026-08";
const FOUR_WEEK_MONTH = "2026-09";

const BUDGET: BudgetConfig = {
  categories: [
    {
      id: "cuentas",
      name: "Cuentas",
      bucket: "fixed",
      amount: 0,
      subcategories: [
        { id: "luz", name: "Luz", bucket: "fixed", amount: 45000 },
        { id: "agua", name: "Agua", bucket: "fixed", amount: 20000 },
      ],
    },
    { id: "arriendo", name: "Arriendo", bucket: "fixed", amount: 350000, subcategories: [] },
    {
      id: "comida",
      name: "Comida",
      bucket: "variable",
      amount: 0,
      subcategories: [{ id: "super", name: "Supermercado", bucket: "variable", amount: 150000 }],
    },
    { id: "ahorro", name: "Ahorro", bucket: "savings", amount: 100000, subcategories: [] },
  ],
};

function envelope(boundCategoryId: string): EnvelopeConfig {
  return { name: "Servicios", boundCategoryId, openingBalance: 0, openingMonth: MONTH };
}

function expenseTx(
  overrides: Partial<Extract<FinanceV2Transaction, { type: "expense" }>>
): FinanceV2Transaction {
  return {
    id: "tx-expense",
    amount: 0,
    date: "2026-10-01",
    month: MONTH,
    type: "expense",
    bucket: "fixed",
    category: null,
    ...overrides,
  };
}

describe("computePendingFromMain", () => {
  it("sums every leaf's remaining budget across buckets, Ahorro included, when there is no envelope", () => {
    const list = [
      expenseTx({ amount: 30000, category: { id: "luz", name: "Luz" } }),
      expenseTx({
        amount: 50000,
        bucket: "variable",
        category: { id: "super", name: "Supermercado" },
      }),
    ];

    // luz 15000 + agua 20000 + arriendo 350000 + super 100000 + ahorro 100000
    expect(computePendingFromMain(BUDGET, list, MONTH, null)).toBe(585000);
  });

  it("clamps an overspent leaf to 0 without offsetting another leaf's remaining", () => {
    const list = [expenseTx({ amount: 400000, category: { id: "arriendo", name: "Arriendo" } })];

    // arriendo overspent by 50000 counts 0: luz 45000 + agua 20000 + super 150000 + ahorro 100000
    expect(computePendingFromMain(BUDGET, list, MONTH, null)).toBe(315000);
  });

  it("excludes every subcategory of a bound parent category", () => {
    // arriendo 350000 + super 150000 + ahorro 100000
    expect(computePendingFromMain(BUDGET, [], MONTH, envelope("cuentas"))).toBe(600000);
  });

  it("excludes a bound childless leaf category", () => {
    // luz 45000 + agua 20000 + super 150000 + ahorro 100000
    expect(computePendingFromMain(BUDGET, [], MONTH, envelope("arriendo"))).toBe(315000);
  });

  it("excludes nothing when the bound category no longer exists in the budget", () => {
    expect(computePendingFromMain(BUDGET, [], MONTH, envelope("deleted"))).toBe(665000);
  });

  it("ignores transactions from other months", () => {
    const list = [
      expenseTx({
        amount: 350000,
        month: "2026-09",
        date: "2026-09-30",
        category: { id: "arriendo", name: "Arriendo" },
      }),
    ];

    expect(computePendingFromMain(BUDGET, list, MONTH, null)).toBe(665000);
  });

  it("does not create or reduce pending from unassigned spend", () => {
    const list = [
      expenseTx({ amount: 70000, bucket: "variable", category: null }),
      expenseTx({ amount: 5000, category: { id: "deleted-leaf", name: "Viejo" } }),
    ];

    expect(computePendingFromMain(BUDGET, list, MONTH, null)).toBe(665000);
  });

  it("uses a weekly leaf's month-aware budgeted amount", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "feria",
          name: "Feria",
          bucket: "variable",
          amount: 20000,
          frequency: "weekly",
          subcategories: [],
        },
      ],
    };
    const spent = (month: string) => [
      expenseTx({
        amount: 15000,
        month,
        bucket: "variable",
        category: { id: "feria", name: "Feria" },
      }),
    ];

    expect(computePendingFromMain(config, spent(FIVE_WEEK_MONTH), FIVE_WEEK_MONTH, null)).toBe(
      85000
    );
    expect(computePendingFromMain(config, spent(FOUR_WEEK_MONTH), FOUR_WEEK_MONTH, null)).toBe(
      65000
    );
  });
});
