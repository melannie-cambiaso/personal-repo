import { describe, it, expect } from "vitest";
import { computeActualFromTransactions } from "./computeActualFromTransactions";
import type { FinanceTransaction } from "./FinanceTransaction";

const tx = (overrides: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: "1",
  category: "Comida",
  amount: 100,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("computeActualFromTransactions", () => {
  it("returns empty object for empty array", () => {
    expect(computeActualFromTransactions([])).toEqual({});
  });

  it("maps a single transaction to its category", () => {
    const result = computeActualFromTransactions([tx({ category: "Comida", amount: 500 })]);
    expect(result).toEqual({ Comida: 500 });
  });

  it("accumulates multiple transactions in the same category", () => {
    const result = computeActualFromTransactions([
      tx({ category: "Comida", amount: 300 }),
      tx({ id: "2", category: "Comida", amount: 200 }),
    ]);
    expect(result).toEqual({ Comida: 500 });
  });

  it("sums each category independently when multiple categories exist", () => {
    const result = computeActualFromTransactions([
      tx({ category: "Comida", amount: 400 }),
      tx({ id: "2", category: "Planes", amount: 150 }),
      tx({ id: "3", category: "Comida", amount: 100 }),
      tx({ id: "4", category: "Planes", amount: 50 }),
    ]);
    expect(result).toEqual({ Comida: 500, Planes: 200 });
  });
});
