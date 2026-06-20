import { describe, it, expect } from "vitest";
import { computeBalance } from "./computeBalance";
import type { SavingsEntry } from "./SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("computeBalance", () => {
  it("returns 0 for empty array", () => {
    expect(computeBalance([])).toBe(0);
  });

  it("sums only depósitos", () => {
    expect(computeBalance([entry({ amount: 200 }), entry({ amount: 300 })])).toBe(500);
  });

  it("subtracts gastos", () => {
    expect(computeBalance([entry({ type: "gasto", amount: 50 })])).toBe(-50);
  });

  it("computes mixed balance", () => {
    const entries = [
      entry({ type: "deposito", amount: 1000 }),
      entry({ type: "gasto", amount: 200 }),
      entry({ type: "gasto", amount: 150 }),
    ];
    expect(computeBalance(entries)).toBe(650);
  });

  it("returns negative balance when gastos exceed depósitos", () => {
    const entries = [
      entry({ type: "deposito", amount: 100 }),
      entry({ type: "gasto", amount: 500 }),
    ];
    expect(computeBalance(entries)).toBe(-400);
  });
});
