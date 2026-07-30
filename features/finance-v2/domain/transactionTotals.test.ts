import { describe, it, expect } from "vitest";
import { computeTransactionTotals } from "./transactionTotals";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

describe("computeTransactionTotals", () => {
  it("returns all-zero totals for an empty list", () => {
    expect(computeTransactionTotals([])).toEqual({
      income: 0,
      expense: 0,
      savings: 0,
      balance: 0,
    });
  });

  it("balance is income minus expense minus savings", () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
      {
        id: "t2",
        type: "expense",
        amount: 400,
        date: "2026-07-02",
        month: "2026-07",
        bucket: "fixed",
        category: null,
      },
      { id: "t3", type: "savings", amount: 250, date: "2026-07-03", month: "2026-07" },
    ];

    const totals = computeTransactionTotals(list);

    expect(totals).toEqual({ income: 1000, expense: 400, savings: 250, balance: 350 });
  });

  it("sums multiple transactions of the same type", () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 500, date: "2026-07-01", month: "2026-07" },
      { id: "t2", type: "income", amount: 300, date: "2026-07-05", month: "2026-07" },
      {
        id: "t3",
        type: "expense",
        amount: 100,
        date: "2026-07-02",
        month: "2026-07",
        bucket: "variable",
        category: null,
      },
      {
        id: "t4",
        type: "expense",
        amount: 50,
        date: "2026-07-06",
        month: "2026-07",
        bucket: "fixed",
        category: null,
      },
    ];

    expect(computeTransactionTotals(list)).toEqual({
      income: 800,
      expense: 150,
      savings: 0,
      balance: 650,
    });
  });
});
