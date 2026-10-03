import { describe, it, expect } from "vitest";
import { computeEnvelopeFlows, monthsFromTo, resolvePaidFrom, suggestedTransfer } from "./envelope";
import type { BudgetConfig } from "./BudgetConfig";
import type { EnvelopeConfig } from "./EnvelopeConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

// 2026-08 has 5 Mondays (see `getWeeksInMonth`).
const FIVE_WEEK_MONTH = "2026-08";

const ENVELOPE: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30000,
  openingMonth: "2026-10",
};

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
  ],
};

function expenseTx(
  overrides: Partial<Extract<FinanceV2Transaction, { type: "expense" }>>
): FinanceV2Transaction {
  return {
    id: "tx-expense",
    amount: 0,
    date: "2026-10-01",
    month: "2026-10",
    type: "expense",
    bucket: "fixed",
    category: null,
    ...overrides,
  };
}

function transferTx(amount: number): FinanceV2Transaction {
  return {
    id: `tx-transfer-${amount}`,
    amount,
    date: "2026-10-01",
    month: "2026-10",
    type: "transfer",
  };
}

describe("computeEnvelopeFlows", () => {
  it("returns zero flows for an empty list", () => {
    expect(computeEnvelopeFlows([])).toEqual({ transferred: 0, paid: 0 });
  });

  it("sums transfers as transferred and envelope-paid expenses as paid", () => {
    const list = [
      transferTx(100000),
      transferTx(16000),
      expenseTx({ amount: 43000, category: { id: "luz", name: "Luz" }, paidFrom: "envelope" }),
      expenseTx({ amount: 18000, category: { id: "agua", name: "Agua" }, paidFrom: "envelope" }),
    ];

    expect(computeEnvelopeFlows(list)).toEqual({ transferred: 116000, paid: 61000 });
  });

  it("ignores main-account expenses, income and savings", () => {
    const list: FinanceV2Transaction[] = [
      expenseTx({ amount: 20000, category: { id: "super", name: "Supermercado" } }),
      { id: "tx-income", amount: 1000000, date: "2026-10-01", month: "2026-10", type: "income" },
      { id: "tx-savings", amount: 50000, date: "2026-10-01", month: "2026-10", type: "savings" },
    ];

    expect(computeEnvelopeFlows(list)).toEqual({ transferred: 0, paid: 0 });
  });
});

describe("monthsFromTo", () => {
  it("lists every month from `from` up to but excluding `toExclusive`", () => {
    expect(monthsFromTo("2026-10", "2026-12")).toEqual(["2026-10", "2026-11"]);
  });

  it("crosses the year boundary", () => {
    expect(monthsFromTo("2026-11", "2027-02")).toEqual(["2026-11", "2026-12", "2027-01"]);
  });

  it("is empty when both months are the same", () => {
    expect(monthsFromTo("2026-10", "2026-10")).toEqual([]);
  });

  it("is empty when `from` is after `toExclusive`", () => {
    expect(monthsFromTo("2026-11", "2026-10")).toEqual([]);
  });
});

describe("resolvePaidFrom", () => {
  it("stamps an expense in a subcategory of the bound category", () => {
    expect(resolvePaidFrom(ENVELOPE, BUDGET, "luz")).toBe("envelope");
  });

  it("stamps an expense in the bound category itself when it is childless", () => {
    const envelope: EnvelopeConfig = { ...ENVELOPE, boundCategoryId: "arriendo" };

    expect(resolvePaidFrom(envelope, BUDGET, "arriendo")).toBe("envelope");
  });

  it("does not stamp the bound category's own id once it has subcategories", () => {
    expect(resolvePaidFrom(ENVELOPE, BUDGET, "cuentas")).toBeUndefined();
  });

  it("does not stamp an expense outside the bound category", () => {
    expect(resolvePaidFrom(ENVELOPE, BUDGET, "super")).toBeUndefined();
    expect(resolvePaidFrom(ENVELOPE, BUDGET, "arriendo")).toBeUndefined();
  });

  it("does not stamp anything when no envelope is configured", () => {
    expect(resolvePaidFrom(null, BUDGET, "luz")).toBeUndefined();
  });

  it("does not stamp an expense with no category", () => {
    expect(resolvePaidFrom(ENVELOPE, BUDGET, null)).toBeUndefined();
  });

  it("does not stamp anything when the bound category no longer exists", () => {
    const envelope: EnvelopeConfig = { ...ENVELOPE, boundCategoryId: "deleted" };

    expect(resolvePaidFrom(envelope, BUDGET, "luz")).toBeUndefined();
    expect(resolvePaidFrom(envelope, BUDGET, "deleted")).toBeUndefined();
  });
});

describe("suggestedTransfer", () => {
  it("suggests a parent bound category's monthly total", () => {
    expect(suggestedTransfer(ENVELOPE, BUDGET, "2026-10")).toBe(65000);
  });

  it("suggests a childless bound category's own monthly amount", () => {
    const envelope: EnvelopeConfig = { ...ENVELOPE, boundCategoryId: "arriendo" };

    expect(suggestedTransfer(envelope, BUDGET, "2026-10")).toBe(350000);
  });

  it("resolves weekly subcategories for the given month", () => {
    const budget: BudgetConfig = {
      categories: [
        {
          id: "cuentas",
          name: "Cuentas",
          bucket: "fixed",
          amount: 0,
          subcategories: [
            { id: "luz", name: "Luz", bucket: "fixed", amount: 45000 },
            { id: "gas", name: "Gas", bucket: "fixed", amount: 1000, frequency: "weekly" },
          ],
        },
      ],
    };

    expect(suggestedTransfer(ENVELOPE, budget, FIVE_WEEK_MONTH)).toBe(45000 + 1000 * 5);
  });

  it("returns null when the bound category no longer exists", () => {
    const envelope: EnvelopeConfig = { ...ENVELOPE, boundCategoryId: "deleted" };

    expect(suggestedTransfer(envelope, BUDGET, "2026-10")).toBeNull();
  });
});
