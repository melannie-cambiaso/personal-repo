import { describe, it, expect } from "vitest";
import { computePeriodBalance } from "./computePeriodBalance";
import type { SavingsEntry } from "./SavingsEntry";
import type { SavingsPeriod } from "./SavingsPeriod";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

const period = (overrides: Partial<SavingsPeriod>): SavingsPeriod => ({
  id: "p1",
  startedAt: "2026-01-01T00:00:00Z",
  initialAmount: 0,
  ...overrides,
});

describe("computePeriodBalance", () => {
  it("returns the initial amount alone when there are no entries", () => {
    expect(computePeriodBalance([], period({ initialAmount: 5000 }))).toBe(5000);
  });

  it("adds initialAmount to computeBalance(entries)", () => {
    const entries = [entry({ type: "deposito", amount: 1000 }), entry({ type: "gasto", amount: 200 })];

    expect(computePeriodBalance(entries, period({ initialAmount: 5000 }))).toBe(5800);
  });

  it("defaults to computeBalance(entries) alone when initialAmount is 0", () => {
    const entries = [entry({ type: "deposito", amount: 300 })];

    expect(computePeriodBalance(entries, period({ initialAmount: 0 }))).toBe(300);
  });
});
