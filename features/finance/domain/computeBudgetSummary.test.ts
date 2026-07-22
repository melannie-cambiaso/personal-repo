import { describe, it, expect } from "vitest";
import { computeBudgetSummary } from "./computeBudgetSummary";

describe("computeBudgetSummary", () => {
  it("B3 fixture: available ignores refunds (they're routed to savings), potentialSavings reflects the still-expected gap", () => {
    const result = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 0,
      actualRefund: 100000,
      budgetRefund: 0,
      pendingExpenses: 400000,
    });
    expect(result.actualNet).toBe(1000000);
    expect(result.available).toBe(600000);
    expect(result.potentialSavings).toBe(-100000);
  });

  it("no-refund parity: available is actualNet minus pendingExpenses and potentialSavings is 0 when no refunds exist", () => {
    const result = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 400000,
      actualRefund: 0,
      budgetRefund: 0,
      pendingExpenses: 200000,
    });
    expect(result.available).toBe(result.actualNet - 200000);
    expect(result.potentialSavings).toBe(0);
  });

  it("negative available: pendingExpenses exceeds actualNet", () => {
    const result = computeBudgetSummary({
      actualIncome: 200000,
      actualExpense: 0,
      actualRefund: 0,
      budgetRefund: 0,
      pendingExpenses: 600000,
    });
    expect(result.available).toBe(-400000);
  });

  it("positive potentialSavings: budgetRefund exceeds actualRefund", () => {
    const result = computeBudgetSummary({
      actualIncome: 0,
      actualExpense: 0,
      actualRefund: 50000,
      budgetRefund: 200000,
      pendingExpenses: 0,
    });
    expect(result.potentialSavings).toBe(150000);
  });

  it("actualNet excludes refunds: varying actualRefund does not change actualNet", () => {
    const withoutRefund = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 600000,
      actualRefund: 0,
      budgetRefund: 0,
      pendingExpenses: 0,
    });
    const withRefund = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 600000,
      actualRefund: 100000,
      budgetRefund: 0,
      pendingExpenses: 0,
    });
    expect(withRefund.actualNet).toBe(withoutRefund.actualNet);
    expect(withRefund.actualNet).toBe(400000);
  });

  it("available excludes refunds: varying actualRefund does not change available", () => {
    const withoutRefund = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 600000,
      actualRefund: 0,
      budgetRefund: 0,
      pendingExpenses: 100000,
    });
    const withRefund = computeBudgetSummary({
      actualIncome: 1000000,
      actualExpense: 600000,
      actualRefund: 100000,
      budgetRefund: 0,
      pendingExpenses: 100000,
    });
    expect(withRefund.available).toBe(withoutRefund.available);
    expect(withRefund.available).toBe(300000);
  });
});
