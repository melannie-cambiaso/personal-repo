import { describe, it, expect } from "vitest";
import { computeSavingsFundFlows } from "./savingsFund";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

const base = { date: "2026-10-05", month: "2026-10" };

describe("computeSavingsFundFlows", () => {
  it("returns zero flows for an empty list", () => {
    expect(computeSavingsFundFlows([])).toEqual({ deposited: 0, withdrawn: 0, spent: 0 });
  });

  it("sums savings deposits, withdrawals and fund-paid expenses apart", () => {
    const list: FinanceV2Transaction[] = [
      { id: "1", type: "savings", amount: 50000, ...base },
      { id: "2", type: "savings", amount: 10000, ...base },
      { id: "3", type: "withdrawal", amount: 20000, ...base },
      {
        id: "4",
        type: "expense",
        amount: 7000,
        bucket: "variable",
        category: { id: "super", name: "Supermercado" },
        paidFrom: "savingsFund",
        ...base,
      },
    ];

    expect(computeSavingsFundFlows(list)).toEqual({
      deposited: 60000,
      withdrawn: 20000,
      spent: 7000,
    });
  });

  it("ignores main-account expenses, envelope-paid expenses, income and transfers", () => {
    const list: FinanceV2Transaction[] = [
      { id: "1", type: "income", amount: 900, ...base },
      { id: "2", type: "transfer", amount: 800, ...base },
      { id: "3", type: "expense", amount: 700, bucket: "fixed", category: null, ...base },
      {
        id: "4",
        type: "expense",
        amount: 600,
        bucket: "fixed",
        category: null,
        paidFrom: "envelope",
        ...base,
      },
    ];

    expect(computeSavingsFundFlows(list)).toEqual({ deposited: 0, withdrawn: 0, spent: 0 });
  });
});
