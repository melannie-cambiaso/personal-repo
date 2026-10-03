import { describe, it, expect } from "vitest";
import { resolveLeafMonthlyAmount, resolveLeafWeeks } from "./budgetAmount";

// 2026-05 has 5 Sundays but 4 Mondays (weekday uses `Date#getDay`: 0 = Sunday).

describe("resolveLeafMonthlyAmount", () => {
  it("returns the amount as-is for a monthly leaf (frequency omitted)", () => {
    expect(resolveLeafMonthlyAmount({ amount: 100_000 }, "2026-08")).toBe(100_000);
  });

  it("returns the amount as-is for an explicit monthly leaf", () => {
    expect(resolveLeafMonthlyAmount({ amount: 100_000, frequency: "monthly" }, "2026-08")).toBe(
      100_000
    );
  });

  it("scales a weekly leaf's amount by the number of weeks in a 5-Monday month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly" }, "2026-08")).toBe(
      100_000
    );
  });

  it("scales a weekly leaf's amount by the number of weeks in a 4-Monday month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly" }, "2026-09")).toBe(
      80_000
    );
  });

  it("returns 0 for a zero-amount weekly leaf regardless of weeks in month", () => {
    expect(resolveLeafMonthlyAmount({ amount: 0, frequency: "weekly" }, "2026-08")).toBe(0);
  });

  it("scales a weekly leaf by the occurrences of its own weekday, not Mondays", () => {
    expect(
      resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly", weekday: 0 }, "2026-05")
    ).toBe(100_000);
    expect(resolveLeafMonthlyAmount({ amount: 20_000, frequency: "weekly" }, "2026-05")).toBe(
      80_000
    );
  });

  it("ignores weekday for a monthly leaf", () => {
    expect(
      resolveLeafMonthlyAmount({ amount: 100_000, frequency: "monthly", weekday: 0 }, "2026-05")
    ).toBe(100_000);
  });
});

describe("resolveLeafWeeks", () => {
  it("counts the leaf's weekday in the month", () => {
    expect(resolveLeafWeeks({ amount: 0, frequency: "weekly", weekday: 0 }, "2026-05")).toBe(5);
  });

  it("defaults to Mondays when weekday is absent (backward compatible)", () => {
    expect(resolveLeafWeeks({ amount: 0, frequency: "weekly" }, "2026-05")).toBe(4);
  });
});
