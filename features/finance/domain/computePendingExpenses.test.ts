import { describe, it, expect } from "vitest";
import { computePendingExpenses } from "./computePendingExpenses";

describe("computePendingExpenses", () => {
  it("returns 0 for empty category list", () => {
    expect(computePendingExpenses({}, {}, [])).toBe(0);
  });

  it("returns the sum of positive remainders when all categories are under budget", () => {
    expect(
      computePendingExpenses({ food: 100, tx: 50 }, { food: 60, tx: 30 }, ["food", "tx"])
    ).toBe(60); // (100-60) + (50-30) = 40+20
  });

  it("returns 0 when all categories are over budget", () => {
    expect(computePendingExpenses({ food: 100 }, { food: 150 }, ["food"])).toBe(0);
  });

  it("sums only positive remainders for mixed over/under categories", () => {
    expect(
      computePendingExpenses({ food: 100, tx: 50 }, { food: 150, tx: 20 }, ["food", "tx"])
    ).toBe(30); // food over: 0, tx: 50-20=30
  });

  it("treats missing actual key as 0 (full budget amount counts as unspent)", () => {
    expect(computePendingExpenses({ food: 100 }, {}, ["food"])).toBe(100);
  });

  it("treats missing budget key as 0 (contributes 0 to the sum)", () => {
    expect(computePendingExpenses({}, { food: 50 }, ["food"])).toBe(0);
  });

  it("returns 0 when budget equals actual exactly", () => {
    expect(computePendingExpenses({ food: 100 }, { food: 100 }, ["food"])).toBe(0);
  });

  it("ignores closed categories in pending calculation", () => {
    expect(
      computePendingExpenses(
        { food: 100, rent: 500 },
        { food: 60, rent: 0 },
        ["food", "rent"],
        ["rent"]
      )
    ).toBe(40); // rent skipped; only food: 100-60=40
  });

  it("returns 0 when all expense categories are closed", () => {
    expect(computePendingExpenses({ food: 100 }, { food: 0 }, ["food"], ["food"])).toBe(0);
  });

  it("treats undefined closedCategories as empty (backward compat)", () => {
    expect(computePendingExpenses({ food: 100 }, { food: 60 }, ["food"], undefined)).toBe(40);
  });
});
