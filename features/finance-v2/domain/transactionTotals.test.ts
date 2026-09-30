import { describe, it, expect } from "vitest";
import { computeTransactionTotals } from "./transactionTotals";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

describe("computeTransactionTotals", () => {
  it("returns all-zero totals for an empty list", () => {
    expect(computeTransactionTotals([])).toEqual({
      income: 0,
      expense: 0,
      savings: 0,
      transfer: 0,
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

    expect(totals).toEqual({ income: 1000, expense: 400, savings: 250, transfer: 0, balance: 350 });
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
      transfer: 0,
      balance: 650,
    });
  });

  it("reports transfers apart and keeps envelope-paid expenses out of the main expense", () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000000, date: "2026-10-01", month: "2026-10" },
      { id: "t2", type: "transfer", amount: 116000, date: "2026-10-01", month: "2026-10" },
      {
        id: "t3",
        type: "expense",
        amount: 43000,
        date: "2026-10-05",
        month: "2026-10",
        bucket: "fixed",
        category: { id: "luz", name: "Luz" },
        paidFrom: "envelope",
      },
      {
        id: "t4",
        type: "expense",
        amount: 20000,
        date: "2026-10-06",
        month: "2026-10",
        bucket: "variable",
        category: null,
      },
    ];

    expect(computeTransactionTotals(list)).toEqual({
      income: 1000000,
      expense: 20000,
      savings: 0,
      transfer: 116000,
      balance: 864000,
    });
  });

  it("balance is income minus expense minus savings minus transfer", () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-10-01", month: "2026-10" },
      { id: "t2", type: "transfer", amount: 300, date: "2026-10-01", month: "2026-10" },
      { id: "t3", type: "transfer", amount: 100, date: "2026-10-15", month: "2026-10" },
      { id: "t4", type: "savings", amount: 200, date: "2026-10-02", month: "2026-10" },
    ];

    expect(computeTransactionTotals(list)).toEqual({
      income: 1000,
      expense: 0,
      savings: 200,
      transfer: 400,
      balance: 400,
    });
  });

  it("counts a legacy expense without paidFrom as a main-account expense", () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-09-01", month: "2026-09" },
      {
        id: "t2",
        type: "expense",
        amount: 43000,
        date: "2026-09-05",
        month: "2026-09",
        bucket: "fixed",
        category: { id: "luz", name: "Luz" },
      },
    ];

    const totals = computeTransactionTotals(list);

    expect(totals.expense).toBe(43000);
    expect(totals.balance).toBe(1000 - 43000);
  });
});
