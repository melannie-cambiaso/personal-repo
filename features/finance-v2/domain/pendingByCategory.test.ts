import { describe, it, expect } from "vitest";
import { computePendingByCategory } from "./pendingByCategory";
import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

const MONTH = "2026-10";

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
      subcategories: [
        { id: "super", name: "Supermercado", bucket: "variable", amount: 150000 },
        { id: "feria", name: "Feria", bucket: "variable", amount: 50000 },
      ],
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
    bucket: "variable",
    category: null,
    ...overrides,
  };
}

describe("computePendingByCategory", () => {
  it("sums every top-level category's remaining budget when nothing is spent", () => {
    // cuentas 65000 + arriendo 350000 + comida 200000 + ahorro 100000
    expect(computePendingByCategory(BUDGET, [], MONTH, null)).toBe(715000);
  });

  it("nets an overspent subcategory against the rest of its parent", () => {
    const list = [expenseTx({ amount: 80000, category: { id: "feria", name: "Feria" } })];

    // comida 200000 - 80000 = 120000 (feria's 30000 overrun lowers super's remaining)
    // cuentas 65000 + arriendo 350000 + comida 120000 + ahorro 100000
    expect(computePendingByCategory(BUDGET, list, MONTH, null)).toBe(635000);
  });

  it("clamps a fully overspent parent to 0 without offsetting another category", () => {
    const list = [expenseTx({ amount: 260000, category: { id: "super", name: "Supermercado" } })];

    // comida 200000 - 260000 clamps to 0: cuentas 65000 + arriendo 350000 + ahorro 100000
    expect(computePendingByCategory(BUDGET, list, MONTH, null)).toBe(515000);
  });

  it("excludes a bound parent category", () => {
    // arriendo 350000 + comida 200000 + ahorro 100000
    expect(computePendingByCategory(BUDGET, [], MONTH, envelope("cuentas"))).toBe(650000);
  });

  it("excludes a bound childless leaf category", () => {
    // cuentas 65000 + comida 200000 + ahorro 100000
    expect(computePendingByCategory(BUDGET, [], MONTH, envelope("arriendo"))).toBe(365000);
  });

  it("excludes nothing when the bound category no longer exists in the budget", () => {
    expect(computePendingByCategory(BUDGET, [], MONTH, envelope("deleted"))).toBe(715000);
  });

  it("ignores transactions from other months", () => {
    const list = [
      expenseTx({
        amount: 350000,
        month: "2026-09",
        date: "2026-09-30",
        bucket: "fixed",
        category: { id: "arriendo", name: "Arriendo" },
      }),
    ];

    expect(computePendingByCategory(BUDGET, list, MONTH, null)).toBe(715000);
  });

  it("does not create or reduce pending from unassigned spend", () => {
    const list = [
      expenseTx({ amount: 70000, category: null }),
      expenseTx({ amount: 5000, category: { id: "deleted-leaf", name: "Viejo" } }),
    ];

    expect(computePendingByCategory(BUDGET, list, MONTH, null)).toBe(715000);
  });
});
