import { describe, it, expect } from "vitest";
import { computeTotalToReplenish } from "./computeTotalToReplenish";
import type { SavingsEntry } from "./SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "gasto",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("computeTotalToReplenish", () => {
  it("returns 0 for empty array", () => {
    expect(computeTotalToReplenish([])).toBe(0);
  });

  it("returns 0 when no gasto has toReplenish=true", () => {
    expect(computeTotalToReplenish([entry({ amount: 200 }), entry({ amount: 300 })])).toBe(0);
  });

  it("sums only gastos with toReplenish=true", () => {
    const entries = [
      entry({ amount: 200, toReplenish: true }),
      entry({ amount: 100, toReplenish: false }),
    ];
    expect(computeTotalToReplenish(entries)).toBe(200);
  });

  it("sums all when all gastos have toReplenish=true", () => {
    const entries = [
      entry({ amount: 100, toReplenish: true }),
      entry({ amount: 250, toReplenish: true }),
    ];
    expect(computeTotalToReplenish(entries)).toBe(350);
  });

  it("never counts depósitos even if toReplenish=true", () => {
    const entries = [
      entry({ type: "deposito", amount: 500, toReplenish: true }),
      entry({ type: "gasto", amount: 100, toReplenish: true }),
    ];
    expect(computeTotalToReplenish(entries)).toBe(100);
  });
});
