import { describe, it, expect } from "vitest";
import { resolveLeafMonthlyAmount } from "./budgetAmount";

describe("resolveLeafMonthlyAmount", () => {
  it("returns the amount as-is for a monthly leaf (frequency omitted)", () => {
    expect(resolveLeafMonthlyAmount({ amount: 100_000 }, "2026-08")).toBe(100_000);
  });

  it("returns the amount as-is for an explicit monthly leaf", () => {
    expect(resolveLeafMonthlyAmount({ amount: 100_000, frequency: "monthly" }, "2026-08")).toBe(
      100_000,
    );
  });

  it("scales a weekly leaf's amount by the number of weeks in a 5-Monday month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly" }, "2026-08")).toBe(
      100_000,
    );
  });

  it("scales a weekly leaf's amount by the number of weeks in a 4-Monday month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly" }, "2026-09")).toBe(
      80_000,
    );
  });

  it("returns 0 for a zero-amount weekly leaf regardless of weeks in month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 0, frequency: "weekly" }, "2026-08")).toBe(0);
  });
});
