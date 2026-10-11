import { describe, it, expect } from "vitest";
import { computeIncomeComparison } from "./incomeComparison";
import type { BudgetConfig } from "./BudgetConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";

const config: BudgetConfig = {
  categories: [],
  incomeSources: [
    { id: "i1", name: "Sueldo", amount: 1_500_000 },
    { id: "i2", name: "Freelance", amount: 300_000 },
  ],
};

let seq = 0;
function income(amount: number, source?: { id: string; name: string }): FinanceV2Transaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    amount,
    date: "2026-10-05",
    month: "2026-10",
    type: "income",
    ...(source ? { source } : {}),
  };
}

describe("computeIncomeComparison", () => {
  it("compares each source's budgeted amount with the income tagged to it", () => {
    const result = computeIncomeComparison(config, [
      income(1_500_000, { id: "i1", name: "Sueldo" }),
      income(100_000, { id: "i2", name: "Freelance" }),
      income(50_000, { id: "i2", name: "Freelance" }),
    ]);

    expect(result.rows).toEqual([
      { id: "i1", name: "Sueldo", budgeted: 1_500_000, real: 1_500_000, difference: 0 },
      { id: "i2", name: "Freelance", budgeted: 300_000, real: 150_000, difference: -150_000 },
    ]);
    expect(result.unassigned).toBe(0);
    expect(result.total).toEqual({ budgeted: 1_800_000, real: 1_650_000, difference: -150_000 });
  });

  it("difference is positive when a source earns more than budgeted", () => {
    const result = computeIncomeComparison(config, [income(2_000_000, { id: "i1", name: "Sueldo" })]);
    expect(result.rows[0].difference).toBe(500_000);
  });

  it("counts an income without a source as unassigned, inside the real total", () => {
    const result = computeIncomeComparison(config, [
      income(80_000),
      income(1_000_000, { id: "i1", name: "Sueldo" }),
    ]);

    expect(result.unassigned).toBe(80_000);
    expect(result.rows.map((r) => r.real)).toEqual([1_000_000, 0]);
    expect(result.total).toEqual({ budgeted: 1_800_000, real: 1_080_000, difference: -720_000 });
  });

  it("counts an income whose source was deleted from the budget as unassigned", () => {
    const result = computeIncomeComparison(config, [income(40_000, { id: "gone", name: "Bono" })]);
    expect(result.unassigned).toBe(40_000);
    expect(result.rows.map((r) => r.real)).toEqual([0, 0]);
    expect(result.total.real).toBe(40_000);
  });

  it("ignores expenses, savings and transfers", () => {
    const others: FinanceV2Transaction[] = [
      { id: "e", amount: 9, date: "2026-10-01", month: "2026-10", type: "expense", bucket: "fixed", category: null },
      { id: "s", amount: 9, date: "2026-10-01", month: "2026-10", type: "savings" },
      { id: "t", amount: 9, date: "2026-10-01", month: "2026-10", type: "transfer" },
    ];
    const result = computeIncomeComparison(config, others);
    expect(result.unassigned).toBe(0);
    expect(result.total).toEqual({ budgeted: 1_800_000, real: 0, difference: -1_800_000 });
  });

  it("works on a config without income sources (data saved before this feature)", () => {
    const result = computeIncomeComparison({ categories: [] }, [income(70_000)]);
    expect(result).toEqual({
      rows: [],
      unassigned: 70_000,
      total: { budgeted: 0, real: 70_000, difference: 70_000 },
    });
  });
});
